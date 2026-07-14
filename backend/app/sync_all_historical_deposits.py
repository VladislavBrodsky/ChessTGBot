import asyncio
import httpx
import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.api.v1.endpoints.wallet import fetch_all_prices, convert_ton_address_to_hex
from sqlalchemy import select

async def run_historical_sync():
    print("Starting Historical Deposit Sync Utility...")
    settings = get_settings()
    master_wallet = settings.MASTER_WALLET_ADDRESS
    print(f"Master Wallet Address: {master_wallet}")
    
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
    prices = await fetch_all_prices()
    print(f"Current Rates: TON=${prices.get('TON')} USDT=${prices.get('USDT')} USDC=${prices.get('USDC')}")
    
    decimals_map = {
        "TON": 9,
        "USDT": 6,
        "USDC": 6,
        "BTC": 8,
        "ETH": 9
    }
    
    events_processed = 0
    deposits_synced = 0
    total_cents_synced = 0
    
    before_lt = None
    has_more = True
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        while has_more:
            url = f"https://tonapi.io/v2/accounts/{master_wallet}/events?limit=50"
            if before_lt:
                url += f"&before_lt={before_lt}"
                
            print(f"Fetching events before LT: {before_lt or 'Latest'}...")
            try:
                res = await client.get(url, headers=headers)
                if res.status_code != 200:
                    print(f"TonAPI error {res.status_code}: {res.text}")
                    break
                    
                data = res.json()
                events = data.get("events", [])
                
                if not events:
                    print("No more events found.")
                    break
                    
                # Track before_lt for next page (it is the lt of the last event)
                before_lt = events[-1].get("lt")
                
                for event in events:
                    events_processed += 1
                    event_id = event.get("event_id")
                    if not event_id:
                        continue
                        
                    # Check if already in DB
                    async with AsyncSessionLocal() as db:
                        existing_tx = await db.execute(
                            select(Transaction).filter(Transaction.reference_id == event_id)
                        )
                        if existing_tx.scalars().first():
                            continue
                            
                    actions = event.get("actions", [])
                    verified_tx = False
                    amount_cents = 0
                    sender_addr = "unknown"
                    currency_symbol = "USDT"
                    telegram_id = None
                    
                    for action in actions:
                        if action.get("status") != "ok":
                            continue
                            
                        action_type = action.get("type")
                        
                        if action_type == "TonTransfer":
                            ton_transfer = action.get("TonTransfer", {})
                            recipient = ton_transfer.get("recipient", {}).get("address", "")
                            sender = ton_transfer.get("sender", {}).get("address", "")
                            amount_nano = int(ton_transfer.get("amount", 0))
                            comment = ton_transfer.get("comment", "").strip()
                            
                            try:
                                recipient_raw = convert_ton_address_to_hex(recipient)
                                master_raw = convert_ton_address_to_hex(master_wallet)
                            except Exception:
                                continue
                                
                            if recipient_raw == master_raw and comment.startswith("ref_"):
                                try:
                                    telegram_id = int(comment[4:])
                                    ton_amount = amount_nano / 1_000_000_000.0
                                    ton_price = prices.get("TON", 5.40)
                                    amount_cents = int(round(ton_amount * ton_price * 100))
                                    sender_addr = sender
                                    currency_symbol = "TON"
                                    verified_tx = True
                                    break
                                except Exception:
                                    continue
                                    
                        elif action_type == "JettonTransfer":
                            jetton_transfer = action.get("JettonTransfer", {})
                            recipient = jetton_transfer.get("recipient", {}).get("address", "")
                            sender = jetton_transfer.get("sender", {}).get("address", "")
                            amount_raw = int(jetton_transfer.get("amount", 0))
                            comment = jetton_transfer.get("comment", "").strip()
                            jetton_master = jetton_transfer.get("jetton", {}).get("address", "")
                            
                            try:
                                recipient_raw = convert_ton_address_to_hex(recipient)
                                master_raw = convert_ton_address_to_hex(master_wallet)
                                jetton_master_raw = convert_ton_address_to_hex(jetton_master)
                            except Exception:
                                continue
                                
                            if recipient_raw == master_raw and comment.startswith("ref_"):
                                try:
                                    telegram_id = int(comment[4:])
                                    matched_symbol = None
                                    masters = {
                                        "USDT": settings.USDT_MASTER,
                                        "USDC": settings.USDC_MASTER,
                                        "BTC": settings.BTC_MASTER,
                                        "ETH": settings.ETH_MASTER
                                    }
                                    for sym, addr in masters.items():
                                        if convert_ton_address_to_hex(addr) == jetton_master_raw:
                                            matched_symbol = sym
                                            break
                                            
                                    if matched_symbol:
                                        decimals = decimals_map.get(matched_symbol, 6)
                                        token_amount = amount_raw / (10 ** decimals)
                                        token_price = prices.get(matched_symbol, 1.00)
                                        amount_cents = int(round(token_amount * token_price * 100))
                                        sender_addr = sender
                                        currency_symbol = matched_symbol
                                        verified_tx = True
                                        break
                                except Exception:
                                    continue
                                    
                    if verified_tx and telegram_id and amount_cents > 0:
                        async with AsyncSessionLocal() as db:
                            user_result = await db.execute(
                                select(User).filter(User.telegram_id == telegram_id).with_for_update()
                            )
                            user = user_result.scalars().first()
                            
                            if user:
                                # Double check replay protection inside lock
                                existing_tx_result = await db.execute(
                                    select(Transaction).filter(Transaction.reference_id == event_id)
                                )
                                if existing_tx_result.scalars().first():
                                    continue
                                    
                                from app.api.v1.endpoints.wallet import _split_web3_top_up
                                credited_amount, fee = _split_web3_top_up(amount_cents)
                                
                                user.balance += credited_amount
                                db.add(user)
                                
                                # Log transactions
                                tx_deposit = Transaction(
                                    user_id=telegram_id,
                                    type="deposit",
                                    amount=credited_amount,
                                    fee=fee,
                                    status="completed",
                                    reference_id=event_id
                                )
                                db.add(tx_deposit)
                                
                                tx_fee = Transaction(
                                    user_id=telegram_id,
                                    type="deposit_fee",
                                    amount=-fee,
                                    fee=0,
                                    status="completed",
                                    reference_id=f"fee_{event_id[:16]}"
                                )
                                db.add(tx_fee)
                                
                                await db.commit()
                                print(f"Synced deposit of ${credited_amount/100:.2f} USDT for User {telegram_id} (Name: {user.first_name}) [TX: {event_id[:10]}...]")
                                
                                deposits_synced += 1
                                total_cents_synced += credited_amount
                                
                                # Try sending bot notification
                                try:
                                    from app.services.telegram_bot import TelegramService
                                    sender_display = f"{sender_addr[:6]}...{sender_addr[-4:]}" if len(sender_addr) > 10 else sender_addr
                                    notification_text = (
                                        f"<b>⚡️ Cyber Web3 Top-Up Recovery Confirmed!</b>\n\n"
                                        f"• <b>Sender Address:</b> <a href=\"https://tonviewer.com/{sender_addr}\">{sender_display}</a> 🔗\n"
                                        f"• <b>Currency:</b> {currency_symbol}\n"
                                        f"• <b>Credited Amount:</b> +${credited_amount / 100:.2f} USDT\n"
                                        f"• <b>Platform Top-Up Fee (5%):</b> -${fee / 100:.2f} USDT\n"
                                        f"• <b>Transaction ID:</b> <a href=\"https://tonviewer.com/transaction/{event_id}\">{event_id[:10]}...{event_id[-8:] if len(event_id) > 8 else ''}</a> 🔗\n\n"
                                        f"<i>Your missing deposit has been automatically recovered. Platform Balance: {user.balance / 100:.2f} USDT. Let's play! ♟️🎮</i>"
                                    )
                                    await TelegramService.send_notification(telegram_id, notification_text)
                                except Exception:
                                    pass
                            else:
                                print(f"Found deposit for Telegram ID {telegram_id} but user not registered in DB.")
                                
                if len(events) < 50:
                    has_more = False
                    
            except Exception as e:
                print(f"Error during page sync: {e}")
                break
                
    print(f"\nSync completed! Checked {events_processed} events.")
    print(f"Total deposits recovered: {deposits_synced}")
    print(f"Total funds credited: ${total_cents_synced/100:.2f} USDT")

if __name__ == "__main__":
    asyncio.run(run_historical_sync())
