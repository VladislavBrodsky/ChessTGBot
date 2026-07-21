"""
Per-withdrawal owner confirmation (second factor for payouts).

Withdrawals below the admin-review threshold used to auto-pay the moment the
API call landed, so a stolen/replayed initData session could drain a balance
up to the daily cap with no further checks. Now the funds are debited and
HELD as status="pending_confirmation" while the bot DMs the owner an inline
Confirm / Cancel keyboard. Only a callback tap from the owner's own Telegram
account releases the on-chain payout; Cancel — or the TTL expiring — refunds
the held amount.

Security model:
- The webhook endpoint that receives callbacks is unauthenticated, and
  transaction ids are sequential, so callback_data carries an HMAC nonce
  derived from SECRET_KEY + tx id + owner id. A forged update POSTed to the
  webhook cannot produce a valid nonce; reading it requires access to the
  victim's private bot chat (i.e. their Telegram account).
- The handler additionally requires callback.from_user.id == tx.user_id.
- Status transitions are claimed with a conditional UPDATE so double taps,
  webhook retries, or a tap racing the expiry sweeper can never pay or
  refund twice.
"""
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update

from app.core.config import get_settings
from app.models.transaction import Transaction

logger = logging.getLogger(__name__)

PENDING_STATUS = "pending_confirmation"
REF_PREFIX = "pending_confirmation:"
REVIEW_REF_PREFIX = "pending_review:"

# callback_data prefixes (Telegram caps callback_data at 64 bytes)
CONFIRM_ACTION = "wdc"
CANCEL_ACTION = "wdx"


def _now_naive_utc() -> datetime:
    # Matches the naive-UTC convention used by Transaction.created_at.
    return datetime.now(timezone.utc).replace(tzinfo=None)


def confirmation_nonce(tx_id: int, user_id: int) -> str:
    settings = get_settings()
    secret = (settings.SECRET_KEY or settings.TELEGRAM_BOT_TOKEN or "dev-secret").encode()
    digest = hmac.new(secret, f"wdconfirm:{tx_id}:{user_id}".encode(), hashlib.sha256)
    return digest.hexdigest()[:12]


def verify_confirmation_nonce(tx_id: int, user_id: int, nonce: str) -> bool:
    return hmac.compare_digest(confirmation_nonce(tx_id, user_id), nonce or "")


async def _claim(db, tx_id: int, new_status: str) -> bool:
    """Atomically transition a pending_confirmation withdrawal to new_status.
    False means another actor (double tap / expiry sweep) already claimed it.
    """
    res = await db.execute(
        update(Transaction)
        .where(Transaction.id == tx_id, Transaction.status == PENDING_STATUS)
        .values(status=new_status)
    )
    await db.commit()
    return res.rowcount == 1


async def _load(db, tx_id: int) -> Transaction | None:
    res = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    return res.scalars().first()


async def _refund(db, tx: Transaction, final_reference: str) -> None:
    """Credit the held amount back. Caller must have claimed the tx already."""
    from app.crud import user as user_crud
    await user_crud.atomic_credit(db, tx.user_id, -tx.amount, commit=False)
    tx.reference_id = final_reference
    db.add(tx)
    await db.commit()


def is_expired(tx: Transaction) -> bool:
    settings = get_settings()
    cutoff = _now_naive_utc() - timedelta(seconds=settings.WITHDRAWAL_CONFIRMATION_TTL_SECONDS)
    return bool(tx.created_at and tx.created_at < cutoff)


