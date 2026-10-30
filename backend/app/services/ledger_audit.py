import asyncio
import logging
from sqlalchemy import select, func, and_, or_, exists, literal, cast, String
from sqlalchemy.orm import aliased
from app.models.user import User
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

# Transaction types that directly modify user balance (excluding platform fee/rake records)
BALANCE_TYPES = [
    "deposit", "withdrawal", "game_wager", "game_win",
    "refund", "game_refund", "subscription",
    "referral_commission", "subscription_commission", "referral_commission_leakage",
    "deposit_reversal", "ledger_adjustment", "chargeback", "withdrawal_refund",
    "marketplace_purchase",
]


def balance_affecting():
    """Rows whose amount is already reflected in User.balance.

    Completed rows of BALANCE_TYPES, plus debits that hit the balance before
    their row is final:
    - withdrawals: debited at creation in every status. A failure writes a
      separate withdrawal_refund row ("withdrawal_refund:<id>"), so a failed
      debit counts when that row exists. Before refund rows existed (mid-2026)
      a failure credited the balance silently; such a failed debit has no
      refund row and is left out, exactly as its silent refund is.
    - matchmaking holds: a pending game_wager is already debited; a refund
      flips it to failed (no separate row), so only pending ones are added.
    Without these, every in-flight payout or queued stake looked like a ledger
    mismatch, and every refunded withdrawal looked like one permanently.
    """
    refund = aliased(Transaction)
    has_refund_row = exists().where(
        refund.type == "withdrawal_refund",
        refund.reference_id == literal("withdrawal_refund:") + cast(Transaction.id, String),
    )
    return or_(
        and_(Transaction.status == "completed", Transaction.type.in_(BALANCE_TYPES)),
        and_(Transaction.type == "withdrawal", Transaction.status != "failed"),
        and_(Transaction.type == "withdrawal", Transaction.status == "failed", has_refund_row),
        and_(Transaction.type == "game_wager", Transaction.status == "pending"),
    )


class LedgerAuditService:
    @classmethod
    async def run_audit(cls, db) -> list:
        """
        Executes a single, optimized SQL query to perform double-entry bookkeeping reconciliation.
        Returns a list of tuples containing users with mismatches:
        [(telegram_id, first_name, profile_balance, ledger_balance), ...]
        """
        query = (
            select(
                User.telegram_id,
                User.first_name,
                User.balance,
                func.coalesce(func.sum(Transaction.amount), 0).label("ledger_sum")
            )
            .outerjoin(
                Transaction,
                (User.telegram_id == Transaction.user_id) & balance_affecting()
            )
            .group_by(User.id, User.telegram_id, User.first_name, User.balance)
            .having(User.balance != func.coalesce(func.sum(Transaction.amount), 0))
        )
        result = await db.execute(query)
        return result.all()

async def start_ledger_audit_loop():
    """Background loop that executes the ledger reconciliation audit periodically."""
    from app.core.database import AsyncSessionLocal
    
    # Wait for bot and database startup sequences to settle
    await asyncio.sleep(30)
    logger.info("Ledger audit background loop scheduler started.")
    
    while True:
        try:
            async with AsyncSessionLocal() as db:
                mismatches = await LedgerAuditService.run_audit(db)
                if mismatches:
                    from app.core.alerts import send_alert_with_redis_rate_limit
                    mismatch_lines = []
                    for telegram_id, first_name, profile_bal, ledger_bal in mismatches:
                        diff = profile_bal - ledger_bal
                        line = (
                            f"• User: {first_name} (<code>{telegram_id}</code>)\n"
                            f"  - Profile Balance: <code>{profile_bal / 100:.2f} USDT</code>\n"
                            f"  - Ledger Sum: <code>{ledger_bal / 100:.2f} USDT</code>\n"
                            f"  - Difference: <code>{diff / 100:.2f} USDT</code>"
                        )
                        mismatch_lines.append(line)
                        logger.error(
                            f"❌ [LEDGER AUDIT MISMATCH] User {first_name} ({telegram_id}) balance mismatch! "
                            f"Profile Balance: {profile_bal} cents, Ledger Sum: {ledger_bal} cents. "
                            f"Difference: {diff} cents."
                        )
                    
                    alert_text = (
                        "<b>Ledger reconciliation anomaly detected</b>\n\n"
                        "The following users have mismatched database profile balances vs. transaction ledger totals:\n\n" +
                        "\n\n".join(mismatch_lines)
                    )
                    await send_alert_with_redis_rate_limit(
                        "ledger_audit:balance_mismatch",
                        alert_text,
                        system="treasury",
                    )
                else:
                    logger.info("✅ Ledger reconciliation audit run: 0 anomalies detected.")
        except Exception as e:
            logger.error(f"Error in background ledger audit loop: {e}", exc_info=True)
            
        # Run audit every 12 hours (43200 seconds)
        await asyncio.sleep(43200)
