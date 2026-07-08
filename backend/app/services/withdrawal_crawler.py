import asyncio
import httpx
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.transaction import Transaction
from app.models.user import User
from app.crud import user as user_crud
from app.services.telegram_bot import TelegramService

logger = logging.getLogger(__name__)

async def start_withdrawal_crawler():
    """
    Background loop that polls TonAPI for pending withdrawals,
    verifying if they succeeded or failed on-chain, and executing refunds.
    """
    settings = get_settings()
    # Wait for startup sequences to settle
    await asyncio.sleep(25)
    logger.info("Background withdrawal crawler started.")
    
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
        
    while True:
        try:
            async with AsyncSessionLocal() as db:
                # Find all pending withdrawals with a real on-chain transaction reference hash
                result = await db.execute(
                    select(Transaction).where(
                        Transaction.type == "withdrawal",
                        Transaction.status == "pending"
                    )
                )
                pending_txs = result.scalars().all()
            
            for tx in pending_txs:
                ref = tx.reference_id or ""
                # Skip simulated or invalid references
                if len(ref) < 60 or ref.startswith("mock_") or ref.startswith("addr_"):
                    continue
                    
                # Check transaction age. If older than 15 mins (900s), mark as failed and refund.
                # Note: Transaction.created_at is stored in UTC without timezone.
                now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
                age_seconds = (now_naive - tx.created_at).total_seconds()
                
                logger.info(f"Checking pending withdrawal Transaction #{tx.id} for user {tx.user_id} (hash={ref}, age={age_seconds:.0f}s)...")
                
                url = f"https://tonapi.io/v2/events/{ref}"
                event_data = None
                
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        res = await client.get(url, headers=headers)
                        if res.status_code == 200:
                            event_data = res.json()
                        elif res.status_code == 404:
                            # Try to resolve message hash to a transaction if not found directly
                            msg_url = f"https://tonapi.io/v2/blockchain/messages/{ref}/transaction"
                            msg_res = await client.get(msg_url, headers=headers)
                            if msg_res.status_code == 200:
                                tx_data = msg_res.json()
                                resolved_tx_hash = tx_data.get("hash")
                                if resolved_tx_hash:
                                    event_url = f"https://tonapi.io/v2/events/{resolved_tx_hash}"
                                    event_res = await client.get(event_url, headers=headers)
                                    if event_res.status_code == 200:
                                        event_data = event_res.json()
                except Exception as api_err:
                    logger.warning(f"Error calling TonAPI for pending withdrawal #{tx.id}: {api_err}")
                    continue
                
                if event_data:
                    in_progress = event_data.get("in_progress", False)
                    if in_progress:
                        logger.info(f"Withdrawal transaction #{tx.id} is still in_progress on-chain. Skipping.")
                        continue
                        
                    actions = event_data.get("actions", [])
                    has_actions = len(actions) > 0
                    
                    # Check if any action has status != 'ok' (i.e. failed)
                    failed_action = None
                    for action in actions:
                        if action.get("status") != "ok":
                            failed_action = action
                            break
                            
                    if failed_action:
                        # Transaction failed! Process refund
                        logger.warning(f"Withdrawal transaction #{tx.id} FAILED on-chain in action: {failed_action}")
                        await process_withdrawal_failure(tx.id, "On-chain action execution failed")
                    elif has_actions:
                        # Transaction succeeded! Mark as completed
                        logger.info(f"Withdrawal transaction #{tx.id} successfully completed on-chain.")
                        await process_withdrawal_success(tx.id)
                    else:
                        # No actions found, but event is not in_progress. Check if it's failed/empty
                        logger.warning(f"Withdrawal transaction #{tx.id} has no actions on-chain but not in-progress.")
                        if age_seconds > 900:
                            await process_withdrawal_failure(tx.id, "No on-chain actions executed within timeout")
                else:
                    # Transaction not found on-chain
                    if age_seconds > 900:
                        logger.warning(f"Pending withdrawal transaction #{tx.id} not found on-chain after 15 minutes. Marking as failed.")
                        await process_withdrawal_failure(tx.id, "On-chain transaction not found (expired/dropped)")
                        
        except Exception as loop_err:
            logger.error(f"Error in background withdrawal crawler loop: {loop_err}", exc_info=True)
            
        # Poll every 60 seconds
        await asyncio.sleep(60)

