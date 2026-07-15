import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.future import select


from app.core.database import AsyncSessionLocal
from app.core.config import get_settings
from app.models.transaction import Transaction

from app.api.v1.endpoints.wallet import _credit_stripe_deposit
from app.core.alerts import send_admin_alert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_sweeper():
    import stripe
    settings = get_settings()
    
    if not settings.STRIPE_SECRET_KEY:
        logger.warning("Stripe secret key not configured, skipping sweeper.")
        return
        
    stripe.api_key = settings.STRIPE_SECRET_KEY
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # 15 minutes old to ensure we don't interfere with active checkout sessions
    fifteen_mins_ago = now - timedelta(minutes=15)
    
    # 30 minutes old for TREASURY alert
    thirty_mins_ago = now - timedelta(minutes=30)
    
    async with AsyncSessionLocal() as db:
        # Find all pending Stripe deposit transactions
        # Note: reference_id for pending stripe deposits usually holds the checkout session ID.
        result = await db.execute(
            select(Transaction)
            .filter(
                Transaction.type == "deposit",
                Transaction.status == "pending",
                Transaction.created_at <= fifteen_mins_ago,
                Transaction.reference_id.isnot(None),
                Transaction.reference_id.like("cs_%")  # Stripe checkout session IDs start with cs_
            )
        )
        
        pending_txs = result.scalars().all()
        
        if not pending_txs:
            logger.info("No pending Stripe deposits found to sweep.")
            return
            
        for tx in pending_txs:
            session_id = tx.reference_id
            logger.info(f"Checking stuck Stripe Session: {session_id} (TX: {tx.id})")
            try:
                session = stripe.checkout.Session.retrieve(session_id)
                status = session.get("status")
                payment_status = session.get("payment_status")
                
                if status == "complete" and payment_status == "paid":
                    logger.info(f"Session {session_id} is paid! Crediting user {tx.user_id}...")
                    credited = await _credit_stripe_deposit(db, tx.id, tx.user_id, session_id)
                    if credited:
                        logger.info(f"Successfully swept and credited TX {tx.id}.")
                    else:
                        logger.info(f"Failed to credit TX {tx.id} (perhaps already credited concurrently).")
                
                elif status == "expired":
                    logger.info(f"Session {session_id} is expired. Marking TX {tx.id} as failed.")
                    # Mark as failed
                    tx_lock_res = await db.execute(
                        select(Transaction).filter(Transaction.id == tx.id).with_for_update()
                    )
                    tx_lock = tx_lock_res.scalars().first()
                    if tx_lock and tx_lock.status == "pending":
                        tx_lock.status = "failed"
                        db.add(tx_lock)
                        await db.commit()
                
                elif status == "open" and tx.created_at <= thirty_mins_ago:
                    logger.info(f"Session {session_id} is stuck OPEN for > 30 minutes! Alerting TREASURY.")
                    try:
                        await send_admin_alert(
                            "⚠️ <b>Stuck Stripe Deposit Alert</b>\n\n"
                            f"• <b>Transaction ID:</b> #{tx.id}\n"
                            f"• <b>User ID:</b> <code>{tx.user_id}</code>\n"
                            f"• <b>Stripe Session:</b> <code>{session_id}</code>\n"
                            f"• <b>Status:</b> Pending for over 30 minutes\n\n"
                            "<i>Please check the Stripe Dashboard to see why this checkout is not expiring or completing.</i>",
                            system="treasury"
                        )
                    except Exception as e:
                        logger.error(f"Failed to send admin alert: {e}")
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe API error checking session {session_id}: {e}")
            except Exception as e:
                logger.error(f"Error checking pending deposit {tx.id}: {e}")

if __name__ == "__main__":
    asyncio.run(run_sweeper())
