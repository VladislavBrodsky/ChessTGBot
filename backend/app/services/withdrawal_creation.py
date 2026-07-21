"""Durable creation and recovery operations for withdrawal ledger rows."""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, update

from app.crud import user as user_crud
from app.models.transaction import Transaction
from app.models.user import User
from app.services.withdrawal_policy import exceeds_daily_cap, remaining_daily_allowance_cents


class DailyWithdrawalCapExceeded(Exception):
    def __init__(self, remaining_cents: int):
        self.remaining_cents = remaining_cents
        super().__init__("Daily withdrawal cap exceeded")


class InsufficientWithdrawalBalance(Exception):
    pass


@dataclass
class CreatedWithdrawal:
    transaction: Transaction
    user: User
    new_balance: int


def _now_naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def create_withdrawal(
    db,
    *,
    user_id: int,
    amount_cents: int,
    fee_cents: int,
    status: str,
    reference_id: str,
    daily_cap_cents: int,
) -> CreatedWithdrawal:
    """Debit and create the withdrawal ledger row in one transaction.

    Locking the user row serializes cap calculations for that user.  The
    conditional debit still protects the balance itself, while the single
    commit guarantees there is never a durable debit without its ledger row.
    """
    user = await user_crud.get_user_by_telegram_id(db, user_id, for_update=True)
    if user is None:
        raise InsufficientWithdrawalBalance()

    since = _now_naive_utc() - timedelta(hours=24)
    recent_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.user_id == user_id,
            Transaction.type == "withdrawal",
            Transaction.status != "failed",
            Transaction.created_at >= since,
        )
    )
    withdrawn_24h_cents = -int(recent_result.scalar() or 0)
    if exceeds_daily_cap(withdrawn_24h_cents, amount_cents, daily_cap_cents):
        raise DailyWithdrawalCapExceeded(
            remaining_daily_allowance_cents(withdrawn_24h_cents, daily_cap_cents)
        )

    debited_user = await user_crud.atomic_debit(db, user_id, amount_cents, commit=False)
    if debited_user is None:
        raise InsufficientWithdrawalBalance()

    transaction = Transaction(
        user_id=user_id,
        type="withdrawal",
        amount=-amount_cents,
        fee=fee_cents,
        status=status,
        reference_id=reference_id,
    )
    db.add(transaction)
    try:
        await db.flush()
        new_balance = await db.scalar(select(User.balance).where(User.telegram_id == user_id))
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return CreatedWithdrawal(
        transaction=transaction,
        user=user,
        new_balance=int(new_balance),
    )


async def set_payout_result(
    db,
    tx_id: int,
    *,
    status: str,
    reference_id: str | None,
) -> None:
    """Finalize a claimed direct payout without reopening its creation state."""
    result = await db.execute(
        update(Transaction)
        .where(
            Transaction.id == tx_id,
            Transaction.type == "withdrawal",
            Transaction.status == "processing_payout",
        )
        .values(status=status, reference_id=reference_id)
    )
    if result.rowcount != 1:
        await db.rollback()
        raise RuntimeError(f"Withdrawal {tx_id} was no longer processing during payout finalization")
    await db.commit()


async def fail_and_refund_withdrawal(
    db,
    tx_id: int,
    *,
    expected_status: str,
    reference_id: str,
) -> int | None:
    """Mark a held withdrawal failed and refund it in one database transaction."""
    tx_result = await db.execute(
        update(Transaction)
        .where(
            Transaction.id == tx_id,
            Transaction.type == "withdrawal",
            Transaction.status == expected_status,
        )
        .values(status="failed", reference_id=reference_id)
    )
    if tx_result.rowcount != 1:
        await db.rollback()
        return None

    tx = (await db.execute(select(Transaction).where(Transaction.id == tx_id))).scalars().one()
    await user_crud.atomic_credit(db, tx.user_id, -tx.amount, commit=False)
    try:
        new_balance = await db.scalar(select(User.balance).where(User.telegram_id == tx.user_id))
        await db.commit()
    except Exception:
        await db.rollback()
        raise
    return int(new_balance)
