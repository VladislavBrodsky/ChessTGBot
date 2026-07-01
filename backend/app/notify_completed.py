import asyncio
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.core.config import get_settings
from telegram import Bot

async def notify_users():
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not configured.")
        return

    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    tx_ids = [69, 121, 122]
    
    print(f"Sending completion notifications for transactions: {tx_ids}...")
    
    async with AsyncSessionLocal() as db:
        for tx_id in tx_ids:
            try:
                # Query transaction
                from sqlalchemy import select
                result = await db.execute(
                    select(Transaction).where(Transaction.id == tx_id)
                )
                tx = result.scalars().first()
                if not tx:
                    print(f"Transaction #{tx_id} not found in database.")
                    continue
                
                address = tx.reference_id[5:] if tx.reference_id and tx.reference_id.startswith("addr_") else "linked wallet"
                dest_display = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address
                
                notification_text = (
                    f"<b>✅ Withdrawal Approved!</b>\n\n"
                    f"• <b>Amount:</b> +${abs(tx.amount) / 100:.2f} USDT\n"
                    f"• <b>Sent to:</b> <code>{dest_display}</code>\n\n"
                    f"<i>Your funds have been transferred successfully on-chain!</i>"
                )
                
                await bot.send_message(
                    chat_id=tx.user_id,
                    text=notification_text,
                    parse_mode="HTML"
                )
                print(f"Notification sent successfully to User {tx.user_id} for TX #{tx_id}.")
            except Exception as e:
                print(f"Failed to send notification for TX #{tx_id}: {e}")

if __name__ == "__main__":
    asyncio.run(notify_users())
