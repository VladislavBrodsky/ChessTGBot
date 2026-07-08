import asyncio
import sys
import os
import httpx
from sqlalchemy import select

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.core.config import get_settings

async def check_withdrawals():
    settings = get_settings()
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    async with AsyncSessionLocal() as db:
        # Find all completed withdrawals that look like real tx hashes
        result = await db.execute(
            select(Transaction).where(
                Transaction.type == "withdrawal",
                Transaction.status == "completed"
            )
        )
        txs = result.scalars().all()
        
        real_txs = []
        for tx in txs:
            ref = tx.reference_id or ""
            if len(ref) >= 60 and not ref.startswith("mock_") and not ref.startswith("addr_"):
                real_txs.append(tx)
                
        print(f"Found {len(real_txs)} real completed withdrawal transactions in DB.")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for tx in real_txs:
                print(f"\nChecking DB Transaction #{tx.id} | User {tx.user_id} | Hash {tx.reference_id} | Amount ${abs(tx.amount)/100:.2f}...")
                
                # Check message or transaction via TonAPI
                url = f"https://tonapi.io/v2/blockchain/transactions/{tx.reference_id}"
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    print(f"  TonAPI error for tx hash {tx.reference_id}: status={res.status_code}")
                    # Try by message
                    msg_url = f"https://tonapi.io/v2/blockchain/messages/{tx.reference_id}/transaction"
                    msg_res = await client.get(msg_url, headers=headers)
                    if msg_res.status_code == 200:
                        tx_data = msg_res.json()
                        tx_hash = tx_data.get("hash")
                        if tx_hash:
                            url = f"https://tonapi.io/v2/blockchain/transactions/{tx_hash}"
                            res = await client.get(url, headers=headers)
                            
                if res.status_code == 200:
                    tx_data = res.json()
                    success = tx_data.get("success", False)
                    compute_phase = tx_data.get("compute_phase", {})
                    exit_code = compute_phase.get("exit_code")
                    
                    # We also want to check the out_msgs/actions because standard wallet v4 send could succeed
                    # but the sub-transaction on the Jetton Wallet might fail!
                    # Let's inspect out_msgs
                    out_msgs = tx_data.get("out_msgs", [])
                    out_msg_failed = False
                    for out_msg in out_msgs:
                        out_msg_hash = out_msg.get("hash")
                        if out_msg_hash:
                            out_url = f"https://tonapi.io/v2/blockchain/transactions/{out_msg_hash}"
                            out_res = await client.get(out_url, headers=headers)
                            if out_res.status_code == 200:
                                out_data = out_res.json()
                                if not out_data.get("success", False):
                                    out_msg_failed = True
                                    print(f"  Found failed out_msg {out_msg_hash}: exit_code={out_data.get('compute_phase', {}).get('exit_code')}")
                    
                    if not success or out_msg_failed:
                        print(f"  ❌ Transaction FAILED on-chain! success={success}, out_msg_failed={out_msg_failed}, exit_code={exit_code}")
                    else:
                        print(f"  ✅ Transaction succeeded on-chain!")
                else:
                    print(f"  ⚠️ Could not fetch transaction details from TonAPI: {res.status_code}")

if __name__ == "__main__":
    asyncio.run(check_withdrawals())
