import asyncio
import httpx
import logging
from sqlalchemy import select
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.api.v1.endpoints.wallet import convert_ton_address_to_hex, _is_usdt_master, _split_web3_top_up, is_master_usdt_receipt
from app.core.logger import exception_summary

logger = logging.getLogger(__name__)

# Each pass re-reads this much history so a burst of wallet activity, a restart
# or a TonAPI outage cannot push an uncredited deposit out of view; already
# credited events are skipped by their reference id.
LOOKBACK_SECONDS = 48 * 3600
PAGE_SIZE = 100
MAX_PAGES = 10


async def fetch_recent_events(client, base_url: str, headers: dict):
    """Page back through the master wallet's events to LOOKBACK_SECONDS.

    Returns (status, events): status is 200 when at least one page was read
    (a later page failing still yields the events already fetched), else the
    first page's HTTP status.
    """
    import time
    cutoff = time.time() - LOOKBACK_SECONDS
    events, before_lt, first_status = [], None, None
    for _ in range(MAX_PAGES):
        params = {"limit": PAGE_SIZE}
        if before_lt:
            params["before_lt"] = before_lt
        res = await client.get(base_url, headers=headers, params=params)
        if first_status is None:
            first_status = res.status_code
        if res.status_code != 200:
            break
        data = res.json()
        page = data.get("events", [])
        events.extend(page)
        before_lt = data.get("next_from")
        if not page or not before_lt or min(e.get("timestamp", 0) for e in page) < cutoff:
            break
    else:
        logger.warning("DepositCrawler: lookback hit %s pages; older events not re-checked this pass", MAX_PAGES)
    return (200 if events or first_status == 200 else first_status), events


