import asyncio
import sys
import os
import httpx
from sqlalchemy import select, func

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.core.config import get_settings
from app.api.v1.endpoints.wallet import fetch_all_prices

async def calculate_reserves():
    settings = get_settings()
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"

    master_wallet = settings.MASTER_WALLET_ADDRESS
    print(f"Master Wallet Address: {master_wallet}")

    # 1. Fetch current platform liabilities (sum of all user balances)
    async with AsyncSessionLocal() as db:
        liab_res = await db.execute(select(func.sum(User.balance)))
        total_liabilities_cents = liab_res.scalar() or 0
        
        pending_withdrawals_res = await db.execute(
            select(func.sum(Transaction.amount)).where(
                Transaction.type == "withdrawal",
                Transaction.status == "pending"
            )
        )
        total_pending_withdrawals_cents = abs(pending_withdrawals_res.scalar() or 0)

    print(f"Total Platform Liabilities (All User Balances): ${total_liabilities_cents / 100:.2f} USDT")
    print(f"Total Pending Withdrawals: ${total_pending_withdrawals_cents / 100:.2f} USDT")

    # 2. Fetch fresh token prices
    prices = await fetch_all_prices()
    print("\nToken Prices (USD):")
    for sym, val in prices.items():
        print(f"  {sym}: ${val:.2f}")

    # 3. Query on-chain balances of all supported assets
    # TON Balance
    ton_balance = 0.0
    try:
        url_acc = f"https://tonapi.io/v2/accounts/{master_wallet}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(url_acc, headers=headers)
            if res.status_code == 200:
                data = res.json()
                # balance is in nanoTON
                ton_balance = int(data.get("balance", 0)) / 1_000_000_000.0
    except Exception as e:
        print(f"Failed to fetch TON balance: {e}")

    # Jettons Balances
    jettons = {
        "USDT": (settings.USDT_MASTER, 6),
        "USDC": (settings.USDC_MASTER, 6),
        "BTC": (settings.BTC_MASTER, 8),
        "ETH": (settings.ETH_MASTER, 9)
    }

    balances = {"TON": ton_balance}
    for sym, (master_addr, decimals) in jettons.items():
        balances[sym] = 0.0
        try:
            url_jw = f"https://tonapi.io/v2/accounts/{master_wallet}/jettons/{master_addr}"
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url_jw, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    balances[sym] = int(data.get("balance", 0)) / (10 ** decimals)
        except Exception as e:
            # Fallback or skip if not found
            pass

    print("\nOn-chain Wallet Balances:")
    total_reserves_usd = 0.0
    for sym, bal in balances.items():
        price = prices.get(sym, 1.0)
        value_usd = bal * price
        total_reserves_usd += value_usd
        print(f"  {sym}: {bal:.6f} (Value: ${value_usd:.2f} USD)")

    print(f"\nTotal USD Value of On-chain Assets: ${total_reserves_usd:.2f} USD")
    
    diff = total_reserves_usd - (total_liabilities_cents / 100.0)
    print(f"Net Coverage (Reserves - Liabilities): ${diff:.2f} USD")
    if diff >= 0:
        print("✅ The platform holds enough total on-chain assets to cover user balances!")
    else:
        print("❌ The platform has a reserve deficit! Total assets do not cover user balances.")

if __name__ == "__main__":
    asyncio.run(calculate_reserves())
