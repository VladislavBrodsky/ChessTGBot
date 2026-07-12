from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)
from sqlalchemy.future import select  # noqa: E402
from sqlalchemy import desc, func, or_  # noqa: E402
from app.core.database import get_db, get_read_db  # noqa: E402
from app.api.v1.deps import get_current_user, get_current_telegram_id, rate_limit  # noqa: E402
from app.models.user import User  # noqa: E402
from app.models.transaction import Transaction  # noqa: E402
from app.crud import user as user_crud  # noqa: E402
from pydantic import BaseModel, ConfigDict  # noqa: E402
from typing import List, Optional  # noqa: E402
from datetime import datetime, timezone, timedelta  # noqa: E402

router = APIRouter()

import base64  # noqa: E402

def crc16(data: bytes) -> int:
    crc = 0x0000
    for byte in data:
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc = crc << 1
            crc &= 0xffff
    return crc

def convert_ton_address_to_hex(addr: str) -> str:
    # If already in raw hex format (e.g. "0:hash"), normalize casing and return
    if ":" in addr:
        parts = addr.split(":")
        if len(parts) == 2:
            try:
                int(parts[1], 16)
                return f"{parts[0]}:{parts[1].lower()}"
            except ValueError:
                pass

    # Normalize base64url padding
    addr = addr.replace('-', '+').replace('_', '/')
    missing_padding = len(addr) % 4
    if missing_padding:
        addr += '=' * (4 - missing_padding)
    
    try:
        decoded = base64.b64decode(addr)
    except Exception:
        raise ValueError("Invalid base64 TON address")
        
    if len(decoded) != 36:
        raise ValueError("Invalid TON address length")
        
    workchain = decoded[1]
    wc = -1 if workchain == 255 else workchain
    hash_bytes = decoded[2:34]
    return f"{wc}:{hash_bytes.hex().lower()}"

def convert_raw_to_friendly(raw_addr: str, bounceable: bool = True) -> str:
    if ":" not in raw_addr:
        return raw_addr
    try:
        parts = raw_addr.split(":")
        workchain = int(parts[0])
        hex_hash = parts[1]
        
        flag = 0x11 if bounceable else 0x51
        wc_byte = 0xff if workchain == -1 else workchain
        buf = bytes([flag, wc_byte]) + bytes.fromhex(hex_hash)
        chk = crc16(buf)
        final_buf = buf + chk.to_bytes(2, "big")
        return base64.urlsafe_b64encode(final_buf).decode("utf-8").rstrip('=')
    except Exception:
        return raw_addr


# ---------------------------------------------------------------------------
# USDT-only settlement guards
# ---------------------------------------------------------------------------
# The platform credits deposits ONLY in USDT (1:1 with USD). Crediting a
# volatile asset (TON/BTC/ETH) at its USD value would make the platform hold a
# basket while owing USD — uncontrolled FX / insolvency risk. Every deposit
# credit path (interactive verify, webhook, background crawler) gates on these.

def _is_usdt_master(jetton_master_address: str) -> bool:
    """True iff the given jetton master is the configured USDT master."""
    from app.core.config import get_settings
    s = get_settings()
    if not jetton_master_address or not s.USDT_MASTER:
        return False
    try:
        return convert_ton_address_to_hex(jetton_master_address) == convert_ton_address_to_hex(s.USDT_MASTER)
    except Exception:
        return False


_master_usdt_jetton_wallet_cache = {"hex": None}

async def get_master_usdt_jetton_wallet_hex() -> Optional[str]:
    """
    Resolve (and cache) the master wallet's USDT jetton wallet address in raw hex.
    Used by the watched-account webhook to verify that a transfer_notification
    actually originated from the master's USDT jetton wallet — i.e. that it is a
    genuine USDT deposit and not native TON or a spoofed/worthless jetton. The
    address is static, so it is cached for the process lifetime.
    """
    if _master_usdt_jetton_wallet_cache["hex"]:
        return _master_usdt_jetton_wallet_cache["hex"]
    from app.core.config import get_settings
    s = get_settings()
    if not s.MASTER_WALLET_ADDRESS or not s.USDT_MASTER:
        return None
    import httpx
    headers = {}
    if s.TON_API_KEY:
        headers["Authorization"] = f"Bearer {s.TON_API_KEY}"
    url = f"https://tonapi.io/v2/accounts/{s.MASTER_WALLET_ADDRESS}/jettons/{s.USDT_MASTER}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code != 200:
                return None
            data = res.json()
        jw = data.get("wallet_address", {}).get("address")
        if not jw:
            return None
        hex_addr = convert_ton_address_to_hex(jw)
        _master_usdt_jetton_wallet_cache["hex"] = hex_addr
        return hex_addr
    except Exception:
        return None


_prices_cache = {
    "prices": None,
    "last_fetched": 0.0
}

async def fetch_all_prices() -> dict:
    """
    Fetches the current prices in USD for TON, USDT, USDC, BTC, and ETH.
    Uses TonAPI rates and falls back to CoinGecko and hardcoded defaults.
    Caches the result in Redis for 60 seconds (falls back to memory).
    """
    import time
    import json
    from app.services.session_manager import SessionManager
    
    redis_client = None
    try:
        mgr = SessionManager()
        if not SessionManager._use_memory and mgr.redis:
            redis_client = mgr.redis
    except Exception:
        pass
        
    now = time.time()
    
    if redis_client:
        try:
            cached_val = await redis_client.get("cache:all_prices")
            if cached_val:
                return json.loads(cached_val)
        except Exception:
            pass
    else:
        # Fallback to local memory cache
        if _prices_cache["prices"] and (now - _prices_cache["last_fetched"] < 60.0):
            return _prices_cache["prices"]

    import httpx
    from app.core.config import get_settings
    settings = get_settings()
    
    tokens = {
        "TON": "ton",
        "USDT": settings.USDT_MASTER,
        "USDC": settings.USDC_MASTER,
        "BTC": settings.BTC_MASTER,
        "ETH": settings.ETH_MASTER
    }
    
    url = f"https://tonapi.io/v2/rates?tokens={','.join(tokens.values())}&currencies=usd"
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
    prices = {}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                rates = data.get("rates", {})
                
                for symbol, addr in tokens.items():
                    val = rates.get(addr) or rates.get(symbol.upper()) or rates.get(symbol.lower())
                    if val and "prices" in val and "USD" in val["prices"]:
                        prices[symbol] = float(val["prices"]["USD"])
                
                if len(prices) == 5:
                    if redis_client:
                        try:
                            await redis_client.set("cache:all_prices", json.dumps(prices), ex=60)
                        except Exception:
                            pass
                    _prices_cache["prices"] = prices
                    _prices_cache["last_fetched"] = now
                    return prices
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch prices from TonAPI: {e}")

    # Fallback to CoinGecko
    try:
        cg_ids = {
            "TON": "the-open-network",
            "USDT": "tether",
            "USDC": "usd-coin",
            "BTC": "bitcoin",
            "ETH": "ethereum"
        }
        url_cg = f"https://api.coingecko.com/api/v3/simple/price?ids={','.join(cg_ids.values())}&vs_currencies=usd"
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url_cg)
            if res.status_code == 200:
                data = res.json()
                prices = {}
                for symbol, cg_id in cg_ids.items():
                    val = data.get(cg_id, {}).get("usd")
                    if val is not None:
                        prices[symbol] = float(val)
                if len(prices) == 5:
                    if redis_client:
                        try:
                            await redis_client.set("cache:all_prices", json.dumps(prices), ex=60)
                        except Exception:
                            pass
                    _prices_cache["prices"] = prices
                    _prices_cache["last_fetched"] = now
                    return prices
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch prices from CoinGecko: {e}")

    # Fallback to older cached version if available
    if _prices_cache["prices"]:
        return _prices_cache["prices"]

    return {
        "TON": 5.40,
        "USDT": 1.00,
        "USDC": 1.00,
        "BTC": 65000.00,
        "ETH": 35000.00
    }