async def start_deposit_crawler():
    """
    Background loop that polls TonAPI for incoming transfers to the MASTER_WALLET_ADDRESS,
    checking for uncredited deposits due to connection drops or app closures.
    """
    settings = get_settings()
    # Wait for startup sequences to settle
    await asyncio.sleep(20)
    logger.info("Background deposit crawler started.")
    
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
    master_wallet = settings.MASTER_WALLET_ADDRESS
    if not master_wallet:
        logger.warning("DepositCrawler: MASTER_WALLET_ADDRESS not configured. Background crawler idle.")
        return

    base_url = f"https://tonapi.io/v2/accounts/{master_wallet}/events"

    while True:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                try:
                    status, events = await fetch_recent_events(client, base_url, headers)
                except Exception as api_err:
                    logger.warning(
                        "DepositCrawler: TonAPI request failed; retrying in 90s (%s)",
                        exception_summary(api_err),
                    )
                    await asyncio.sleep(90)
                    continue

                if status == 200:

                    if events:
                        # USDT-only settlement: no price feed needed — USDT is 1:1.
                        # Process each event
                        for event in events:
                            event_id = event.get("event_id")
                            if not event_id:
                                continue
                            # Credit only settled traces; an in-progress one is
                            # picked up again on a later pass.
                            if event.get("in_progress"):
                                continue
                                
                            # Check if we already processed this event_id in DB
                            async with AsyncSessionLocal() as db:
                                existing_tx = await db.execute(
                                    select(Transaction).filter(Transaction.reference_id == event_id)
                                )
                                if existing_tx.scalars().first():
                                    # Already processed, skip
                                    continue
                            
                            # Parse actions inside the event
                            actions = event.get("actions", [])
                            verified_tx = False
                            amount_cents = 0
                            sender_addr = "unknown"
                            currency_symbol = "USDT"
                            telegram_id = None
                            # USDT-only: a non-USDT asset (TON or another jetton) sent to
                            # the master with a ref_ comment is REAL money we will not
                            # auto-credit. Flag it so we can alert the treasury to handle
                            # it manually (convert / refund), but never credit it.
                            non_usdt_detected = False
                            non_usdt_symbol = None
                            non_usdt_tg = None

                            for action in actions:
                                if action.get("status") != "ok":
                                    continue

                                action_type = action.get("type")

                                if action_type == "TonTransfer":
                                    ton_transfer = action.get("TonTransfer", {})
                                    recipient = ton_transfer.get("recipient", {}).get("address", "")
                                    comment = ton_transfer.get("comment", "").strip()

                                    try:
                                        recipient_raw = convert_ton_address_to_hex(recipient)
                                        master_raw = convert_ton_address_to_hex(master_wallet)
                                    except Exception:
                                        continue

                                    clean_comment = comment.strip()
                                    if recipient_raw == master_raw and clean_comment.startswith("ref_"):
                                        # Native TON is not creditable under USDT-only.
                                        non_usdt_detected = True
                                        non_usdt_symbol = "TON"
                                        try:
                                            ref_part = clean_comment[4:].split("_")[0].strip()
                                            non_usdt_tg = int(ref_part)
                                        except Exception:
                                            non_usdt_tg = None
                                        continue

                                elif action_type == "JettonTransfer":
                                    jetton_transfer = action.get("JettonTransfer", {})
                                    recipient = jetton_transfer.get("recipient", {}).get("address", "")
                                    sender = jetton_transfer.get("sender", {}).get("address", "")
                                    amount_raw = int(jetton_transfer.get("amount", 0))
                                    comment = jetton_transfer.get("comment", "").strip()
                                    jetton_master = jetton_transfer.get("jetton", {}).get("address", "")
                                    jetton_symbol = jetton_transfer.get("jetton", {}).get("symbol", "").upper()

                                    try:
                                        recipient_raw = convert_ton_address_to_hex(recipient)
                                        master_raw = convert_ton_address_to_hex(master_wallet)
                                    except Exception:
                                        continue

                                    clean_comment = comment.strip()
                                    if recipient_raw == master_raw and clean_comment.startswith("ref_"):
                                        if _is_usdt_master(jetton_master):
                                            if not await is_master_usdt_receipt(jetton_transfer):
                                                logger.warning("DepositCrawler: USDT-labelled transfer in %s did not reach the master's USDT jetton wallet", event_id)
                                                continue
                                            try:
                                                ref_part = clean_comment[4:].split("_")[0].strip()
                                                telegram_id = int(ref_part)
                                                # USDT: 6 decimals, credit at face value.
                                                token_amount = amount_raw / (10 ** 6)
                                                amount_cents = int(round(token_amount * 100))
                                                sender_addr = sender
                                                currency_symbol = "USDT"
                                                verified_tx = True
                                                break
                                            except Exception:
                                                continue
                                        else:
                                            # Non-USDT jetton (USDC/BTC/ETH/other).
                                            non_usdt_detected = True
                                            non_usdt_symbol = jetton_symbol or "JETTON"
                                            try:
                                                ref_part = clean_comment[4:].split("_")[0].strip()
                                                non_usdt_tg = int(ref_part)
                                            except Exception:
                                                non_usdt_tg = None
                                            continue

                            # Alert the treasury about un-creditable non-USDT deposits so
                            # they can be converted/refunded manually. Rate-limited per
                            # (user, asset) so a single arrival doesn't spam.
                            if non_usdt_detected and not verified_tx:
                                try:
                                    from app.core.alerts import send_alert_with_redis_rate_limit
                                    await send_alert_with_redis_rate_limit(
                                        f"nonusdt_deposit:{non_usdt_tg}:{non_usdt_symbol}",
                                        (
                                            "💱 <b>Non-USDT deposit received — NOT auto-credited</b>\n\n"
                                            f"• <b>Asset:</b> {non_usdt_symbol}\n"
                                            f"• <b>User:</b> <code>{non_usdt_tg}</code>\n"
                                            f"• <b>Event:</b> <code>{event_id}</code>\n\n"
                                            "<i>Under USDT-only settlement the platform does not credit this. "
                                            "Convert or refund it manually.</i>"
                                        ),
                                        system="treasury",
                                    )
                                except Exception as alert_err:
                                    logger.warning(f"Failed to send non-USDT deposit alert: {alert_err}")
                                continue

                            if verified_tx and telegram_id and amount_cents > 0:
                                # Process the deposit (credit user balance and log transactions)
                                logger.info(f"DepositCrawler: Found uncredited transfer in event {event_id} for user {telegram_id}. Amount: {amount_cents} cents. Processing...")
                                
                                async with AsyncSessionLocal() as db:
                                    # Acquire user lock and credit the balance
                                    user_result = await db.execute(
                                        select(User).filter(User.telegram_id == telegram_id).with_for_update()
                                    )
                                    user = user_result.scalars().first()
                                    
                                    if user:
                                        # Double check replay protection (inside lock)
                                        existing_tx_result = await db.execute(
                                            select(Transaction).filter(Transaction.reference_id == event_id)
                                        )
                                        if existing_tx_result.scalars().first():
                                            continue
                                            
                                        # Deduct 5% platform fee using shared helper
                                        credited_amount, fee = _split_web3_top_up(amount_cents)
                                        
                                        user.balance += credited_amount
                                        db.add(user)
                                        
                                        # Log deposit transaction
                                        tx_deposit = Transaction(
                                            user_id=telegram_id,
                                            type="deposit",
                                            amount=credited_amount,
                                            fee=fee,
                                            status="completed",
                                            reference_id=event_id
                                        )
                                        db.add(tx_deposit)
                                        
                                        # Log fee transaction
                                        tx_fee = Transaction(
                                            user_id=telegram_id,
                                            type="deposit_fee",
                                            amount=-fee,
                                            fee=0,
                                            status="completed",
                                            reference_id=f"fee_{event_id[:16]}"
                                        )
                                        db.add(tx_fee)
                                        
                                        await db.commit()
                                        from app.services.gram_rewards import check_referral_after_deposit
                                        await check_referral_after_deposit(db, user.id)
                                        await db.refresh(user)
                                        
                                        # Send telegram notification
                                        try:
                                            from app.services.telegram_bot import TelegramService
                                            sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
                                            notification_text = (
                                                f"<b>⚡️ Cyber Web3 Top-Up Confirmed (Auto-Synced)!</b>\n\n"
                                                f"• <b>Sender Address:</b> <a href=\"https://tonviewer.com/{sender_addr}\">{sender_display}</a> 🔗\n"
                                                f"• <b>Currency:</b> {currency_symbol}\n"
                                                f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
                                                f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT\n"
                                                f"• <b>Transaction ID:</b> <a href=\"https://tonviewer.com/transaction/{event_id}\">{event_id[:10]}...{event_id[-8:] if len(event_id) > 8 else ''}</a> 🔗\n\n"
                                                f"<i>Your balance has been automatically synced. Platform Balance: {user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
                                            )
                                            await TelegramService.send_notification(telegram_id, notification_text)
                                        except Exception as notification_err:
                                            logger.warning(f"Failed to send telegram notification for synced deposit: {notification_err}")
                                            
                                        # Send admin alert
                                        try:
                                            from app.core.alerts import send_deposit_alert
                                            await send_deposit_alert(
                                                deposit_type="USDT",
                                                username=user.username,
                                                telegram_id=telegram_id,
                                                amount=amount_cents / 100.0,
                                                tx_id=event_id
                                            )
                                        except Exception as e:
                                            logger.warning(f"Failed to send admin deposit alert: {e}")
                                            
                                        logger.info(f"DepositCrawler: Successfully processed synced deposit for user {telegram_id}.")
                elif status == 429:
                    logger.warning("DepositCrawler: TonAPI rate limited (429). Backing off for 120s.")
                    await asyncio.sleep(120)
                    continue
                else:
                    logger.warning(f"DepositCrawler: TonAPI returned status {status}")
        except Exception as loop_err:
            logger.error(f"Error in background deposit crawler loop: {loop_err}", exc_info=True)
            
        # Poll every 90 seconds
        await asyncio.sleep(90)
