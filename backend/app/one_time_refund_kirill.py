import asyncio
import sys
import os
import logging
from sqlalchemy import select

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.crud import user as user_crud
from app.services.telegram_bot import TelegramService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("refund_script")

async def run_refund():
    telegram_id = 5441222812 # Kirill R
    target_tx_hash = "b5c23277c9013aeca683f50f921697343ad58e6fe8356b5c8bbfe38d5bb28a38"
    refund_amount_cents = 1000 # $10.00 USDT original requested amount debited

    print(f"Starting one-time refund process for user {telegram_id} and transaction {target_tx_hash}...")
    
    async with AsyncSessionLocal() as db:
        # Check user exists
        user_res = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = user_res.scalars().first()
        if not user:
            print(f"❌ User with ID {telegram_id} not found in database. Skipping.")
            return

        # Find transaction
        tx_res = await db.execute(
            select(Transaction).where(
                Transaction.user_id == telegram_id,
                Transaction.reference_id == target_tx_hash
            )
        )
        tx = tx_res.scalars().first()
        if not tx:
            print(f"❌ Transaction with hash {target_tx_hash} not found in database for user {telegram_id}. Skipping.")
            return

        if tx.status == "failed":
            print(f"⚠️ Transaction {target_tx_hash} is already marked as 'failed' in DB. No refund needed.")
            return

        print(f"Found completed transaction #{tx.id} for amount {tx.amount} cents.")
        
        # Execute refund atomically
        print(f"Crediting user balance by {refund_amount_cents} cents and marking transaction as failed...")
        # Re-query user with write lock
        await db.execute(select(User).where(User.telegram_id == telegram_id).with_for_update())
        
        # Re-query tx with write lock
        tx_lock_res = await db.execute(select(Transaction).where(Transaction.id == tx.id).with_for_update())
        tx_lock = tx_lock_res.scalars().first()

        await user_crud.atomic_credit(db, telegram_id, refund_amount_cents, commit=False)
        tx_lock.status = "failed"
        db.add(tx_lock)
        
        await db.commit()
        
        # Fetch updated balance
        user_updated_res = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user_updated = user_updated_res.scalars().first()
        print(f"✅ Success! Refunded {refund_amount_cents} cents. New balance: {user_updated.balance} cents.")

    # Send telegram notification
    try:
        # Start bot client temporarily if needed (or assume it's running when this script is run)
        # Note: If run standalone, TelegramService needs to start the client
        await TelegramService.start_bot()
        
        notification_text = (
            f"<b>❌ Payout Failure Refund</b>\n\n"
            f"We detected that your withdrawal of <b>$10.00 USDT</b> failed on-chain on July 7 due to a network contract exception.\n\n"
            f"• <b>Refunded to Balance:</b> +$10.00 USDT\n"
            f"• <b>Status:</b> Fully Refunded 🟢\n\n"
            f"<i>Your updated platform balance is {user_updated.balance / 100:.2f} USDT. We apologize for the inconvenience!</i>"
        )
        await TelegramService.send_notification(telegram_id, notification_text)
        print("✅ Telegram notification successfully sent to user.")
    except Exception as telegram_err:
        print(f"⚠️ Could not send Telegram notification (bot client might not be initialized): {telegram_err}")
    finally:
        await TelegramService.stop_bot()

if __name__ == "__main__":
    asyncio.run(run_refund())