async def confirm_withdrawal(tx_id: int, from_user_id: int, nonce: str) -> tuple[str, bool]:
    """Executes a held withdrawal after the owner tapped Confirm.
    Returns (user-facing HTML message, done). done=False means the request is
    still confirmable (retryable payout failure) and the bot should keep the
    Confirm/Cancel keyboard on the message.
    """
    from app.core.database import AsyncSessionLocal
    settings = get_settings()

    async with AsyncSessionLocal() as db:
        tx = await _load(db, tx_id)
        if not tx or tx.type != "withdrawal":
            return "⚠️ This withdrawal request could not be found.", True
        if tx.user_id != from_user_id or not verify_confirmation_nonce(tx_id, tx.user_id, nonce):
            logger.warning(f"Rejected withdrawal confirmation for tx {tx_id}: identity/nonce mismatch (from={from_user_id})")
            return "⚠️ This confirmation is not valid for your account.", True
        if tx.status != PENDING_STATUS:
            return "ℹ️ This withdrawal was already processed (or expired and was refunded).", True

        amount = -tx.amount
        if is_expired(tx):
            if await _claim(db, tx_id, "failed"):
                await _refund(db, tx, "confirmation_expired")
                return (
                    "⌛ <b>Withdrawal Expired</b>\n\n"
                    f"This request was not confirmed in time, so ${amount / 100:.2f} USDT "
                    "has been returned to your balance. Please start a new withdrawal."
                ), True
            return "ℹ️ This withdrawal was already processed (or expired and was refunded).", True

        if not tx.reference_id or not tx.reference_id.startswith(REF_PREFIX):
            return "⚠️ This withdrawal is missing its destination address. Contact support.", True
        address = tx.reference_id.split(":", 1)[1]
        transfer_amount_cents = amount - (tx.fee or 0)

        # Claim before paying so a double tap / webhook retry can't pay twice.
        if not await _claim(db, tx_id, "processing_payout"):
            return "ℹ️ This withdrawal is already being processed.", True

        tx_hash = None
        is_real = False
        if settings.PAYOUT_MNEMONIC:
            try:
                from app.services.payout_service import execute_usdt_payout, BlockchainBroadcastError
                tx_hash = await execute_usdt_payout(address, transfer_amount_cents)
                is_real = True
            except BlockchainBroadcastError as broadcast_err:
                # Broadcast may have gone through — UNSAFE to refund. Track as
                # pending; the withdrawal crawler verifies it on-chain.
                tx_hash = broadcast_err.msg_hash
                is_real = True
                logger.warning(f"Confirmed withdrawal {tx_id}: broadcast failed/timed out: {broadcast_err}. Saved as pending.")
            except Exception as payout_err:
                # Failure before broadcast — safe to release the claim so the
                # user can tap Confirm again (funds stay held).
                logger.error(f"Confirmed withdrawal {tx_id}: payout failed before broadcast: {payout_err}")
                await db.execute(
                    update(Transaction)
                    .where(Transaction.id == tx_id, Transaction.status == "processing_payout")
                    .values(status=PENDING_STATUS)
                )
                await db.commit()
                return (
                    "⚠️ <b>Payout Failed</b>\n\n"
                    "The on-chain transfer could not be executed. Your funds are still "
                    "reserved — please try confirming again in a few minutes."
                ), False
        else:
            tx_hash = f"mock_{address[:6]}_{amount}"

        tx = await _load(db, tx_id)
        tx.status = "pending" if is_real else "completed"
        tx.reference_id = tx_hash
        db.add(tx)
        await db.commit()
        logger.info(
            f"[TRANSACTION] user_id={tx.user_id} | type=withdrawal | amount=-{amount} cents (-${amount/100:.2f}) "
            f"| fee={tx.fee} cents | reference_id={tx_hash} | status={tx.status} | confirmed_by_owner=true"
        )

        if is_real:
            return (
                "✅ <b>Withdrawal Confirmed</b>\n\n"
                f"• <b>Amount:</b> ${amount / 100:.2f} USDT\n"
                f"• <b>Sent to Wallet:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
                f"• <b>Status:</b> Processing (Pending On-Chain Confirmation) 🟡\n\n"
                "<i>You will receive another notification once it is confirmed on-chain.</i>"
            ), True
        return (
            "✅ <b>Withdrawal Confirmed</b>\n\n"
            f"• <b>Amount:</b> ${amount / 100:.2f} USDT\n"
            f"• <b>Sent to Wallet:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
            f"• <b>Status:</b> Completed 🟢"
        ), True


async def cancel_withdrawal(tx_id: int, from_user_id: int, nonce: str) -> str:
    """Refunds a held withdrawal after the owner tapped Cancel."""
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        tx = await _load(db, tx_id)
        if not tx or tx.type != "withdrawal":
            return "⚠️ This withdrawal request could not be found."
        if tx.user_id != from_user_id or not verify_confirmation_nonce(tx_id, tx.user_id, nonce):
            logger.warning(f"Rejected withdrawal cancellation for tx {tx_id}: identity/nonce mismatch (from={from_user_id})")
            return "⚠️ This confirmation is not valid for your account."
        if tx.status != PENDING_STATUS:
            return "ℹ️ This withdrawal was already processed (or expired and was refunded)."

        if not await _claim(db, tx_id, "failed"):
            return "ℹ️ This withdrawal was already processed (or expired and was refunded)."

        amount = -tx.amount
        await _refund(db, tx, "cancelled_by_user")
        logger.info(f"[TRANSACTION] user_id={tx.user_id} | type=withdrawal | cancelled by owner | refunded {amount} cents")
        return (
            "↩️ <b>Withdrawal Cancelled</b>\n\n"
            f"${amount / 100:.2f} USDT has been returned to your balance.\n\n"
            "<i>If you did not request this withdrawal, your session may be "
            "compromised — consider disconnecting linked wallets.</i>"
        )


