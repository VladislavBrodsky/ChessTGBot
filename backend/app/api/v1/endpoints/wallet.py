from fastapi import APIRouter, Depends, HTTPException
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

class WithdrawRequest(BaseModel):
    amount: int  # In cents
    address: str

class WithdrawResponse(BaseModel):
    status: str
    amount: int
    new_balance: int

class TransactionItem(BaseModel):
    id: int
    type: str  # 'deposit', 'withdrawal', 'game_wager', 'game_win', 'deposit_fee', 'game_rake'
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
    Initiate a mocked Web3 Wallet topup.
    Charges a 5% Platform Top-up fee on the deposit amount.
    """
    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    # Platform Fee: 5%
    fee = int(request.amount * 0.05)
    credited_amount = request.amount - fee

    # Update user balance
    current_user.balance += credited_amount
    db.add(current_user)

    # 1. Log Deposit Transaction
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

    # Send automated Telegram Bot notification
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
    
    if current_user.balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds in balance")

    # Deduct balance
    current_user.balance -= request.amount
    db.add(current_user)

    # Log Withdrawal Transaction
    tx_withdraw = Transaction(
        user_id=current_user.telegram_id,
        type="withdrawal",
        amount=-request.amount,
        fee=0,
        status="completed",
        reference_id=f"web3_withdraw_{request.address[:8]}"
    )
    db.add(tx_withdraw)

    await db.commit()
    await db.refresh(current_user)

    # Send automated Telegram Bot notification
    try:
        from app.services.telegram_bot import TelegramService
        dest_display = f"{request.address[:6]}...{request.address[-4:]}" if len(request.address) > 10 else request.address
        notification_text = (
            f"<b>📤 Cyber Wallet Withdrawal Initiated!</b>\n\n"
            f"• <b>Withdrawn Amount:</b> -${request.amount / 100:.2f} USDT\n"
            f"• <b>Destination TON Wallet:</b> <code>{dest_display}</code>\n\n"
            f"<i>Funds are on their way to the TON network. Remaining platform balance is {current_user.balance / 100:.2f} USDT.</i>"
        )
        await TelegramService.send_notification(current_user.telegram_id, notification_text)
    except Exception as e:
        pass

    return WithdrawResponse(
        status="success",
        amount=request.amount,
        new_balance=current_user.balance
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


class TonWebhookPayload(BaseModel):
    event: str = "transfer"
    tx_hash: str
    sender: str
    destination: str
    amount_cents: int  # e.g., 1000 = $10.00 USDT
    comment: str       # Format: "ref_<telegram_id>"

@router.post("/webhook")
async def receive_ton_deposit_webhook(
    payload: TonWebhookPayload,
    db: AsyncSession = Depends(get_db)
):
    """
    Asynchronously verify and settle Web3 TON deposits using blockchain event webhooks.
    Includes replay protection, fee calculation, routing, and instant push alerts.
    """
    from app.core.config import get_settings
    settings = get_settings()

    # 1. Verify destination address matches our Master Wallet
    if payload.destination.lower() != settings.MASTER_WALLET_ADDRESS.lower():
        raise HTTPException(
            status_code=400, 
            detail="Transaction destination does not match platform Master Wallet"
        )

    # 2. Extract Telegram ID from payload comment
    if not payload.comment.startswith("ref_"):
        raise HTTPException(
            status_code=400, 
            detail="Invalid transaction comment format. Expected 'ref_<telegram_id>'"
        )
    
    try:
        telegram_id = int(payload.comment.split("_")[1])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail="Malformed Telegram ID in comment")

    # 3. Retrieve user from db
    user_result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
    user = user_result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User associated with comment not found")

    # 4. Check for double-spend/replays using tx_hash
    existing_tx_result = await db.execute(
        select(Transaction).filter(Transaction.reference_id == payload.tx_hash)
    )
    if existing_tx_result.scalars().first():
        raise HTTPException(status_code=400, detail="Duplicate webhook: Transaction already processed")

    # 5. Process automatic 5% platform topup fee
    deposit_amount = payload.amount_cents
    fee = int(deposit_amount * 0.05)
    credited_amount = deposit_amount - fee

    # Credit user balance
    user.balance += credited_amount
    db.add(user)

    # 6. Log deposit transaction
    tx_deposit = Transaction(
        user_id=telegram_id,
        type="deposit",
        amount=credited_amount,
        fee=fee,
        status="completed",
        reference_id=payload.tx_hash
    )
    db.add(tx_deposit)

    # 7. Log routed commission transaction to Company Wallet
    tx_commission = Transaction(
        user_id=telegram_id,
        type="deposit_fee",
        amount=-fee,
        fee=0,
        status="completed",
        reference_id=f"fee_{payload.tx_hash[:16]}"
    )
    db.add(tx_commission)

    await db.commit()
    await db.refresh(user)

    # 8. Dispatch automated instant Telegram Bot notification
    try:
        from app.services.telegram_bot import TelegramService
        sender_display = f"{payload.sender[:6]}...{payload.sender[-4:]}" if len(payload.sender) > 10 else payload.sender
        notification_text = (
            f"<b>⚡️ Cyber Web3 Top-Up Confirmed!</b>\n\n"
            f"• <b>Sender Address:</b> <code>{sender_display}</code>\n"
            f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
            f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT (Routed to Company Wallet)\n"
            f"• <b>Transaction Hash:</b> <code>{payload.tx_hash[:10]}...{payload.tx_hash[-8:]}</code>\n\n"
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
