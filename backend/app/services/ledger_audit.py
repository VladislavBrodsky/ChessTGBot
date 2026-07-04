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
    "referral_commission", "subscription_commission"
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
                    for telegram_id, first_name, profile_bal, ledger_bal in mismatches:
                        logger.error(
                            f"❌ [LEDGER AUDIT MISMATCH] User {first_name} ({telegram_id}) balance mismatch! "
                            f"Profile Balance: {profile_bal} cents, Ledger Sum: {ledger_bal} cents. "
                            f"Difference: {profile_bal - ledger_bal} cents."
                        )
                else:
                    logger.info("✅ Ledger reconciliation audit run: 0 anomalies detected.")
        except Exception as e:
            logger.error(f"Error in background ledger audit loop: {e}", exc_info=True)
            
        # Run audit every 12 hours (43200 seconds)
        await asyncio.sleep(43200)