# Ids seen in 'processing_payout' on the previous sweep. A payout executes in
# seconds, so anything still processing on the NEXT sweep (~5 min later) is
# stuck — the classic case being a crash/redeploy mid-payout after the owner
# tapped Confirm, which leaves funds debited with no payout and no hash.
_seen_processing: set[int] = set()


async def alert_stuck_payouts() -> int:
    """Pages Treasury for withdrawals stuck in 'processing_payout' across two
    consecutive sweeps. Alert-only by design: whether the on-chain transfer
    actually happened needs a human check before refunding or re-paying.
    Returns how many stuck payouts were alerted this pass.
    """
    global _seen_processing
    from app.core.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Transaction).where(
                Transaction.type == "withdrawal",
                Transaction.status == "processing_payout",
            )
        )
        rows = res.scalars().all()
        current_ids = {t.id for t in rows}
        stuck = [t for t in rows if t.id in _seen_processing]
        _seen_processing = current_ids

        alerted = 0
        for tx in stuck:
            amount = -tx.amount
            address = ""
            if tx.reference_id and tx.reference_id.startswith((REF_PREFIX, REVIEW_REF_PREFIX)):
                address = tx.reference_id.split(":", 1)[1]
            age_min = int((_now_naive_utc() - tx.created_at).total_seconds() // 60) if tx.created_at else -1
            try:
                from app.core.alerts import send_alert_with_redis_rate_limit
                await send_alert_with_redis_rate_limit(
                    f"stuck_payout:{tx.id}",
                    "🧊 <b>Withdrawal stuck in processing_payout</b>\n\n"
                    f"• <b>Transaction ID:</b> #{tx.id}\n"
                    f"• <b>User:</b> <code>{tx.user_id}</code>\n"
                    f"• <b>Amount held:</b> ${amount / 100:.2f} USDT\n"
                    f"• <b>Destination:</b> <code>{address or 'unknown'}</code>\n"
                    f"• <b>Requested:</b> ~{age_min} min ago\n\n"
                    "<i>The process likely died mid-payout after the owner confirmed. "
                    "Check the master wallet on tonviewer for an outgoing transfer to this "
                    "destination: if NONE was sent, reset the transaction status to "
                    "pending_confirmation (user can re-confirm) or refund; if it WAS sent, "
                    "set status=pending with the tx hash so the crawler can verify it. "
                    "Do NOT blind-refund — the transfer may have broadcast.</i>",
                    system="treasury",
                )
                alerted += 1
            except Exception as alert_err:
                logger.warning(f"Failed to alert stuck payout tx {tx.id}: {alert_err}")
        return alerted


async def expire_stale_confirmations() -> int:
    """Refunds pending_confirmation withdrawals older than the TTL.
    Runs periodically from the app lifespan. Returns how many were refunded.
    """
    from app.core.database import AsyncSessionLocal
    settings = get_settings()
    cutoff = _now_naive_utc() - timedelta(seconds=settings.WITHDRAWAL_CONFIRMATION_TTL_SECONDS)

    refunded = 0
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Transaction.id).where(
                Transaction.type == "withdrawal",
                Transaction.status == PENDING_STATUS,
                Transaction.created_at < cutoff,
            )
        )
        stale_ids = [row[0] for row in res.all()]

        for tx_id in stale_ids:
            # Claim each individually so we never race a just-arrived Confirm tap.
            if not await _claim(db, tx_id, "failed"):
                continue
            tx = await _load(db, tx_id)
            amount = -tx.amount
            await _refund(db, tx, "confirmation_expired")
            refunded += 1
            logger.info(f"[TRANSACTION] user_id={tx.user_id} | type=withdrawal | confirmation expired | refunded {amount} cents")
            try:
                from app.services.telegram_bot import TelegramService
                await TelegramService.send_notification(
                    tx.user_id,
                    "⌛ <b>Withdrawal Expired</b>\n\n"
                    f"Your withdrawal of ${amount / 100:.2f} USDT was not confirmed in time "
                    "and the full amount has been returned to your balance.",
                )
            except Exception:
                pass
    return refunded
