import asyncio
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.core.config import get_settings
from app.services.payout_service import execute_usdt_payout
from app.services.telegram_bot import TelegramService
from sqlalchemy import select

async def process_payouts_backlog():
    settings = get_settings()
    if not settings.PAYOUT_MNEMONIC:
        print("Error: PAYOUT_MNEMONIC is not configured in environment variables.")
        return

    print("Fetching backlog of completed simulated/mock withdrawals...")
    async with AsyncSessionLocal() as db:
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
            print("No simulated/mock withdrawal backlog found. All payouts are up to date!")
            return
            
        print(f"Found {len(backlog_txs)} backlog transactions to process on-chain.")
        
        processed_count = 0
        for tx in backlog_txs:
            print(f"\nProcessing Transaction #{tx.id} for User {tx.user_id} (${abs(tx.amount)/100:.2f} USDT)...")
            
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
                print(f"❌ Error: Could not resolve destination address for Transaction #{tx.id}. Skipping.")
                continue
                
            print(f"Destination Wallet: {address}")
            
            # 2. Execute on-chain payout
            try:
                # Deduct fee? No, legacy users already paid or expect full amount.
                # Send the exact absolute value of the transaction amount
                payout_amount_cents = abs(tx.amount)
                
                print(f"Sending ${payout_amount_cents/100:.2f} USDT on-chain...")
                tx_hash = await execute_usdt_payout(address, payout_amount_cents)
                
                # 3. Update transaction reference_id to the real transaction hash
                tx.reference_id = tx_hash
                db.add(tx)
                await db.commit()
                print(f"✅ Success! Transaction #{tx.id} updated with Tx Hash: {tx_hash}")
                
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
                print(f"❌ Failed to process Transaction #{tx.id} on-chain: {e}")
                
        print(f"\nBacklog processing complete. Successfully sent {processed_count} of {len(backlog_txs)} transactions on-chain.")

if __name__ == "__main__":
    asyncio.run(process_payouts_backlog())
