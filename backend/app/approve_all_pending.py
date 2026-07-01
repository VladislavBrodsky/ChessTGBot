import asyncio
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.core.config import get_settings
from sqlalchemy import select
from telegram import Bot

async def approve_all_pending():
    settings = get_settings()
    print("Starting manual approval of legacy pending withdrawals...")
    
    bot = None
    if settings.TELEGRAM_BOT_TOKEN:
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    else:
        print("Warning: TELEGRAM_BOT_TOKEN not configured. Users will not be notified via Telegram.")

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Transaction).where(Transaction.status == "pending_review")
        )
        txs = result.scalars().all()
        
        if not txs:
            print("No pending withdrawals found in database.")
            return
            
        for tx in txs:
            tx.status = "completed"
            db.add(tx)
            print(f"Marked Transaction #{tx.id} for User {tx.user_id} (${abs(tx.amount)/100:.2f} USDT) as completed.")
            
            # Send Telegram Bot notification if bot is configured
            if bot:
                try:
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
                    print(f"Notification sent successfully to User {tx.user_id}.")
                except Exception as e:
                    print(f"Failed to send Telegram notification to User {tx.user_id}: {e}")
            
        await db.commit()
        print(f"Successfully approved and completed {len(txs)} legacy withdrawals.")

if __name__ == "__main__":
    asyncio.run(approve_all_pending())
