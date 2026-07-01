import asyncio
import httpx
import logging
from sqlalchemy import select
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.api.v1.endpoints.wallet import fetch_all_prices, convert_ton_address_to_hex

logger = logging.getLogger(__name__)

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
    url = f"https://tonapi.io/v2/accounts/{master_wallet}/events?limit=25"
    
    decimals_map = {
        "TON": 9,
        "USDT": 6,
        "USDC": 6,
        "BTC": 8,
        "ETH": 9
    }
    
    while True:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    events_data = res.json()
                    events = events_data.get("events", [])
                    
                    if events:
                        # Fetch fresh token prices
                        prices = await fetch_all_prices()
                        
                        # Process each event
                        for event in events:
                            event_id = event.get("event_id")
                            if not event_id:
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
                            
                            for action in actions:
                                if action.get("status") != "ok":
                                    continue
                                    
                                action_type = action.get("type")
                                
                                if action_type == "TonTransfer":
                                    ton_transfer = action.get("TonTransfer", {})
                                    recipient = ton_transfer.get("recipient", {}).get("address", "")
                                    sender = ton_transfer.get("sender", {}).get("address", "")
                                    amount_nano = int(ton_transfer.get("amount", 0))
                                    comment = ton_transfer.get("comment", "").strip()
                                    
                                    try:
                                        recipient_raw = convert_ton_address_to_hex(recipient)
                                        master_raw = convert_ton_address_to_hex(master_wallet)
                                    except Exception:
                                        continue
                                        
                                    if recipient_raw == master_raw and comment.startswith("ref_"):
                                        try:
                                            telegram_id = int(comment[4:])
                                            ton_amount = amount_nano / 1_000_000_000.0
                                            ton_price = prices.get("TON", 5.40)
                                            amount_cents = int(round(ton_amount * ton_price * 100))
                                            sender_addr = sender
                                            currency_symbol = "TON"
                                            verified_tx = True
                                            break
                                        except Exception:
                                            continue
                                            
                                elif action_type == "JettonTransfer":
                                    jetton_transfer = action.get("JettonTransfer", {})
                                    recipient = jetton_transfer.get("recipient", {}).get("address", "")
                                    sender = jetton_transfer.get("sender", {}).get("address", "")
                                    amount_raw = int(jetton_transfer.get("amount", 0))
                                    comment = jetton_transfer.get("comment", "").strip()
                                    jetton_master = jetton_transfer.get("jetton", {}).get("address", "")
                                    
                                    try:
                                        recipient_raw = convert_ton_address_to_hex(recipient)
                                        master_raw = convert_ton_address_to_hex(master_wallet)
                                        jetton_master_raw = convert_ton_address_to_hex(jetton_master)
                                    except Exception:
                                        continue
                                        
                                    if recipient_raw == master_raw and comment.startswith("ref_"):
                                        try:
                                            telegram_id = int(comment[4:])
                                            # Find matching Jetton symbol
                                            matched_symbol = None
                                            masters = {
                                                "USDT": settings.USDT_MASTER,
                                                "USDC": settings.USDC_MASTER,
                                                "BTC": settings.BTC_MASTER,
                                                "ETH": settings.ETH_MASTER
                                            }
                                            for sym, addr in masters.items():
                                                if convert_ton_address_to_hex(addr) == jetton_master_raw:
                                                    matched_symbol = sym
                                                    break
                                            
                                            if matched_symbol:
                                                decimals = decimals_map.get(matched_symbol, 6)
                                                token_amount = amount_raw / (10 ** decimals)
                                                token_price = prices.get(matched_symbol, 1.00)
                                                amount_cents = int(round(token_amount * token_price * 100))
                                                sender_addr = sender
                                                currency_symbol = matched_symbol
                                                verified_tx = True
                                                break
                                        except Exception:
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
                                            
                                        # Deduct 5% platform fee
                                        credited_amount = int(round(amount_cents / 1.05))
                                        fee = amount_cents - credited_amount
                                        
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
                                        await db.refresh(user)
                                        
                                        # Send telegram notification
                                        try:
                                            from app.services.telegram_bot import TelegramService
                                            sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
                                            notification_text = (
                                                f"<b>⚡️ Cyber Web3 Top-Up Confirmed (Auto-Synced)!</b>\n\n"
                                                f"• <b>Sender Address:</b> <code>{sender_display}</code>\n"
                                                f"• <b>Currency:</b> {currency_symbol}\n"
                                                f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
                                                f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT\n"
                                                f"• <b>Transaction ID:</b> <code>{event_id[:10]}...{event_id[-8:] if len(event_id) > 8 else ''}</code>\n\n"
                                                f"<i>Your balance has been automatically synced. Platform Balance: {user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
                                            )
                                            await TelegramService.send_notification(telegram_id, notification_text)
                                        except Exception as notification_err:
                                            logger.warning(f"Failed to send telegram notification for synced deposit: {notification_err}")
                                            
                                        logger.info(f"DepositCrawler: Successfully processed synced deposit for user {telegram_id}.")
                else:
                    logger.warning(f"DepositCrawler: TonAPI returned status {res.status_code}")
        except Exception as loop_err:
            logger.error(f"Error in background deposit crawler loop: {loop_err}", exc_info=True)
            
        # Poll every 90 seconds
        await asyncio.sleep(90)
