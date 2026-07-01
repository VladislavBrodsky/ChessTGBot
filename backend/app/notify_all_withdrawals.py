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

async def notify_all_completed_withdrawals():
    settings = get_settings()
    if not settings.TELEGRAM_BOT_TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not configured.")
        return

    bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)
    
    print("Fetching all completed withdrawal transactions from database...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Transaction).where(
                Transaction.type == "withdrawal",
                Transaction.status == "completed"
            )
        )
        txs = result.scalars().all()
        
        if not txs:
            print("No completed withdrawals found in database.")
            return
            
        print(f"Found {len(txs)} completed withdrawals. Sending notifications...")
        
        notified_count = 0
        for tx in txs:
            try:
                # Extract address from reference_id
                address = tx.reference_id[5:] if tx.reference_id and tx.reference_id.startswith("addr_") else None
                if not address:
                    print(f"Skipping TX #{tx.id}: reference_id is not formatted as addr_... ({tx.reference_id})")
                    continue
                    
                dest_display = f"{address[:6]}...{address[-4:]}" if len(address) > 10 else address
                
                notification_text = (
                    f"<b>✅ Withdrawal Confirmed!</b>\n\n"
                    f"• <b>Amount:</b> -${abs(tx.amount) / 100:.2f} USDT\n"
                    f"• <b>Destination TON Wallet:</b> <a href=\"https://tonviewer.com/{address}\">{dest_display}</a> 🔗\n\n"
                    f"<i>You can trace this withdrawal on the blockchain explorer using the link above! Thank you for playing. ♟️🎮</i>"
                )
                
                await bot.send_message(
                    chat_id=tx.user_id,
                    text=notification_text,
                    parse_mode="HTML"
                )
                print(f"Successfully notified User {tx.user_id} of completed TX #{tx.id} (${abs(tx.amount)/100:.2f} USDT).")
                notified_count += 1
                await asyncio.sleep(0.1)  # brief throttle
            except Exception as e:
                print(f"Failed to notify User {tx.user_id} for TX #{tx.id}: {e}")
                
        print(f"Finished sending notifications. Sent {notified_count} of {len(txs)} successfully.")

if __name__ == "__main__":
    asyncio.run(notify_all_completed_withdrawals())
