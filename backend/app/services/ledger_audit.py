import asyncio
import logging
from sqlalchemy import select, func
from app.models.user import User
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

# Transaction types that directly modify user balance (excluding platform fee/rake records)
BALANCE_TYPES = [
    "deposit", "withdrawal", "game_wager", "game_win",
    "refund", "game_refund", "subscription",
    "referral_commission", "subscription_commission",
    "deposit_reversal", "ledger_adjustment", "chargeback"
]

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
                (User.telegram_id == Transaction.user_id) &
                (Transaction.status == "completed") &
                (Transaction.type.in_(BALANCE_TYPES))
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
                    from app.core.alerts import send_admin_alert
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
                        "🚨 <b>LEDGER RECONCILIATION ANOMALY DETECTED!</b>\n\n"
                        "The following users have mismatched database profile balances vs. transaction ledger totals:\n\n" +
                        "\n\n".join(mismatch_lines)
                    )
                    await send_admin_alert(alert_text, system="treasury")
                else:
                    logger.info("✅ Ledger reconciliation audit run: 0 anomalies detected.")
        except Exception as e:
            logger.error(f"Error in background ledger audit loop: {e}", exc_info=True)
            
        # Run audit every 12 hours (43200 seconds)
        await asyncio.sleep(43200)
