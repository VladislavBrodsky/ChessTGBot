import asyncio
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from sqlalchemy import select

async def approve_all_pending():
    print("Starting manual approval of legacy pending withdrawals...")
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
            
        await db.commit()
        print(f"Successfully approved and completed {len(txs)} legacy withdrawals.")

if __name__ == "__main__":
    asyncio.run(approve_all_pending())
