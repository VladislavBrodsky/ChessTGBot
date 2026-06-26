from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)
from sqlalchemy.future import select
from sqlalchemy import desc
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.crud import user as user_crud
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

router = APIRouter()

import base64

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
        return base64.urlsafe_b64encode(final_buf).decode("utf-8")
    except Exception:
        return raw_addr

async def fetch_all_prices() -> dict:
    """
    Fetches the current prices in USD for TON, USDT, USDC, BTC, and ETH.
    Uses TonAPI rates and falls back to CoinGecko and hardcoded defaults.
    """
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
        
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                rates = data.get("rates", {})
                
                prices = {}
                for symbol, addr in tokens.items():
                    val = rates.get(addr) or rates.get(symbol.upper()) or rates.get(symbol.lower())
                    if val and "prices" in val and "USD" in val["prices"]:
                        prices[symbol] = float(val["prices"]["USD"])
                
                if len(prices) == 5:
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
                    return prices
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch prices from CoinGecko: {e}")

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

class DepositRequest(BaseModel):
    amount: int  # In cents (smallest unit, e.g. 1000 = $10.00)

class DepositResponse(BaseModel):
    status: str
    credited_amount: int
    fee: int
    new_balance: int
    payment_link: Optional[str] = None
    invoice_id: Optional[str] = None

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
    updated_user = await user_crud.update_wallet_address(db, current_user, request.wallet_address)
    return BalanceResponse(
        balance=updated_user.balance,
        wallet_address=updated_user.wallet_address
    )

