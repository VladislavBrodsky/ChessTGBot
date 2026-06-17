from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models.user import User
from app.models.transaction import Transaction
from app.crud import user as user_crud
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class BalanceResponse(BaseModel):
    balance: int
    wallet_address: Optional[str] = None

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

    class Config:
        from_attributes = True

class ConnectWalletRequest(BaseModel):
    wallet_address: str

@router.get("/balance", response_model=BalanceResponse)
async def get_wallet_balance(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user platform balance and connected wallet address.
    """
    return BalanceResponse(
        balance=current_user.balance,
        wallet_address=current_user.wallet_address
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
    current_user.balance += credited_amount
    db.add(current_user)

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
    await db.refresh(current_user)

    try:
        from app.services.telegram_bot import TelegramService
        notification_text = (
            f"<b>⚡️ Cyber Wallet Top-Up Complete!</b>\n\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Deposit Fee (5%):</b> -${fee / 100:.2f} USDT\n"
            f"• <b>Reference ID:</b> <code>{tx_deposit.reference_id}</code>\n\n"
            f"<i>Your updated platform balance is {current_user.balance / 100:.2f} USDT. Ready to bid! ♟️</i>"
        )
        await TelegramService.send_notification(current_user.telegram_id, notification_text)
    except Exception as e:
        pass

    return DepositResponse(
        status="success",
        credited_amount=credited_amount,
        fee=fee,
        new_balance=current_user.balance
    )

@router.post("/withdraw", response_model=WithdrawResponse)
async def withdraw_funds(
    request: WithdrawRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Withdraw funds from platform balance to linked Web3 TON Address.
    Verifies sufficient balance prior to initiating.
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    
    # Fetch user with write lock to prevent race conditions or double-spending
    user_result = await db.execute(
        select(User).filter(User.telegram_id == current_user.telegram_id).with_for_update()
    )
    db_user = user_result.scalars().first()
    if not db_user or db_user.balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in balance")

    # Deduct balance
    db_user.balance -= request.amount
    db.add(db_user)

    # Log Withdrawal Transaction
    tx_withdraw = Transaction(
        user_id=db_user.telegram_id,
        type="withdrawal",
        amount=-request.amount,
        fee=0,
        status="completed",
        reference_id=f"web3_withdraw_{request.address[:8]}"
    )
    db.add(tx_withdraw)

    await db.commit()
    await db.refresh(db_user)

    # Send automated Telegram Bot notification
    try:
        from app.services.telegram_bot import TelegramService
        dest_display = f"{request.address[:6]}...{request.address[-4:]}" if len(request.address) > 10 else request.address
        notification_text = (
            f"<b>📤 Cyber Wallet Withdrawal Initiated!</b>\n\n"
            f"• <b>Withdrawn Amount:</b> -${request.amount / 100:.2f} USDT\n"
            f"• <b>Destination TON Wallet:</b> <code>{dest_display}</code>\n\n"
            f"<i>Funds are on their way to the TON network. Remaining platform balance is {db_user.balance / 100:.2f} USDT.</i>"
        )
        await TelegramService.send_notification(db_user.telegram_id, notification_text)
    except Exception as e:
        pass

    return WithdrawResponse(
        status="success",
        amount=request.amount,
        new_balance=db_user.balance
    )

@router.get("/transactions", response_model=List[TransactionItem])
async def get_transaction_ledger(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the complete financial transaction ledger for the current user.
    """
    result = await db.execute(
        select(Transaction)
        .filter(Transaction.user_id == current_user.telegram_id)
        .order_by(desc(Transaction.created_at))
    )
    return result.scalars().all()


async def fetch_ton_price_usd(api_key: Optional[str] = None) -> float:
    """
    Fetches the current TON price in USD from tonapi.io rates endpoint.
    Defaults to a fallback stable price if rate fetch fails.
    """
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
                    return float(price)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Failed to fetch TON price from TonAPI: {e}")
    return 5.40


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
    payload: TonWebhookPayload,
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

    # Verify webhook secret signature (accept X-Webhook-Secret or Authorization Bearer token)
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
            # USDT has 6 decimals
            amount_micro = int(payload.amount or 0)
            amount_cents = int(amount_micro / 10000)
        else:
            # TON has 9 decimals
            amount_nano = int(payload.amount or 0)
            ton_amount = amount_nano / 1_000_000_000.0
            ton_price_usd = await fetch_ton_price_usd(settings.TON_API_KEY)
            amount_cents = int(ton_amount * ton_price_usd * 100)

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
        value_nano = int(in_msg.get("value", 0))
        sender_addr = in_msg.get("source", {}).get("address", "unknown")
        
        # Extract comment
        comment = ""
        decoded_body = in_msg.get("decoded_body") or {}
        if isinstance(decoded_body, dict):
            comment = decoded_body.get("text") or decoded_body.get("Text") or decoded_body.get("comment") or ""
        elif isinstance(decoded_body, str):
            comment = decoded_body

        if not comment:
            comment = in_msg.get("message") or ""

        if not comment.startswith("ref_"):
            raise HTTPException(status_code=400, detail="Transaction does not contain a valid referral ref_ comment")

        try:
            telegram_id = int(comment.split("_")[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Malformed Telegram ID in transaction comment")

        # Convert nanoTON to cents
        ton_amount = value_nano / 1_000_000_000.0
        ton_price_usd = await fetch_ton_price_usd(settings.TON_API_KEY)
        amount_cents = int(ton_amount * ton_price_usd * 100)

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
        tx_hash = payload.tx_hash or f"sim_tx_{int(datetime.utcnow().timestamp())}"
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
        return {"status": "success", "message": "Transaction already processed", "credited_amount": 0, "new_balance": user.balance}

    # Process automatic 5% platform topup fee
    fee = int(amount_cents * 0.05)
    credited_amount = amount_cents - fee

    # Credit user balance
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
    await db.refresh(user)

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
            f"<i>Your balance has been automatically synchronized. Updated Platform Balance: {user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
        )
        await TelegramService.send_notification(telegram_id, notification_text)
    except Exception as e:
        pass

    return {
        "status": "success",
        "credited_amount": credited_amount,
        "fee": fee,
        "new_balance": user.balance
    }
