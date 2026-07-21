"""Safe reconciliation visibility for every non-terminal withdrawal state."""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

NON_TERMINAL_STATUSES = (
    "pending",
    "pending_confirmation",
    "pending_review",
    "processing_payout",
)


def _now_naive_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


async def reconcile_nonterminal_withdrawals(db=None) -> dict[str, int]:
    """Count and escalate unresolved withdrawal states without blind refunds.

    State-specific workers perform the mutations: the confirmation sweeper
    handles held requests, the on-chain crawler resolves ``pending`` payouts,
    and the payout monitor handles ``processing_payout``. This reconciler makes
    the remaining manual-review and unresolved-pending paths visible.
    """
    owns_session = db is None
    if owns_session:
        async with AsyncSessionLocal() as session:
            return await reconcile_nonterminal_withdrawals(session)

    rows = await db.execute(
        select(Transaction).where(
            Transaction.type == "withdrawal",
            Transaction.status.in_(NON_TERMINAL_STATUSES),
        )
    )
    transactions = rows.scalars().all()
    summary = {status: 0 for status in NON_TERMINAL_STATUSES}
    for tx in transactions:
        summary[tx.status] += 1

    stale_before = _now_naive_utc() - timedelta(minutes=30)
    for tx in transactions:
        if tx.status not in ("pending", "pending_review") or not tx.created_at or tx.created_at > stale_before:
            continue
        from app.core.alerts import send_alert_with_redis_rate_limit
        await send_alert_with_redis_rate_limit(
            f"withdrawal_reconciliation:{tx.status}:{tx.id}",
            "<b>Withdrawal requires reconciliation</b>\n\n"
            f"• <b>Transaction:</b> #{tx.id}\n"
            f"• <b>State:</b> <code>{tx.status}</code>\n"
            f"• <b>User:</b> <code>{tx.user_id}</code>\n"
            f"• <b>Amount held:</b> ${abs(tx.amount) / 100:.2f} USDT\n\n"
            "<i>Inspect the payout and approval history before changing state. Do not blind-refund.</i>",
            system="treasury",
        )
    logger.info("Non-terminal withdrawal reconciliation: %s", summary)
    return summary