async def process_withdrawal_success(tx_id: int):
    """Marks a pending withdrawal transaction as completed and notifies the user."""
    async with AsyncSessionLocal() as db:
        tx_result = await db.execute(
            select(Transaction).where(Transaction.id == tx_id).with_for_update()
        )
        tx = tx_result.scalars().first()
        if not tx or tx.status != "pending":
            return
            
        tx.status = "completed"
        db.add(tx)
        
        user_result = await db.execute(
            select(User).where(User.telegram_id == tx.user_id)
        )
        user = user_result.scalars().first()
        await db.commit()
        
    if user:
        try:
            # Send Telegram Bot notification for successful withdrawal completion
            amount_cents = abs(tx.amount)
            net_amount_cents = amount_cents - tx.fee
            dest_display = f"{tx.reference_id[:6]}...{tx.reference_id[-4:]}" if tx.reference_id and len(tx.reference_id) > 10 else "Wallet"
            link_display = f"<a href=\"https://tonviewer.com/transaction/{tx.reference_id}\">View Transaction 🔗</a>"
            
            notification_text = (
                f"<b>✅ Withdrawal Completed!</b>\n\n"
                f"• <b>Requested Amount:</b> ${amount_cents / 100:.2f} USDT\n"
                f"• <b>Withdrawal Fee:</b> -${tx.fee / 100:.2f} USDT\n"
                f"• <b>Sent to Wallet:</b> ${net_amount_cents / 100:.2f} USDT\n"
                f"• <b>Destination Wallet:</b> {link_display}\n"
                f"• <b>Status:</b> Completed Successfully 🟢\n\n"
                f"<i>Your funds have been transferred successfully on-chain! Platform Balance: {user.balance / 100:.2f} USDT.</i>"
            )
            await TelegramService.send_notification(user.telegram_id, notification_text)
        except Exception as e:
            logger.error(f"Failed to send successful withdrawal notification for tx #{tx_id}: {e}")

async def process_withdrawal_failure(tx_id: int, reason: str):
    """Refunds the user balance and marks the transaction as failed."""
    async with AsyncSessionLocal() as db:
        tx_result = await db.execute(
            select(Transaction).where(Transaction.id == tx_id).with_for_update()
        )
        tx = tx_result.scalars().first()
        if not tx or tx.status != "pending":
            return
            
        # Refund amount back to user's platform balance (abs(tx.amount) represents the original requested amount)
        refund_amount = abs(tx.amount)
        logger.info(f"Refunding {refund_amount} cents to user {tx.user_id} due to failed withdrawal #{tx_id} ({reason}).")
        
        # Credit balance atomically and mark transaction as failed
        await user_crud.atomic_credit(db, tx.user_id, refund_amount, commit=False)
        tx.status = "failed"
        db.add(tx)
        await db.commit()
        
        # Fetch updated user for display balance
        user_result = await db.execute(
            select(User).where(User.telegram_id == tx.user_id)
        )
        user = user_result.scalars().first()
        
        if user:
            # Send Telegram Bot notification for failed withdrawal
            try:
                notification_text = (
                    f"<b>❌ Withdrawal Failed & Refunded</b>\n\n"
                    f"Your on-chain withdrawal of <b>${refund_amount / 100:.2f} USDT</b> has failed (Reason: {reason}).\n\n"
                    f"• <b>Refunded Amount:</b> +${refund_amount / 100:.2f} USDT\n"
                    f"• <b>Platform Balance:</b> {user.balance / 100:.2f} USDT\n\n"
                    f"<i>Please verify your destination address or contact support if the issue persists.</i>"
                )
                await TelegramService.send_notification(user.telegram_id, notification_text)
            except Exception as e:
                logger.error(f"Failed to send failed withdrawal notification for tx #{tx_id}: {e}")