@router.post("/deposit", response_model=DepositResponse)
async def deposit_funds(
    request: DepositRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Initiate a deposit. If TON Console token is configured, creates a real TON invoice.
    Otherwise, simulates a mock instant deposit.
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    from app.core.config import get_settings
    settings = get_settings()

    # Calculate 5% fee and credit amount
    fee = int(request.amount * 0.05)
    credited_amount = request.amount - fee

    if settings.CRYPTO_PAY_API_TOKEN:
        from app.services.crypto_pay import CryptoPayService
        try:
            invoice = await CryptoPayService.create_invoice(request.amount, current_user.telegram_id)
            payment_link = invoice.get("pay_url")
            invoice_id = str(invoice.get("invoice_id"))

            tx_deposit = Transaction(
                user_id=current_user.telegram_id,
                type="deposit",
                amount=credited_amount,
                fee=fee,
                status="pending",
                reference_id=f"invoice_{invoice_id}"
            )
            db.add(tx_deposit)
            await db.commit()

            return DepositResponse(
                status="invoice",
                payment_link=payment_link,
                invoice_id=invoice_id,
                credited_amount=credited_amount,
                fee=fee,
                new_balance=current_user.balance
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to generate invoice on Crypto Pay: {e}")

    if settings.TON_CONSOLE_TOKEN:
        # Create an actual invoice via Tonconsole Invoices API
        import httpx
        ton_price_usd = await fetch_ton_price_usd(settings.TON_API_KEY)
        
        # Convert cents (amount) to nanoTON
        usd_amount = request.amount / 100.0
        ton_needed = usd_amount / ton_price_usd
        nano_ton = int(ton_needed * 1_000_000_000)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://tonconsole.com/api/v1/services/invoices/invoice",
                    headers={
                        "Authorization": f"Bearer {settings.TON_CONSOLE_TOKEN}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "amount": str(nano_ton),
                        "currency": "TON",
                        "life_time": 1800, # 30 mins
                        "description": f"ref_{current_user.telegram_id}"
                    }
                )
                if res.status_code != 200:
                    import logging
                    logging.getLogger(__name__).error(
                        f"Tonconsole Invoice creation failed: {res.status_code} - {res.text}"
                    )
                    raise HTTPException(status_code=400, detail="Failed to generate invoice on TON Console")
                
                invoice_data = res.json()
                payment_link = invoice_data.get("payment_link")
                invoice_id = invoice_data.get("id")
                
                # Create a pending transaction ledger entry
                tx_deposit = Transaction(
                    user_id=current_user.telegram_id,
                    type="deposit",
                    amount=credited_amount,
                    fee=fee,
                    status="pending",
                    reference_id=f"invoice_{invoice_id}"
                )
                db.add(tx_deposit)
                await db.commit()

                return DepositResponse(
                    status="invoice",
                    payment_link=payment_link,
                    invoice_id=invoice_id,
                    credited_amount=credited_amount,
                    fee=fee,
                    new_balance=current_user.balance
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Invoices API request error: {e}")

    # Mock/simulated fallback if TON_CONSOLE_TOKEN is not configured
    updated_user = await user_crud.atomic_credit(db, current_user.telegram_id, credited_amount)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    tx_deposit = Transaction(
        user_id=current_user.telegram_id,
        type="deposit",
        amount=credited_amount,
        fee=fee,
        status="completed",
        reference_id="web3_deposit_mock"
    )
    db.add(tx_deposit)

    await db.commit()
    logger.info(f"[TRANSACTION] user_id={current_user.telegram_id} | type=deposit | amount={credited_amount} cents (${credited_amount/100:.2f}) | fee={fee} cents (${fee/100:.2f}) | reference_id=web3_deposit_mock | status=completed")

    try:
        from app.services.telegram_bot import TelegramService
        notification_text = (
            f"<b>⚡️ Cyber Wallet Top-Up Complete!</b>\n\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Deposit Fee (5%):</b> -${fee / 100:.2f} USDT\n"
            f"• <b>Reference ID:</b> <code>{tx_deposit.reference_id}</code>\n\n"
            f"<i>Your updated platform balance is {updated_user.balance / 100:.2f} USDT. Ready to bid! ♟️</i>"
        )
        await TelegramService.send_notification(current_user.telegram_id, notification_text)
    except Exception as e:
        pass

    return DepositResponse(
        status="success",
        credited_amount=credited_amount,
        fee=fee,
        new_balance=updated_user.balance
    )

@router.post("/withdraw", response_model=WithdrawResponse)
async def withdraw_funds(
    request: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Withdraw funds from platform balance to linked Web3 TON Address.
    Verifies sufficient balance prior to initiating. Places request in review queue.
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")

    # Validate destination address format
    try:
        convert_ton_address_to_hex(request.address)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid TON Wallet address format")
    
    # Atomically debit — returns None if insufficient funds
    updated_user = await user_crud.atomic_debit(db, current_user.telegram_id, request.amount)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Insufficient funds in balance")

    # Log pending review transaction
    tx_withdraw = Transaction(
        user_id=updated_user.telegram_id,
        type="withdrawal",
        amount=-request.amount,
        fee=0,
        status="pending_review",
        reference_id=f"addr_{request.address}"
    )
    db.add(tx_withdraw)
    await db.commit()
    logger.info(f"[TRANSACTION] user_id={current_user.telegram_id} | type=withdrawal | amount=-{request.amount} cents (-${request.amount/100:.2f}) | fee=0 cents ($0.00) | reference_id={tx_withdraw.reference_id} | status=completed")

    # Send automated Telegram Bot notification
    try:
        from app.services.telegram_bot import TelegramService
        dest_display = f"{request.address[:6]}...{request.address[-4:]}"
        notification_text = (
            f"<b>📤 Cyber Wallet Withdrawal Requested!</b>\n\n"
            f"• <b>Requested Amount:</b> -${request.amount / 100:.2f} USDT\n"
            f"• <b>Destination TON Wallet:</b> <code>{dest_display}</code>\n"
            f"• <b>Status:</b> Pending Admin Review ⏳\n\n"
            f"<i>Your updated platform balance is {updated_user.balance / 100:.2f} USDT. We will notify you once processed!</i>"
        )
        await TelegramService.send_notification(updated_user.telegram_id, notification_text)
    except Exception:
        pass

    return WithdrawResponse(
        status="pending_review",
        amount=request.amount,
        new_balance=updated_user.balance
    )


@router.get("/transactions", response_model=List[TransactionItem])
async def get_transaction_ledger(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
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


_ton_price_cache = {
    "price": 5.40,
    "last_fetched": 0.0
}

async def fetch_ton_price_usd(api_key: Optional[str] = None) -> float:
    """
    Fetches the current TON price in USD from tonapi.io rates endpoint.
    Caches the result in memory for 60 seconds to prevent rate limiting.
    """
    import time
    global _ton_price_cache
    now = time.time()
    
    if now - _ton_price_cache["last_fetched"] < 60.0:
        return _ton_price_cache["price"]
        
    import httpx
    url = "https://tonapi.io/v2/rates?tokens=ton&currencies=usd"
    headers = {}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                data = res.json()
                price = data.get("rates", {}).get("ton", {}).get("prices", {}).get("USD")
                if price:
                    _ton_price_cache["price"] = float(price)
                    _ton_price_cache["last_fetched"] = now
                    return float(price)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch TON price from TonAPI: {e}")
    return _ton_price_cache["price"]


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

        # Convert to cents
        currency = (payload.currency or "TON").upper()
        if currency == "USDT":
            amount_micro = int(payload.amount or 0)
            amount_cents = int(round(amount_micro / 10000.0))
        else:
            amount_nano = int(payload.amount or 0)
            ton_amount = amount_nano / 1_000_000_000.0
            ton_price_usd = await fetch_ton_price_usd(settings.TON_API_KEY)
            amount_cents = int(round(ton_amount * ton_price_usd * 100))

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
        
        # Extract comment and amount based on whether it is a Jetton transfer notification
        decoded_body = in_msg.get("decoded_body") or {}
        op_name = in_msg.get("decoded_op_name") or ""
        op_code = in_msg.get("op_code") or ""
        
        is_jetton = op_name == "transfer_notification" or op_code == "0x7362d09c" or "jetton" in str(decoded_body.get("type", "")).lower()

        comment = ""
        if is_jetton and isinstance(decoded_body, dict):
            # For Jetton transfers, the comment is nested in forward_payload
            fwd = decoded_body.get("forward_payload") or {}
            if isinstance(fwd, dict):
                comment = fwd.get("text") or fwd.get("comment") or ""
            elif isinstance(fwd, str):
                comment = fwd
            
            # If amount is present in decoded_body, use it (decimals for USDT is 6, so amount is in micro-USDT)
            jetton_amount_raw = decoded_body.get("amount")
            if jetton_amount_raw is not None:
                try:
                    amount_cents = int(round(int(jetton_amount_raw) / 10000.0))
                except ValueError:
                    amount_cents = 0
            else:
                amount_cents = 0
        else:
            # Standard TON transfer
            value_nano = int(in_msg.get("value", 0))
            if isinstance(decoded_body, dict):
                comment = decoded_body.get("text") or decoded_body.get("Text") or decoded_body.get("comment") or ""
            elif isinstance(decoded_body, str):
                comment = decoded_body

            if not comment:
                comment = in_msg.get("message") or ""
            
            # Convert nanoTON to cents
            ton_amount = value_nano / 1_000_000_000.0
            ton_price_usd = await fetch_ton_price_usd(settings.TON_API_KEY)
            amount_cents = int(round(ton_amount * ton_price_usd * 100))

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
    fee = int(amount_cents * 0.05)
    credited_amount = amount_cents - fee

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
    except Exception as e:
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


@router.post("/deposit/verify")
async def verify_deposit(
    request: DepositVerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.core.config import get_settings
    settings = get_settings()

    message_hash = request.message_hash
    telegram_id = current_user.telegram_id

    # Enforce replay protection
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
    url = f"https://tonapi.io/v2/events/{message_hash}"
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    event_data = None
    # Poll for up to 30 seconds
    for attempt in range(15):
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 200:
                    event_data = res.json()
                    break
                elif res.status_code == 404:
                    # Not mined yet
                    pass
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

    # Walk through the actions to verify the transaction
    actions = event_data.get("actions", [])
    verified_tx = False
    amount_cents = 0
    sender_addr = "unknown"
    currency_symbol = "USDT"

    # Define currency decimals
    decimals_map = {
        "TON": 9,
        "USDT": 6,
        "USDC": 6,
        "BTC": 8,
        "ETH": 9
    }

    # Fetch fresh prices
    prices = await fetch_all_prices()

    for action in actions:
        if action.get("status") != "ok":
            continue

        action_type = action.get("type")

        if action_type == "TonTransfer":
            ton_transfer = action.get("TonTransfer", {})
            recipient = ton_transfer.get("recipient", {}).get("address", "")
            sender = ton_transfer.get("sender", {}).get("address", "")
            amount_nano = int(ton_transfer.get("amount", 0))
            comment = ton_transfer.get("comment", "")

            # Convert addresses to raw format for comparison
            try:
                recipient_raw = convert_ton_address_to_hex(recipient)
                master_raw = convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)
            except Exception:
                continue

            if recipient_raw == master_raw and comment == f"ref_{telegram_id}":
                # Successfully verified direct TON transfer!
                # Calculate value in USD cents
                ton_amount = amount_nano / 1_000_000_000.0
                ton_price = prices.get("TON", 5.40)
                amount_cents = int(round(ton_amount * ton_price * 100))
                sender_addr = sender
                currency_symbol = "TON"
                verified_tx = True
                break

        elif action_type == "JettonTransfer":
            jetton_transfer = action.get("JettonTransfer", {})
            recipient = jetton_transfer.get("recipient", {}).get("address", "")
            sender = jetton_transfer.get("sender", {}).get("address", "")
            amount_raw = int(jetton_transfer.get("amount", 0))
            comment = jetton_transfer.get("comment", "")
            jetton_master = jetton_transfer.get("jetton", {}).get("address", "")
            jetton_symbol = jetton_transfer.get("jetton", {}).get("symbol", "").upper()

            # Compare recipient with our master address
            try:
                recipient_raw = convert_ton_address_to_hex(recipient)
                master_raw = convert_ton_address_to_hex(settings.MASTER_WALLET_ADDRESS)
                jetton_master_raw = convert_ton_address_to_hex(jetton_master)
            except Exception:
                continue

            if recipient_raw == master_raw and comment == f"ref_{telegram_id}":
                # Find matching Jetton
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
                    # Verified Jetton transfer!
                    decimals = decimals_map.get(matched_symbol, 6)
                    token_amount = amount_raw / (10 ** decimals)
                    token_price = prices.get(matched_symbol, 1.00)
                    amount_cents = int(round(token_amount * token_price * 100))
                    sender_addr = sender
                    currency_symbol = matched_symbol
                    verified_tx = True
                    break

    if not verified_tx:
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
    user_result = await db.execute(
        select(User).filter(User.telegram_id == telegram_id).with_for_update()
    )
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Double check replay protection (inside db transaction lock)
    existing_tx_result = await db.execute(
        select(Transaction).filter(Transaction.reference_id == message_hash)
    )
    if existing_tx_result.scalars().first():
        return {
            "status": "success",
            "credited_amount": 0,
            "new_balance": user.balance,
            "message": "Already processed"
        }

    # Deduct 5% platform fee
    fee = int(amount_cents * 0.05)
    credited_amount = amount_cents - fee

    user.balance += credited_amount
    db.add(user)

    # Log deposit transaction
    tx_deposit = Transaction(
        user_id=telegram_id,
        type="deposit",
        amount=credited_amount,
        fee=fee,
        status="completed",
        reference_id=message_hash
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

    # Send telegram notification
    try:
        from app.services.telegram_bot import TelegramService
        sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
        notification_text = (
            f"<b>⚡️ Cyber Web3 Top-Up Confirmed!</b>\n\n"
            f"• <b>Sender Address:</b> <code>{sender_display}</code>\n"
            f"• <b>Currency:</b> {currency_symbol}\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT\n"
            f"• <b>Transaction ID:</b> <code>{message_hash[:10]}...{message_hash[-8:] if len(message_hash) > 8 else ''}</code>\n\n"
            f"<i>Your balance has been updated. Platform Balance: {user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
        )
        await TelegramService.send_notification(telegram_id, notification_text)
    except Exception:
        pass

    return {
        "status": "success",
        "credited_amount": credited_amount,
        "fee": fee,
        "new_balance": user.balance
    }


# --- Admin Withdrawal Queue Endpoints ---

async def verify_admin_secret(x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret")):
    from app.core.config import get_settings
    settings = get_settings()
    if not x_admin_secret or x_admin_secret != settings.WEBHOOK_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid admin secret")
    return x_admin_secret

class PendingWithdrawalItem(BaseModel):
    id: int
    user_id: int
    amount: int
    address: str
    created_at: datetime

@router.get("/admin/withdrawals/pending", response_model=List[PendingWithdrawalItem])
async def get_pending_withdrawals(
    db: AsyncSession = Depends(get_db),
    admin_secret: str = Depends(verify_admin_secret)
):
    """
    Get all pending withdrawals. Admin access only.
    """
    result = await db.execute(
        select(Transaction).where(Transaction.type == "withdrawal", Transaction.status == "pending_review")
    )
    txs = result.scalars().all()
    
    items = []
    for tx in txs:
        # Extract address from reference_id (stored as "addr_{address}")
        address = ""
        if tx.reference_id and tx.reference_id.startswith("addr_"):
            address = tx.reference_id[5:]
        items.append(
            PendingWithdrawalItem(
                id=tx.id,
                user_id=tx.user_id,
                amount=abs(tx.amount),
                address=address,
                created_at=tx.created_at
            )
        )
    return items

@router.post("/admin/withdrawals/{tx_id}/approve")
async def approve_withdrawal(
    tx_id: int,
    db: AsyncSession = Depends(get_db),
    admin_secret: str = Depends(verify_admin_secret)
):
    """
    Approve a pending withdrawal. Admin access only.
    """
    tx_result = await db.execute(
        select(Transaction).where(Transaction.id == tx_id, Transaction.status == "pending_review").with_for_update()
    )
    tx = tx_result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Pending withdrawal transaction not found")
        
    tx.status = "completed"
    db.add(tx)
    await db.commit()
    
    # Notify user
    try:
        from app.services.telegram_bot import TelegramService
        address = tx.reference_id[5:] if tx.reference_id and tx.reference_id.startswith("addr_") else "linked wallet"
        dest_display = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address
        notification_text = (
            f"<b>✅ Withdrawal Approved!</b>\n\n"
            f"• <b>Amount:</b> +${abs(tx.amount) / 100:.2f} USDT\n"
            f"• <b>Sent to:</b> <code>{dest_display}</code>\n\n"
            f"<i>Your funds have been transferred successfully on-chain!</i>"
        )
        await TelegramService.send_notification(tx.user_id, notification_text)
    except Exception:
        pass
        
    return {"status": "success", "message": f"Withdrawal transaction {tx_id} completed successfully"}

@router.post("/admin/withdrawals/{tx_id}/reject")
async def reject_withdrawal(
    tx_id: int,
    db: AsyncSession = Depends(get_db),
    admin_secret: str = Depends(verify_admin_secret)
):
    """
    Reject a pending withdrawal. Admin access only. Refunds user balance.
    """
    tx_result = await db.execute(
        select(Transaction).where(Transaction.id == tx_id, Transaction.status == "pending_review").with_for_update()
    )
    tx = tx_result.scalars().first()
    if not tx:
        raise HTTPException(status_code=404, detail="Pending withdrawal transaction not found")
        
    # Refund balance atomically (tx.amount is negative for withdrawals)
    updated_user = await user_crud.atomic_credit(db, tx.user_id, abs(tx.amount))
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tx.status = "failed"
    db.add(tx)
    await db.commit()
    
    # Notify user
    try:
        from app.services.telegram_bot import TelegramService
        notification_text = (
            f"<b>❌ Withdrawal Rejected!</b>\n\n"
            f"• <b>Amount:</b> ${abs(tx.amount) / 100:.2f} USDT\n"
            f"• <b>Status:</b> Rejected & Refunded\n\n"
            f"<i>The requested amount has been fully refunded back to your game balance. Please verify your destination address or contact support.</i>"
        )
        await TelegramService.send_notification(tx.user_id, notification_text)
    except Exception:
        pass
        
    return {"status": "success", "message": f"Withdrawal transaction {tx_id} rejected and refunded"}

