import asyncio
import sys
import os
import logging

# Adjust path to import backend modules when run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.core.config import get_settings
from app.core.logger import exception_summary, setup_logging
from app.services.payout_service import execute_usdt_payout
from app.services.telegram_bot import TelegramService
from sqlalchemy import select

logger = logging.getLogger(__name__)

async def _process_backlog_with_db(db):
    logger.info("Fetching backlog of completed simulated/mock withdrawals...")
    
    # Fetch all completed withdrawal transactions
    result = await db.execute(
        select(Transaction).where(
            Transaction.type == "withdrawal",
            Transaction.status == "completed"
        )
    )
    txs = result.scalars().all()
    
    backlog_txs = []
    for tx in txs:
        ref = tx.reference_id or ""
        # If reference is not a real 64-char hash, it's simulated
        if ref.startswith("addr_") or ref.startswith("mock_") or len(ref) < 60:
            backlog_txs.append(tx)
            
    if not backlog_txs:
        logger.info("No simulated/mock withdrawal backlog found. All payouts are up to date!")
        return
        
    logger.info("Found %s backlog transactions to process on-chain.", len(backlog_txs))
    
    processed_count = 0
    for tx in backlog_txs:
        msg = f"Processing Transaction #{tx.id} for User {tx.user_id} (${abs(tx.amount)/100:.2f} USDT)..."
        logger.info(msg)
        
        # 1. Resolve destination address
        address = None
        if tx.reference_id and tx.reference_id.startswith("addr_"):
            address = tx.reference_id[5:]
        
        # Fallback to user's currently linked wallet if not in reference_id
        if not address:
            user_res = await db.execute(select(User).where(User.telegram_id == tx.user_id))
            user = user_res.scalars().first()
            if user and user.wallet_address:
                address = user.wallet_address
                
        if not address:
            err_msg = f"❌ Error: Could not resolve destination address for Transaction #{tx.id}. Skipping."
            logger.error(err_msg)
            continue
            
        destination_display = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address
        logger.info("Destination wallet for Transaction #%s: %s", tx.id, destination_display)
        
        # 2. Execute on-chain payout
        try:
            payout_amount_cents = abs(tx.amount)
            
            logger.info("Sending $%.2f USDT on-chain...", payout_amount_cents / 100)
            tx_hash = await execute_usdt_payout(address, payout_amount_cents)
            
            # 3. Update transaction reference_id to the real transaction hash
            tx.reference_id = tx_hash
            db.add(tx)
            await db.commit()
            
            success_msg = f"✅ Success! Transaction #{tx.id} updated with Tx Hash: {tx_hash}"
            logger.info(success_msg)
            
            # 4. Notify user via Telegram
            dest_display = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address
            notification_text = (
                f"<b>🚀 Withdrawal Transferred On-Chain!</b>\n\n"
                f"Your legacy withdrawal has been successfully transferred on-chain from the master wallet:\n\n"
                f"• <b>Amount:</b> ${payout_amount_cents / 100:.2f} USDT\n"
                f"• <b>Destination Wallet:</b> <a href=\"https://tonviewer.com/transaction/{tx_hash}\">{dest_display}</a> 🔗\n"
                f"• <b>Status:</b> Transferred successfully on-chain! 🟢\n\n"
                f"<i>Thank you for your patience! You can track the transaction on the block explorer using the link above.</i>"
            )
            await TelegramService.send_notification(tx.user_id, notification_text)
            processed_count += 1
            
            # Sleep briefly to avoid race conditions or API rate limits
            await asyncio.sleep(2.0)
        except Exception as e:
            logger.error(
                "❌ Failed to process Transaction #%s on-chain: %s",
                tx.id,
                exception_summary(e),
                exc_info=True,
            )
            
    summary_msg = f"Backlog processing complete. Successfully sent {processed_count} of {len(backlog_txs)} transactions on-chain."
    logger.info(summary_msg)

async def process_payouts_backlog(db=None):
    """
    Scans the database for legacy simulated withdrawals, executes real blockchain
    transfers for them, updates references, and notifies users.
    Can be passed an existing session, otherwise creates a new session.
    """
    settings = get_settings()
    from app.services.payout_readiness import get_payout_readiness
    payout_readiness = get_payout_readiness(settings)
    if not payout_readiness.ready or payout_readiness.mode != "real":
        logger.debug("Payout backlog processing skipped: %s", payout_readiness.reason or payout_readiness.mode)
        return

    if db is None:
        async with AsyncSessionLocal() as session:
            await _process_backlog_with_db(session)
    else:
        await _process_backlog_with_db(db)

async def start_payout_backlog_loop():
    """Background loop that periodically retries and processes stuck/mock withdrawals."""
    # Settle bot and main startup sequence
    await asyncio.sleep(45)
    logger.info("USDT payout backlog background loop scheduler started.")
    
    while True:
        try:
            settings = get_settings()
            from app.services.payout_readiness import get_payout_readiness
            payout_readiness = get_payout_readiness(settings)
            if payout_readiness.ready and payout_readiness.mode == "real":
                logger.info("Executing automated payout backlog scan...")
                await process_payouts_backlog()
            else:
                logger.debug("Payout backlog scan skipped (payouts disabled).")
        except Exception as e:
            logger.error(f"Error in background payout backlog loop: {e}", exc_info=True)
            
        # Run every 6 hours (21600 seconds)
        await asyncio.sleep(21600)

if __name__ == "__main__":
    # Setup manual execution logger
    setup_logging()
    asyncio.run(process_payouts_backlog())