class BalanceResponse(BaseModel):
    balance: int
    wallet_address: Optional[str] = None
    master_wallet_address: str

class DepositVerifyRequest(BaseModel):
    message_hash: str

class WithdrawRequest(BaseModel):
    amount: int  # In cents
    address: str

class WithdrawResponse(BaseModel):
    status: str
    amount: int
    new_balance: int

class TransactionItem(BaseModel):
    id: int
    type: str  # 'deposit', 'withdrawal', 'game_wager', 'game_win', 'deposit_fee', 'game_rake', 'referral_commission'
    amount: int
    fee: int
    status: str
    reference_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ConnectWalletRequest(BaseModel):
    wallet_address: str

@router.get("/balance", response_model=BalanceResponse)
async def get_wallet_balance(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user platform balance and connected wallet address.
    """
    from app.core.config import get_settings
    settings = get_settings()
    return BalanceResponse(
        balance=current_user.balance,
        wallet_address=current_user.wallet_address,
        master_wallet_address=settings.MASTER_WALLET_ADDRESS
    )

@router.post("/connect", response_model=BalanceResponse)
async def connect_web3_wallet(
    request: ConnectWalletRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Connect a TON web3 wallet address to the user's account.
    """
    try:
        updated_user = await user_crud.update_wallet_address(db, current_user, request.wallet_address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BalanceResponse(
        balance=updated_user.balance,
        wallet_address=updated_user.wallet_address
    )

@router.post("/withdraw", response_model=WithdrawResponse, dependencies=[Depends(rate_limit(limit=3, window=60))])
async def withdraw_funds(
    request: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Withdraw funds from platform balance to linked Web3 TON Address.
    Verifies sufficient balance prior to initiating. Places request in review queue.
    """
    from app.core.config import get_settings
    settings = get_settings()

    if request.amount < 1000:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is $10.00 USDT")

    # Validate destination address format
    try:
        convert_ton_address_to_hex(request.address)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid TON Wallet address format")
        
    # Normalize address format to friendly base64 url-safe non-bounceable format
    try:
        request.address = convert_raw_to_friendly(request.address, bounceable=False)
    except Exception:
        pass

    # Velocity control: enforce a rolling-24h per-user withdrawal cap BEFORE
    # debiting. Payouts are instant and irreversible, so this bounds how much a
    # stolen session can move — including via many small withdrawals.
    from app.services.withdrawal_policy import exceeds_daily_cap, remaining_daily_allowance_cents, needs_manual_review
    since = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=24)
    recent_res = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == current_user.telegram_id,
            Transaction.type == "withdrawal",
            Transaction.status != "failed",
            Transaction.created_at >= since,
        )
    )
    # Withdrawal amounts are stored negative; negate the sum to get the total out.
    withdrawn_24h = -int(recent_res.scalar() or 0)
    if exceeds_daily_cap(withdrawn_24h, request.amount, settings.WITHDRAWAL_DAILY_CAP_CENTS):
        remaining = remaining_daily_allowance_cents(withdrawn_24h, settings.WITHDRAWAL_DAILY_CAP_CENTS)
        raise HTTPException(
            status_code=400,
            detail=f"Daily withdrawal limit reached. You can withdraw up to ${remaining / 100:.2f} more within 24 hours.",
        )

    # Atomically debit — returns None if insufficient funds
    updated_user = await user_crud.atomic_debit(db, current_user.telegram_id, request.amount)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Insufficient funds in balance")

    # Flat $0.20 fee if amount is 20 cents or more; otherwise 0 fee to allow small test withdrawals
    fee = 20 if request.amount >= 20 else 0
    transfer_amount_cents = request.amount - fee

    # Large withdrawals are HELD for manual admin approval rather than auto-paid.
    # Funds are already debited (held); the destination address is stashed in
    # reference_id so an admin can execute the payout later via /admin/withdrawals.
    if needs_manual_review(request.amount, settings.WITHDRAWAL_REVIEW_THRESHOLD_CENTS):
        tx_review = Transaction(
            user_id=updated_user.telegram_id,
            type="withdrawal",
            amount=-request.amount,
            fee=fee,
            status="pending_review",
            reference_id=f"pending_review:{request.address}",
        )
        db.add(tx_review)
        await db.commit()
        await db.refresh(tx_review)
        logger.info(f"[TRANSACTION] user_id={current_user.telegram_id} | type=withdrawal | amount=-{request.amount} cents (-${request.amount/100:.2f}) | fee={fee} cents | reference_id={tx_review.reference_id} | status=pending_review")

        # Alert admins to review (reuses the rate-limited alert infra).
        try:
            import html as html_mod
            from app.core.alerts import send_admin_alert
            await send_admin_alert(
                "🔎 <b>Withdrawal held for review (large amount)</b>\n\n"
                f"• <b>Transaction ID:</b> #{tx_review.id}\n"
                f"• <b>User:</b> {html_mod.escape(updated_user.first_name or '')} (<code>{updated_user.telegram_id}</code>)\n"
                f"• <b>Amount:</b> ${request.amount / 100:.2f} USDT\n"
                f"• <b>Destination:</b> <code>{request.address}</code>\n\n"
                "<i>Approve or reject via /admin/withdrawals. Funds are held (already debited).</i>",
                system="treasury",
            )
        except Exception as alert_err:
            logger.warning(f"Failed to send withdrawal review alert: {alert_err}")

        # Notify the user.
        try:
            from app.services.telegram_bot import TelegramService
            await TelegramService.send_notification(
                updated_user.telegram_id,
                "<b>🔎 Withdrawal Under Review</b>\n\n"
                f"• <b>Amount:</b> ${request.amount / 100:.2f} USDT\n"
                "• <b>Status:</b> Pending manual review 🟡\n\n"
                "<i>Larger withdrawals are reviewed for your security and usually clear shortly. "
                "Your funds are safely reserved.</i>"
            )
        except Exception:
            pass

        return WithdrawResponse(status="pending_review", amount=request.amount, new_balance=updated_user.balance)

    # Second factor: hold the (already debited) withdrawal until the OWNER
    # confirms it from their own Telegram account via an inline keyboard. A
    # stolen initData session can reach this endpoint but cannot tap a button
    # in the victim's private bot chat. Without a bot token (dev/tests) the
    # legacy auto-pay path below still applies.
    if settings.WITHDRAWAL_CONFIRMATION_ENABLED and settings.TELEGRAM_BOT_TOKEN:
        from app.services.withdrawal_confirmation import PENDING_STATUS, REF_PREFIX, confirmation_nonce
        from app.services.telegram_bot import TelegramService

        tx_hold = Transaction(
            user_id=updated_user.telegram_id,
            type="withdrawal",
            amount=-request.amount,
            fee=fee,
            status=PENDING_STATUS,
            reference_id=f"{REF_PREFIX}{request.address}",
        )
        db.add(tx_hold)
        await db.commit()
        await db.refresh(tx_hold)
        logger.info(f"[TRANSACTION] user_id={current_user.telegram_id} | type=withdrawal | amount=-{request.amount} cents (-${request.amount/100:.2f}) | fee={fee} cents | status={PENDING_STATUS}")

        dest_display = f"{request.address[:6]}...{request.address[-4:]}"
        ttl_minutes = settings.WITHDRAWAL_CONFIRMATION_TTL_SECONDS // 60
        delivered = await TelegramService.send_withdrawal_confirmation_request(
            updated_user.telegram_id,
            "<b>🔐 Confirm Your Withdrawal</b>\n\n"
            f"• <b>Amount:</b> ${request.amount / 100:.2f} USDT\n"
            f"• <b>Fee:</b> -${fee / 100:.2f} USDT\n"
            f"• <b>You receive:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
            f"• <b>Destination:</b> <code>{dest_display}</code>\n\n"
            f"<i>Tap Confirm to send it on-chain, or Cancel to refund. "
            f"Unconfirmed requests are refunded automatically after {ttl_minutes} minutes.\n\n"
            f"⚠️ If you did NOT request this, tap Cancel — someone may have "
            f"access to your session.</i>",
            tx_id=tx_hold.id,
            nonce=confirmation_nonce(tx_hold.id, updated_user.telegram_id),
        )
        if not delivered:
            # The second factor can't reach the user; refund immediately
            # instead of stranding the held funds until expiry.
            updated_user = await user_crud.atomic_credit(db, current_user.telegram_id, request.amount)
            tx_hold.status = "failed"
            tx_hold.reference_id = "confirmation_undeliverable"
            db.add(tx_hold)
            await db.commit()
            raise HTTPException(
                status_code=503,
                detail="Could not deliver the withdrawal confirmation to your Telegram chat. Open the bot chat and try again.",
            )

        return WithdrawResponse(status=PENDING_STATUS, amount=request.amount, new_balance=updated_user.balance)

    tx_hash = None
    is_real = False

    if settings.PAYOUT_MNEMONIC:
        try:
            from app.services.payout_service import execute_usdt_payout, BlockchainBroadcastError
            tx_hash = await execute_usdt_payout(request.address, transfer_amount_cents)
            is_real = True
        except BlockchainBroadcastError as broadcast_err:
            # We failed during/after broadcast. It is UNSAFE to refund!
            # We log it as pending, and the background crawler will verify it.
            tx_hash = broadcast_err.msg_hash
            is_real = True
            logger.warning(f"On-chain payout broadcast failed/timed out: {broadcast_err}. Saving as pending withdrawal.")
        except Exception as payout_err:
            # Safe to refund: failure occurred before broadcast
            await user_crud.atomic_credit(db, current_user.telegram_id, request.amount)
            logger.error(f"On-chain payout failed before broadcast: {payout_err}")
            raise HTTPException(status_code=500, detail=f"On-chain payout transfer failed: {payout_err}")
    else:
        logger.warning("PAYOUT_MNEMONIC is not configured. Falling back to simulated/mock payout.")
        tx_hash = f"mock_{request.address[:6]}_{request.amount}"

    # Log transaction
    status = "pending" if is_real else "completed"
    tx_withdraw = Transaction(
        user_id=updated_user.telegram_id,
        type="withdrawal",
        amount=-request.amount,
        fee=fee,
        status=status,
        reference_id=tx_hash
    )
    db.add(tx_withdraw)
    await db.commit()
    await db.refresh(tx_withdraw)
    logger.info(f"[TRANSACTION] user_id={current_user.telegram_id} | type=withdrawal | amount=-{request.amount} cents (-${request.amount/100:.2f}) | fee={fee} cents (${fee/100:.2f}) | reference_id={tx_withdraw.reference_id} | status={status}")

    # Send automated Telegram Bot notifications
    try:
        import html as html_mod
        from app.services.telegram_bot import TelegramService
        dest_display = f"{request.address[:6]}...{request.address[-4:]}"
        
        # Link to transaction or destination wallet
        link_display = (
            f"<a href=\"https://tonviewer.com/transaction/{tx_hash}\">View Transaction 🔗</a>"
            if is_real else
            f"<a href=\"https://tonviewer.com/{request.address}\">{dest_display}</a> 🔗"
        )
        
        # Notify user of completion/processing
        if is_real:
            notification_text = (
                f"<b>📤 Withdrawal Processing...</b>\n\n"
                f"• <b>Requested Amount:</b> ${request.amount / 100:.2f} USDT\n"
                f"• <b>Withdrawal Fee:</b> -${fee / 100:.2f} USDT\n"
                f"• <b>Sent to Wallet:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
                f"• <b>Destination Wallet:</b> {link_display}\n"
                f"• <b>Status:</b> Processing (Pending On-Chain Confirmation) 🟡\n\n"
                f"<i>Your funds have been broadcasted to the blockchain. You will receive another notification once confirmed on-chain! Platform Balance: {updated_user.balance / 100:.2f} USDT.</i>"
            )
        else:
            notification_text = (
                f"<b>✅ Withdrawal Completed!</b>\n\n"
                f"• <b>Requested Amount:</b> ${request.amount / 100:.2f} USDT\n"
                f"• <b>Withdrawal Fee:</b> -${fee / 100:.2f} USDT\n"
                f"• <b>Sent to Wallet:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
                f"• <b>Destination Wallet:</b> {link_display}\n"
                f"• <b>Status:</b> Completed Successfully 🟢\n\n"
                f"<i>Your funds have been transferred successfully on-chain! Platform Balance: {updated_user.balance / 100:.2f} USDT.</i>"
            )
        await TelegramService.send_notification(updated_user.telegram_id, notification_text)
        
        # Notify Admin for read-only tracking
        if settings.ADMIN_TELEGRAM_ID:
            admin_text = (
                f"<b>📤 Withdrawal Processed ({'Pending On-Chain' if is_real else 'Auto-Completed'})</b>\n\n"
                f"• <b>Transaction ID:</b> #{tx_withdraw.id}\n"
                f"• <b>User:</b> {html_mod.escape(updated_user.first_name or '')} (ID: <code>{updated_user.telegram_id}</code>)\n"
                f"• <b>Requested Amount:</b> ${request.amount / 100:.2f} USDT\n"
                f"• <b>Fee Deducted:</b> ${fee / 100:.2f} USDT\n"
                f"• <b>Net Payout:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
                f"• <b>Destination:</b> <a href=\"https://tonviewer.com/{request.address}\"><code>{request.address}</code></a> 🔗\n"
                f"• <b>On-Chain Status:</b> {'Real Transfer (Pending)' if is_real else 'Simulated'}\n"
            )
            if is_real:
                admin_text += f"• <b>Tx Hash:</b> <a href=\"https://tonviewer.com/transaction/{tx_hash}\"><code>{tx_hash[:10]}...</code></a> 🔗\n"
            await TelegramService.send_notification(settings.ADMIN_TELEGRAM_ID, admin_text)
    except Exception as e:
        logger.error(f"Failed to process withdrawal notifications: {e}")

    return WithdrawResponse(
        status=status,
        amount=request.amount,
        new_balance=updated_user.balance
    )


@router.get("/transactions", response_model=List[TransactionItem])
async def get_transaction_ledger(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_read_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the financial transaction ledger for the current user (paginated).
    """
    if page < 1:
        page = 1
    if limit < 1 or limit > 100:
        limit = 20
        
    offset = (page - 1) * limit
    result = await db.execute(
        select(Transaction)
        .filter(
            Transaction.user_id == current_user.telegram_id,
            Transaction.type.notin_(["deposit_fee", "game_rake"])
        )
        .order_by(desc(Transaction.created_at))
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()


class TonWebhookPayload(BaseModel):
    # Dev mock fields
    event: Optional[str] = "transfer"
    tx_hash: Optional[str] = None
    sender: Optional[str] = None
    destination: Optional[str] = None
    amount_cents: Optional[int] = None
    comment: Optional[str] = None

    # TON Console Invoice fields
    id: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[str] = None
    description: Optional[str] = None
    pay_to_address: Optional[str] = None
    currency: Optional[str] = "TON"

    # TONAPI watched account transaction webhook fields
    account_id: Optional[str] = None
    lt: Optional[int] = None

@router.post("/webhook")
async def receive_ton_deposit_webhook(
    request: Request,
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Asynchronously verify and settle Web3 TON deposits using blockchain event webhooks.
    Supports developer simulations, TON Console Invoices, and TONAPI watched account transactions.
    """
    from app.core.config import get_settings
    settings = get_settings()

    body_bytes = await request.body()
    import json
    try:
        body_json = json.loads(body_bytes.decode()) if body_bytes else {}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Dynamic wrapper to support dot-notation matching TonWebhookPayload fields
    class DictObj:
        def __init__(self, d):
            for k, v in d.items():
                if isinstance(v, dict):
                    setattr(self, k, DictObj(v))
                else:
                    setattr(self, k, v)
        def __getattr__(self, name):
            return None

    payload = DictObj(body_json)

    # Verify legacy webhook signature
    auth_token = None
    if authorization and authorization.startswith("Bearer "):
        auth_token = authorization.split("Bearer ")[1].strip()

    import hmac
    webhook_secret = getattr(settings, "WEBHOOK_SECRET", "")
    if not webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="Webhook secret not configured on server"
        )
    
    is_valid = False
    if x_webhook_secret and hmac.compare_digest(x_webhook_secret, webhook_secret):
        is_valid = True
    elif auth_token and hmac.compare_digest(auth_token, webhook_secret):
        is_valid = True

    if not is_valid:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized webhook signature"
        )

    # Detect the payload format
    if payload.description and payload.id:
        # 1. TON Console Invoice Webhook
        if payload.status != "paid":
            return {"status": "ignored", "reason": f"Invoice status is {payload.status}"}

        invoice_id = payload.id
        description = payload.description
        
        if not description.startswith("ref_"):
            raise HTTPException(status_code=400, detail="Invalid description format")
            
        try:
            telegram_id = int(description.split("_")[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Malformed Telegram ID")

        # USDT-only: credit only USDT invoices. A non-USDT (e.g. TON) invoice is
        # ignored rather than credited at a fluctuating price.
        currency = (payload.currency or "TON").upper()
        if currency != "USDT":
            return {"status": "ignored", "reason": f"Only USDT deposits are credited (invoice currency was {currency})."}
        amount_micro = int(payload.amount or 0)
        amount_cents = int(round(amount_micro / 10000.0))

        tx_hash = f"invoice_{invoice_id}"
        sender_addr = payload.pay_to_address or "TON_Console_Invoices"

    elif payload.account_id and payload.tx_hash:
        # 2. TONAPI Watched Account Transaction Webhook
        import httpx
        tx_hash = payload.tx_hash
        headers = {}
        if settings.TON_API_KEY:
            headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
        # Query transaction details from TonAPI
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"https://tonapi.io/v2/blockchain/transactions/{tx_hash}",
                    headers=headers
                )
                if res.status_code != 200:
                    raise HTTPException(status_code=400, detail="Failed to fetch transaction details from TONAPI")
                tx_data = res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error querying TONAPI: {e}")

        in_msg = tx_data.get("in_msg", {})
        sender_addr = in_msg.get("source", {}).get("address", "unknown")

        decoded_body = in_msg.get("decoded_body") or {}
        op_name = in_msg.get("decoded_op_name") or ""
        op_code = in_msg.get("op_code") or ""
        is_jetton = op_name == "transfer_notification" or op_code == "0x7362d09c" or "jetton" in str(decoded_body.get("type", "")).lower()

        # USDT-only: native TON transfers are never credited.
        if not is_jetton:
            return {"status": "ignored", "reason": "Only USDT deposits are credited (native TON ignored)."}

        # Verify the jetton transfer_notification actually came from the master
        # wallet's USDT jetton wallet. This both enforces USDT-only and closes a
        # spoofing hole: previously ANY 6-decimal jetton was credited 1:1 as USDT.
        master_usdt_jw = await get_master_usdt_jetton_wallet_hex()
        try:
            source_hex = convert_ton_address_to_hex(sender_addr)
        except Exception:
            source_hex = None
        if not master_usdt_jw or source_hex != master_usdt_jw:
            return {"status": "ignored", "reason": "Transfer is not a verified USDT deposit."}

        # Extract the ref_ comment (nested in the jetton forward_payload) and the
        # USDT amount (6 decimals; 1 cent = 10^4 raw units).
        comment = ""
        amount_cents = 0
        if isinstance(decoded_body, dict):
            fwd = decoded_body.get("forward_payload") or {}
            if isinstance(fwd, dict):
                comment = fwd.get("text") or fwd.get("comment") or ""
            elif isinstance(fwd, str):
                comment = fwd
            jetton_amount_raw = decoded_body.get("amount")
            if jetton_amount_raw is not None:
                try:
                    amount_cents = int(round(int(jetton_amount_raw) / 10000.0))
                except (ValueError, TypeError):
                    amount_cents = 0
            # The real human sender for the notification (not the jetton wallet).
            real_sender = decoded_body.get("sender")
            if real_sender:
                sender_addr = real_sender

        if not comment:
            comment = in_msg.get("message") or ""

        if not comment.startswith("ref_"):
            raise HTTPException(status_code=400, detail="Transaction does not contain a valid referral ref_ comment")

        try:
            telegram_id = int(comment.split("_")[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Malformed Telegram ID in transaction comment")

    else:
        # 3. Developer simulated deposit webhook
        from app.core.database import engine
        if not engine.url.drivername.startswith("sqlite"):
            raise HTTPException(status_code=403, detail="Developer simulated deposit is disabled in production.")

        if not payload.comment or payload.amount_cents is None:
            raise HTTPException(status_code=400, detail="Malformed developer simulation payload")

        try:
            telegram_id = int(payload.comment.split("_")[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Malformed Telegram ID in comment")

        amount_cents = payload.amount_cents
        tx_hash = payload.tx_hash or f"sim_tx_{int(datetime.now(timezone.utc).replace(tzinfo=None).timestamp())}"
        sender_addr = payload.sender or "dev_simulation"

    if amount_cents <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    # Retrieve user from db with write lock to prevent race conditions
    user_result = await db.execute(select(User).filter(User.telegram_id == telegram_id).with_for_update())
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User associated with comment not found")

    # Check for duplicate transactions (replay protection) using reference_id
    existing_tx_result = await db.execute(
        select(Transaction).filter(Transaction.reference_id == tx_hash)
    )
    if existing_tx_result.scalars().first():
        user_result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
        user = user_result.scalars().first()
        return {"status": "success", "message": "Transaction already processed", "credited_amount": 0, "new_balance": user.balance if user else 0}

    # Process automatic 5% platform topup fee
    credited_amount = int(round(amount_cents / 1.05))
    fee = amount_cents - credited_amount

    # Atomically credit user balance
    updated_user = await user_crud.atomic_credit(db, telegram_id, credited_amount)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User associated with comment not found")

    # Log deposit transaction
    tx_deposit = Transaction(
        user_id=telegram_id,
        type="deposit",
        amount=credited_amount,
        fee=fee,
        status="completed",
        reference_id=tx_hash
    )
    db.add(tx_deposit)

    # Log routed commission transaction to Company Wallet
    tx_commission = Transaction(
        user_id=telegram_id,
        type="deposit_fee",
        amount=-fee,
        fee=0,
        status="completed",
        reference_id=f"fee_{tx_hash[:16]}"
    )
    db.add(tx_commission)

    await db.commit()
    logger.info(f"[TRANSACTION] user_id={telegram_id} | type=deposit | amount={credited_amount} cents (${credited_amount/100:.2f}) | fee={fee} cents (${fee/100:.2f}) | reference_id={tx_hash} | status=completed")
    logger.info(f"[TRANSACTION] user_id={telegram_id} | type=deposit_fee | amount=-{fee} cents (-${fee/100:.2f}) | fee=0 cents ($0.00) | reference_id={tx_commission.reference_id} | status=completed")

    # Dispatch Telegram Bot notification
    try:
        from app.services.telegram_bot import TelegramService
        sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
        notification_text = (
            f"<b>⚡️ Cyber Web3 Top-Up Confirmed!</b>\n\n"
            f"• <b>Sender Address:</b> <code>{sender_display}</code>\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT (Routed to Company Wallet)\n"
            f"• <b>Transaction ID:</b> <code>{tx_hash[:10]}...{tx_hash[-8:] if len(tx_hash) > 8 else ''}</code>\n\n"
            f"<i>Your balance has been automatically synchronized. Updated Platform Balance: {updated_user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
        )
        await TelegramService.send_notification(telegram_id, notification_text)
    except Exception:
        pass

    return {
        "status": "success",
        "credited_amount": credited_amount,
        "fee": fee,
        "new_balance": updated_user.balance
    }


@router.get("/prices")
async def get_prices():
    prices = await fetch_all_prices()
    return prices


@router.get("/jetton-wallet")
async def get_jetton_wallet(
    user_address: str,
    jetton_master: str
):
    from app.core.config import get_settings
    settings = get_settings()
    
    import httpx
    url = f"https://tonapi.io/v2/accounts/{user_address}/jettons/{jetton_master}"
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                jetton_wallet = data.get("wallet_address", {}).get("address", "")
                if jetton_wallet:
                    # Convert to friendly address format
                    friendly = convert_raw_to_friendly(jetton_wallet)
                    return {"jetton_wallet_address": friendly}
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch jetton wallet from TonAPI: {e}")
        
    raise HTTPException(status_code=400, detail="Failed to resolve Jetton wallet address from TonAPI")


@router.get("/onchain-balances", dependencies=[Depends(rate_limit(limit=20, window=60))])
async def get_onchain_balances(
    user_address: str,
    current_user: User = Depends(get_current_user),
):
    """Native TON + USDT balances of a wallet address (public chain data,
    proxied through TonAPI so the client needs no RPC key). Powers the
    deposit flow: swap/on-ramp arrival detection and the gas-wall hint.
    """
    from app.services.gas_grant import fetch_onchain_balances
    try:
        ton_nano, usdt_units = await fetch_onchain_balances(user_address)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not read wallet balances from the blockchain.")
    return {"ton_nanoton": ton_nano, "usdt_units": usdt_units}


@router.post("/gas-grant", dependencies=[Depends(rate_limit(limit=3, window=300))])
async def request_gas_grant(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Sends a small TON splash to the user's connected wallet so they can pay
    the jetton-transfer gas for a USDT deposit. Heavily gated — see
    app/services/gas_grant.py for the eligibility rules.
    """
    from app.services.gas_grant import grant_gas, GasGrantDenied
    try:
        result = await grant_gas(db, current_user.telegram_id, current_user.wallet_address)
    except GasGrantDenied as denied:
        raise HTTPException(status_code=denied.status_code, detail=denied.detail)

    try:
        from app.services.telegram_bot import TelegramService
        await TelegramService.send_notification(
            current_user.telegram_id,
            "⛽ <b>Gas Grant Sent</b>\n\n"
            f"We sent {result['amount_nanoton'] / 1e9:.3f} TON to your wallet to cover the "
            "deposit network fee. It should arrive within a minute — then just retry your deposit.",
        )
    except Exception:
        pass

    return result


@router.post("/deposit/verify", dependencies=[Depends(rate_limit(limit=5, window=60))])
async def verify_deposit(
    request: DepositVerifyRequest,
    telegram_id: int = Depends(get_current_telegram_id)
):
    from app.core.config import get_settings
    from app.core.database import AsyncSessionLocal
    settings = get_settings()

    message_hash = request.message_hash

    # Enforce replay protection
    async with AsyncSessionLocal() as db:
        existing_tx_result = await db.execute(
            select(Transaction).filter(Transaction.reference_id == message_hash)
        )
        if existing_tx_result.scalars().first():
            raise HTTPException(
                status_code=400,
                detail="Transaction already processed."
            )

    # Polling parameters
    import asyncio
    import httpx
    import logging

    logger = logging.getLogger(__name__)
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    event_data = None
    # Poll for up to 30 seconds
    for attempt in range(15):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                # 1. Try events endpoint directly (if hash is tx_hash or event_id)
                url = f"https://tonapi.io/v2/events/{message_hash}"
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    event_data = res.json()
                    break
                elif res.status_code == 404:
                    # 2. Try resolving message hash to a transaction
                    msg_url = f"https://tonapi.io/v2/blockchain/messages/{message_hash}/transaction"
                    msg_res = await client.get(msg_url, headers=headers)
                    if msg_res.status_code == 200:
                        tx_data = msg_res.json()
                        resolved_tx_hash = tx_data.get("hash")
                        if resolved_tx_hash:
                            event_url = f"https://tonapi.io/v2/events/{resolved_tx_hash}"
                            event_res = await client.get(event_url, headers=headers)
                            if event_res.status_code == 200:
                                event_data = event_res.json()
                                break
                else:
                    logger.warning(f"TonAPI verify status: {res.status_code}")
        except Exception as e:
            logger.warning(f"Error querying TonAPI: {e}")
        await asyncio.sleep(2.0)

    if not event_data:
        raise HTTPException(
            status_code=404,
            detail="Transaction trace not found. Please wait a few seconds and try again."
        )

    # 3. Resolve the true on-chain transaction/event hash
    tx_hash = event_data.get("event_id") or message_hash

    # Walk through the actions to verify the transaction
    actions = event_data.get("actions", [])
    verified_tx = False
    amount_cents = 0
    sender_addr = "unknown"
    currency_symbol = "USDT"

    # USDT-only: track whether the user actually sent a non-USDT asset (TON or
    # another jetton) to the master with the right comment, so we can return a
    # clear "only USDT" error instead of a generic verification failure.
    non_usdt_detected = False

    for action in actions:
        if action.get("status") != "ok":
            continue

        action_type = action.get("type")

        if action_type == "TonTransfer":
            ton_transfer = action.get("TonTransfer", {})
            recipient = ton_transfer.get("recipient", {}).get("address", "")
            comment = ton_transfer.get("comment", "")

            try:
                recipient_raw = convert_ton_address_to_hex(recipient)
                master_raw = convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)
            except Exception:
                continue

            # Native TON is not a creditable deposit asset under USDT-only
            # settlement. Detect the attempt but never credit it.
            if recipient_raw == master_raw and comment == f"ref_{telegram_id}":
                non_usdt_detected = True
                continue

        elif action_type == "JettonTransfer":
            jetton_transfer = action.get("JettonTransfer", {})
            recipient = jetton_transfer.get("recipient", {}).get("address", "")
            sender = jetton_transfer.get("sender", {}).get("address", "")
            amount_raw = int(jetton_transfer.get("amount", 0))
            comment = jetton_transfer.get("comment", "")
            jetton_master = jetton_transfer.get("jetton", {}).get("address", "")

            # Compare recipient with our master address
            try:
                recipient_raw = convert_ton_address_to_hex(recipient)
                master_raw = convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)
            except Exception:
                continue

            if recipient_raw == master_raw and comment == f"ref_{telegram_id}":
                if _is_usdt_master(jetton_master):
                    # Verified USDT transfer — credit at face value (6 decimals,
                    # 1 USDT = 100 cents). No price feed needed.
                    token_amount = amount_raw / (10 ** 6)
                    amount_cents = int(round(token_amount * 100))
                    sender_addr = sender
                    currency_symbol = "USDT"
                    verified_tx = True
                    break
                else:
                    # A non-USDT jetton (USDC/BTC/ETH/other) — not credited.
                    non_usdt_detected = True
                    continue

    if not verified_tx:
        if non_usdt_detected:
            raise HTTPException(
                status_code=400,
                detail="Only USDT deposits are supported. You sent a different asset — please deposit USDT.",
            )
        raise HTTPException(
            status_code=400,
            detail="Transaction verification failed. Destination, comment, or status mismatch."
        )

    if amount_cents <= 0:
        raise HTTPException(
            status_code=400,
            detail="Transaction amount is invalid."
        )

    # Let's acquire user lock and credit the balance
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        user_result = await db.execute(
            select(User).filter(User.telegram_id == telegram_id).with_for_update()
        )
        user = user_result.scalars().first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Double check replay protection (inside db transaction lock)
        existing_tx_result = await db.execute(
            select(Transaction).filter(
                or_(
                    Transaction.reference_id == message_hash,
                    Transaction.reference_id == tx_hash
                )
            )
        )
        if existing_tx_result.scalars().first():
            return {
                "status": "success",
                "credited_amount": 0,
                "new_balance": user.balance,
                "message": "Already processed"
            }

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
            reference_id=tx_hash
        )
        db.add(tx_deposit)

        # Log fee transaction
        tx_fee = Transaction(
            user_id=telegram_id,
            type="deposit_fee",
            amount=-fee,
            fee=0,
            status="completed",
            reference_id=f"fee_{message_hash[:16]}"
        )
        db.add(tx_fee)

        await db.commit()
        await db.refresh(user)
        final_balance = user.balance

    # Send telegram notification
    try:
        from app.services.telegram_bot import TelegramService
        sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
        notification_text = (
            f"<b>⚡️ Cyber Web3 Top-Up Confirmed!</b>\n\n"
            f"• <b>Sender Address:</b> <a href=\"https://tonviewer.com/{sender_addr}\">{sender_display}</a> 🔗\n"
            f"• <b>Currency:</b> {currency_symbol}\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT\n"
            f"• <b>Transaction ID:</b> <a href=\"https://tonviewer.com/transaction/{message_hash}\">{message_hash[:10]}...{message_hash[-8:] if len(message_hash) > 8 else ''}</a> 🔗\n\n"
            f"<i>Your balance has been updated. Platform Balance: {final_balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
        )
        await TelegramService.send_notification(telegram_id, notification_text)
    except Exception:
        pass

    return {
        "status": "success",
        "credited_amount": credited_amount,
        "fee": fee,
        "new_balance": final_balance
    }


# Stripe direct card deposit endpoints
import stripe  # noqa: E402

class StripeSessionRequest(BaseModel):
    amount: float  # Amount in USD, e.g., 10.00
    redirect_path: Optional[str] = "/wallet"

class StripeSessionResponse(BaseModel):
    session_id: str
    checkout_url: str

class StripeVerifyResponse(BaseModel):
    status: str
    credited_amount: int
    new_balance: int

@router.post("/stripe/create-session", response_model=StripeSessionResponse, dependencies=[Depends(rate_limit(limit=5, window=60))])
async def stripe_create_session(
    request: StripeSessionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import get_settings
    settings = get_settings()
    
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Stripe configuration is missing on server.")
        
    stripe.api_key = settings.STRIPE_SECRET_KEY
    
    if request.amount < 1.0:
        raise HTTPException(status_code=400, detail="Minimum deposit amount is $1.00 USD.")
        
    # Calculate charged amount with 5% platform fee
    charged_amount_cents = int(round(request.amount * 1.05 * 100))
    credited_amount_cents = int(round(request.amount * 100))
    fee_cents = charged_amount_cents - credited_amount_cents
    
    # Generate pending transaction in DB
    pending_tx = Transaction(
        user_id=current_user.telegram_id,
        type="deposit",
        amount=credited_amount_cents,
        fee=fee_cents,
        status="pending",
        reference_id=None  # will be set to session ID shortly
    )
    db.add(pending_tx)
    await db.flush() # get ID
    
    # Sanitize redirect path
    redirect_path = request.redirect_path or "/wallet"
    if not redirect_path.startswith("/"):
        redirect_path = "/" + redirect_path

    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': 'Web3Chess Platform Balance Top-Up',
                            'description': f'Credited: ${request.amount:.2f} USD | Fee (5%): ${(request.amount * 0.05):.2f} USD',
                        },
                        'unit_amount': charged_amount_cents,
                    },
                    'quantity': 1,
                },
            ],
            mode='payment',
            metadata={
                'user_id': str(current_user.telegram_id),
                'tx_id': str(pending_tx.id)
            },
            payment_intent_data={
                'metadata': {
                    'user_id': str(current_user.telegram_id),
                    'tx_id': str(pending_tx.id)
                }
            },
            success_url=f"{settings.WEBAPP_URL}{redirect_path}?status=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.WEBAPP_URL}{redirect_path}?status=cancel",
        )
        
        pending_tx.reference_id = checkout_session.id
        await db.commit()
        
        return StripeSessionResponse(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to create Stripe checkout session: {e}")
        raise HTTPException(status_code=500, detail="Stripe session creation failed.")


@router.get("/stripe/verify-session", response_model=StripeVerifyResponse)
async def stripe_verify_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Retrieve the transaction
    tx_result = await db.execute(
        select(Transaction).filter(
            Transaction.reference_id == session_id,
            Transaction.user_id == current_user.telegram_id
        )
    )
    tx = tx_result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found.")
        
    return StripeVerifyResponse(
        status=tx.status,
        credited_amount=tx.amount,
        new_balance=current_user.balance
    )


class StripeSubscribeRequest(BaseModel):
    billing_period: str = "monthly"  # currently only monthly is passed from frontend, but extensible
    redirect_path: Optional[str] = None


@router.post("/stripe/subscribe", response_model=StripeSessionResponse)
async def create_stripe_subscription(
    request: StripeSubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a Stripe Checkout Session for a recurring Premium subscription.
    """
    from app.core.config import get_settings
    settings = get_settings()

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Stripe payments are not configured.")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    redirect_path = request.redirect_path or "/membership"
    if not redirect_path.startswith("/"):
        redirect_path = "/" + redirect_path

    # If user already has an active subscription AND wants the same billing period, block them
    if current_user.stripe_subscription_id and current_user.is_premium_active:
        if current_user.premium_billing_period == request.billing_period:
            raise HTTPException(
                status_code=400,
                detail="You already have an active subscription on this plan. Use 'Manage Subscription' to change it."
            )
        else:
            # Different period → redirect to upgrade endpoint logic
            raise HTTPException(
                status_code=400,
                detail="To switch billing periods on an existing Stripe subscription, please use the upgrade flow."
            )

    # Use the appropriate price ID based on the billing period
    if request.billing_period == "annual":
        price_id = settings.STRIPE_ANNUAL_PRICE_ID
    else:
        price_id = settings.STRIPE_MONTHLY_PRICE_ID

    try:
        session_kwargs = {
            'mode': 'subscription',
            'payment_method_types': ['card'],
            'line_items': [{'price': price_id, 'quantity': 1}],
            'client_reference_id': str(current_user.telegram_id),
            'subscription_data': {
                'metadata': {
                    'user_id': str(current_user.telegram_id),
                    'tier': 'premium'
                }
            },
            'success_url': f"{settings.WEBAPP_URL}{redirect_path}?status=success&session_id={{CHECKOUT_SESSION_ID}}",
            'cancel_url': f"{settings.WEBAPP_URL}{redirect_path}?status=cancel",
        }
        
        # Avoid creating duplicate Stripe customers
        if current_user.stripe_customer_id:
            session_kwargs['customer'] = current_user.stripe_customer_id
        else:
            session_kwargs['customer_email'] = f"{current_user.telegram_id}@telegram.local" # Fallback if they have no email

        checkout_session = stripe.checkout.Session.create(**session_kwargs)

        return StripeSessionResponse(
            session_id=checkout_session.id,
            checkout_url=checkout_session.url
        )
    except Exception as e:
        logger.error(f"Failed to create Stripe subscription session: {e}")
        raise HTTPException(status_code=500, detail="Stripe subscription creation failed.")


class StripeUpgradeRequest(BaseModel):
    billing_period: str  # "monthly" or "annual"

@router.post("/stripe/upgrade")
async def upgrade_stripe_subscription(
    request: StripeUpgradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upgrades (or downgrades) an existing Stripe subscription to a different billing period.
    Uses stripe.Subscription.modify() with proration so Stripe handles fair billing.
    """
    from app.core.config import get_settings
    settings = get_settings()

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Stripe payments are not configured.")

    if not current_user.stripe_subscription_id:
        raise HTTPException(status_code=400, detail="No active Stripe subscription found. Please subscribe first.")

    if not current_user.is_premium_active:
        raise HTTPException(status_code=400, detail="Your subscription has expired. Please subscribe again.")

    period = request.billing_period.lower()
    if period not in ("monthly", "annual"):
        raise HTTPException(status_code=400, detail="billing_period must be 'monthly' or 'annual'.")

    if current_user.premium_billing_period == period:
        raise HTTPException(status_code=400, detail=f"You are already on the {period} plan.")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    new_price_id = settings.STRIPE_ANNUAL_PRICE_ID if period == "annual" else settings.STRIPE_MONTHLY_PRICE_ID

    try:
        # Retrieve current subscription to get the current item ID
        sub = stripe.Subscription.retrieve(current_user.stripe_subscription_id)
        current_item_id = sub["items"]["data"][0]["id"]

        # Modify the subscription — Stripe automatically creates proration credits/charges
        stripe.Subscription.modify(
            current_user.stripe_subscription_id,
            cancel_at_period_end=False,
            proration_behavior="create_prorations",
            items=[{"id": current_item_id, "price": new_price_id}],
        )

        # Update local record immediately — Stripe will confirm via webhook
        result = await db.execute(
            select(User).filter(User.telegram_id == current_user.telegram_id).with_for_update()
        )
        db_user = result.scalars().first()
        if db_user:
            db_user.premium_billing_period = period
            db.add(db_user)
            await db.commit()

        return {"status": "upgraded", "billing_period": period}

    except stripe.error.InvalidRequestError as e:
        logger.error(f"Stripe upgrade failed for user {current_user.telegram_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Stripe upgrade error: {e}")
        raise HTTPException(status_code=500, detail="Could not upgrade subscription.")


class StripePortalRequest(BaseModel):
    redirect_path: Optional[str] = None

@router.post("/stripe/portal")
async def create_stripe_portal(
    request: StripePortalRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Creates a Stripe Customer Portal Session for managing subscriptions.
    """
    from app.core.config import get_settings
    settings = get_settings()

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=501, detail="Stripe payments are not configured.")

    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="You do not have an active Stripe customer profile.")

    stripe.api_key = settings.STRIPE_SECRET_KEY
    redirect_path = request.redirect_path or "/membership"
    if not redirect_path.startswith("/"):
        redirect_path = "/" + redirect_path

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{settings.WEBAPP_URL}{redirect_path}"
        )
        return {"url": portal_session.url}
    except Exception as e:
        logger.error(f"Failed to create Stripe portal session: {e}")
        raise HTTPException(status_code=500, detail="Could not generate portal link.")



@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import get_settings
    settings = get_settings()
    
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=501, detail="Stripe webhook keys not configured on server.")
        
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload.")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature.")
        
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Handle Subscriptions
        if session.get('mode') == 'subscription':
            client_reference_id = session.get('client_reference_id')
            customer_id = session.get('customer')
            subscription_id = session.get('subscription')

            if client_reference_id and customer_id and subscription_id:
                user_id = int(client_reference_id)
                user_result = await db.execute(select(User).filter(User.telegram_id == user_id).with_for_update())
                user = user_result.scalars().first()
                if user:
                    user.stripe_customer_id = customer_id
                    user.stripe_subscription_id = subscription_id

                    # Determine billing period from the price ID in the subscription line items
                    try:
                        sub_obj = stripe.Subscription.retrieve(subscription_id)
                        price_id = sub_obj["items"]["data"][0]["price"]["id"]
                        if price_id == settings.STRIPE_ANNUAL_PRICE_ID:
                            user.premium_billing_period = "annual"
                        else:
                            user.premium_billing_period = "monthly"
                    except Exception:
                        user.premium_billing_period = "monthly"  # safe fallback

                    db.add(user)
                    await db.commit()
            return {"status": "success", "message": "Subscription mapped to user."}

        # Handle One-Time Wallet Top-ups
        tx_id_str = session.get('metadata', {}).get('tx_id')
        user_id_str = session.get('metadata', {}).get('user_id')
        
        if tx_id_str and user_id_str:
            tx_id = int(tx_id_str)
            user_id = int(user_id_str)
            
            # Lock the user and transaction to avoid race conditions
            tx_result = await db.execute(
                select(Transaction).filter(
                    Transaction.id == tx_id,
                    Transaction.user_id == user_id
                ).with_for_update()
            )
            tx = tx_result.scalars().first()
            
            if tx and tx.status == "pending":
                # Get the user
                user_result = await db.execute(
                    select(User).filter(User.telegram_id == user_id).with_for_update()
                )
                user = user_result.scalars().first()
                
                if user:
                    # Update status
                    tx.status = "completed"
                    user.balance += tx.amount
                    
                    # Also log the fee transaction separately for ledger clarity
                    fee_tx = Transaction(
                        user_id=user_id,
                        type="deposit_fee",
                        amount=-tx.fee,
                        fee=0,
                        status="completed",
                        reference_id=f"fee_{session.get('id', '')[:16]}"
                    )
                    db.add(fee_tx)
                    
                    db.add(user)
                    db.add(tx)
                    await db.commit()
                    
                    # Send telegram notification
                    try:
                        from app.services.telegram_bot import TelegramService
                        notification_text = (
                            f"<b>💳 Card Top-Up Confirmed!</b>\n\n"
                            f"• <b>Payment Method:</b> Credit/Debit Card\n"
                            f"• <b>Amount Credited:</b> +${tx.amount / 100:.2f} USD\n"
                            f"• <b>Platform Top-Up Fee (5%):</b> -${tx.fee / 100:.2f} USD\n"
                            f"• <b>Stripe Session:</b> <code>{session.get('id', '')[:20]}...</code>\n\n"
                            f"<i>Your balance has been updated. Platform Balance: ${user.balance / 100:.2f} USD. Let's play! ♟️🎮</i>"
                        )
                        await TelegramService.send_notification(user_id, notification_text)
                    except Exception as notify_err:
                        logger.warning(f"Failed to send telegram notification: {notify_err}")
                        
                    return {"status": "success", "message": "Transaction credited successfully."}
            else:
                return {"status": "ignored", "message": "Transaction already completed or not found."}
                
    elif event['type'] == 'checkout.session.expired':
        session = event['data']['object']
        tx_id_str = session.get('metadata', {}).get('tx_id')
        user_id_str = session.get('metadata', {}).get('user_id')
        if tx_id_str and user_id_str:
            tx_id = int(tx_id_str)
            tx_result = await db.execute(select(Transaction).filter(Transaction.id == tx_id).with_for_update())
            tx = tx_result.scalars().first()
            if tx and tx.status == "pending":
                tx.status = "failed"
                db.add(tx)
                await db.commit()
                return {"status": "success", "message": "Transaction marked as failed."}

    elif event['type'] == 'charge.refunded':
        charge = event['data']['object']
        tx_id_str = charge.get('metadata', {}).get('tx_id')
        user_id_str = charge.get('metadata', {}).get('user_id')
        
        if tx_id_str and user_id_str:
            tx_id = int(tx_id_str)
            user_id = int(user_id_str)
            
            # Identify the refunded amount (charge.amount_refunded is in cents)
            amount_refunded = charge.get('amount_refunded', 0)
            if amount_refunded > 0:
                user_result = await db.execute(select(User).filter(User.telegram_id == user_id).with_for_update())
                user = user_result.scalars().first()
                if user:
                    user.balance -= amount_refunded
                    
                    refund_tx = Transaction(
                        user_id=user_id,
                        type="refund",
                        amount=-amount_refunded,
                        fee=0,
                        status="completed",
                        reference_id=f"refund_{charge.get('id', '')}"
                    )
                    db.add(refund_tx)
                    db.add(user)
                    await db.commit()
                    
                    try:
                        from app.services.telegram_bot import TelegramService
                        await TelegramService.send_notification(
                            user_id,
                            "<b>↩️ Refund Processed</b>\n\n"
                            f"A refund of <b>${amount_refunded / 100:.2f} USD</b> has been processed for your Stripe payment.\n"
                            f"Your platform balance has been adjusted accordingly."
                        )
                    except Exception:
                        pass
                    
                    return {"status": "success", "message": "Refund processed."}

    elif event['type'] == 'charge.dispute.created':
        dispute = event['data']['object']
        charge_id = dispute.get('charge')
        if charge_id:
            # We must fetch the charge from stripe to get the metadata since dispute object might not inherit it
            try:
                charge = stripe.Charge.retrieve(charge_id)
                user_id_str = charge.get('metadata', {}).get('user_id')
                if user_id_str:
                    user_id = int(user_id_str)
                    user_result = await db.execute(select(User).filter(User.telegram_id == user_id).with_for_update())
                    user = user_result.scalars().first()
                    if user:
                        # Freeze account completely due to dispute / chargeback
                        user.is_active = False
                        
                        # Deduct the disputed amount
                        dispute_amount = dispute.get('amount', 0)
                        user.balance -= dispute_amount
                        
                        penalty_tx = Transaction(
                            user_id=user_id,
                            type="chargeback",
                            amount=-dispute_amount,
                            fee=0,
                            status="completed",
                            reference_id=f"dispute_{dispute.get('id', '')}"
                        )
                        db.add(penalty_tx)
                        db.add(user)
                        await db.commit()
                        logger.critical(f"User {user_id} frozen due to Stripe chargeback (dispute {dispute.get('id')})")
                        
                        try:
                            from app.services.telegram_bot import TelegramService
                            await TelegramService.send_notification(
                                user_id,
                                "<b>🚫 Account Frozen (Chargeback)</b>\n\n"
                                "A Stripe chargeback (dispute) was opened against a recent payment.\n"
                                "For security reasons, your account has been temporarily frozen. Please contact support."
                            )
                        except Exception:
                            pass
                            
                        return {"status": "success", "message": "Account frozen due to dispute."}
            except Exception as e:
                logger.error(f"Failed to process dispute: {e}")
                pass

    elif event['type'] == 'invoice.payment_succeeded':
        invoice = event['data']['object']
        subscription_id = invoice.get('subscription')
        
        if subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
                user_id_str = subscription.get('metadata', {}).get('user_id')
                if user_id_str:
                    user_id = int(user_id_str)
                    
                    # Update User to Premium for 30 days
                    user_result = await db.execute(select(User).filter(User.telegram_id == user_id).with_for_update())
                    user = user_result.scalars().first()
                    
                    if user:
                        user.is_premium = True
                        user.premium_tier = subscription.get('metadata', {}).get('tier', 'premium')
                        
                        from datetime import datetime, timezone, timedelta
                        now = datetime.now(timezone.utc).replace(tzinfo=None)
                        user.premium_expires_at = now + timedelta(days=30)
                        
                        db.add(user)
                        
                        # Add transaction ledger entry for subscription payment
                        amount_paid = invoice.get('amount_paid', 0)
                        if amount_paid > 0:
                            sub_tx = Transaction(
                                user_id=user_id,
                                type="subscription",
                                amount=amount_paid,
                                fee=0,  # Stripe fees handled differently, but we log gross
                                status="completed",
                                reference_id=f"sub_{invoice.get('id', '')}"
                            )
                            db.add(sub_tx)
                        
                        await db.commit()
                        
                        try:
                            from app.services.telegram_bot import TelegramService
                            await TelegramService.send_notification(
                                user_id,
                                "<b>🌟 Premium Subscription Active!</b>\n\n"
                                "Your Stripe payment was successful. You now have access to Premium features for 30 days!\n"
                                "Enjoy your enhanced Chess experience."
                            )
                        except Exception:
                            pass
                        
                        return {"status": "success", "message": "Subscription activated."}
            except Exception as e:
                logger.error(f"Failed to process subscription payment: {e}")

    elif event['type'] == 'invoice.payment_failed':
        invoice = event['data']['object']
        subscription_id = invoice.get('subscription')
        
        if subscription_id:
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
                user_id_str = subscription.get('metadata', {}).get('user_id')
                if user_id_str:
                    user_id = int(user_id_str)
                    try:
                        from app.services.telegram_bot import TelegramService
                        await TelegramService.send_notification(
                            user_id,
                            "<b>⚠️ Subscription Payment Failed</b>\n\n"
                            "We were unable to process your recent Premium subscription payment. "
                            "Please update your payment method via the 'Manage Subscription' button to avoid losing access to Premium features."
                        )
                    except Exception:
                        pass
            except Exception as e:
                logger.error(f"Failed to process payment_failed event: {e}")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        user_id_str = subscription.get('metadata', {}).get('user_id')
        
        if user_id_str:
            try:
                user_id = int(user_id_str)
                user_result = await db.execute(select(User).filter(User.telegram_id == user_id).with_for_update())
                user = user_result.scalars().first()
                
                if user:
                    user.is_premium = False
                    user.premium_expires_at = None
                    user.stripe_subscription_id = None
                    db.add(user)
                    await db.commit()
                    
                    try:
                        from app.services.telegram_bot import TelegramService
                        await TelegramService.send_notification(
                            user_id,
                            "<b>ℹ️ Subscription Cancelled</b>\n\n"
                            "Your Premium subscription has been cancelled or expired. You have been moved to the free tier."
                        )
                    except Exception:
                        pass
                    
                    return {"status": "success", "message": "Subscription cancelled."}
            except Exception as e:
                logger.error(f"Failed to process subscription deletion: {e}")

    return {"status": "success", "message": "Event received."}


