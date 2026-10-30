"""Admin recovery for USDT deposits that reached the master wallet without a memo.

The crawler only credits transfers carrying a ``ref_<telegram_id>`` comment, so
a player who forgets the memo has paid but sees no balance. An admin attributes
such a transfer to a player here. The amount, asset, recipient and settlement
state always come from TonAPI, never from the admin's request, and the event id
becomes the deposit's reference so neither this tool nor the crawler can credit
it a second time.
"""

import logging
import re
from typing import Any, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User

logger = logging.getLogger(__name__)

EVENT_ID_RE = re.compile(r"^[0-9a-fA-F]{64}$")


class UnmemoedDepositError(Exception):
    """The event cannot be credited; ``status_code`` maps to the HTTP reply."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


async def fetch_ton_event(event_id: str) -> dict[str, Any]:
    settings = get_settings()
    headers = {}
    if settings.TON_API_KEY:
        headers["Authorization"] = f"Bearer {settings.TON_API_KEY}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.get(f"https://tonapi.io/v2/events/{event_id}", headers=headers)
    if res.status_code == 404:
        raise UnmemoedDepositError("Event not found on chain.", 404)
    if res.status_code != 200:
        raise UnmemoedDepositError("TonAPI is unavailable; try again shortly.", 503)
    return res.json()


def parse_unmemoed_usdt_deposit(event: dict[str, Any], master_wallet: str) -> dict[str, Any]:
    """Return the single memo-less USDT transfer into the master wallet, or raise."""
    from app.api.v1.endpoints.wallet import _is_usdt_master, convert_ton_address_to_hex

    if event.get("in_progress"):
        raise UnmemoedDepositError("Event is still settling on chain.", 409)
    master_raw = convert_ton_address_to_hex(master_wallet)

    incoming = []
    for action in event.get("actions", []):
        if action.get("type") != "JettonTransfer" or action.get("status") != "ok":
            continue
        transfer = action.get("JettonTransfer") or {}
        recipient = (transfer.get("recipient") or {}).get("address", "")
        try:
            if convert_ton_address_to_hex(recipient) != master_raw:
                continue
        except Exception:
            continue
        incoming.append(transfer)

    if not incoming:
        raise UnmemoedDepositError("Event has no successful jetton transfer into the master wallet.")
    if len(incoming) > 1:
        raise UnmemoedDepositError("Event has several transfers into the master wallet; credit it by hand.")

    transfer = incoming[0]
    if not _is_usdt_master((transfer.get("jetton") or {}).get("address", "")):
        raise UnmemoedDepositError("Only USDT deposits can be credited.")
    comment = (transfer.get("comment") or "").strip()
    if comment.startswith("ref_"):
        raise UnmemoedDepositError("Transfer carries a ref_ memo; the deposit crawler credits it.", 409)

    amount_cents = int(round(int(transfer.get("amount", 0)) / 10 ** 6 * 100))
    if amount_cents <= 0:
        raise UnmemoedDepositError("Transfer amount is zero.")
    return {
        "amount_cents": amount_cents,
        "sender": (transfer.get("sender") or {}).get("address", ""),
        "comment": comment or None,
        "timestamp": event.get("timestamp"),
    }


def _same_address(a: Optional[str], b: Optional[str]) -> bool:
    from app.api.v1.endpoints.wallet import convert_ton_address_to_hex

    if not a or not b:
        return False
    try:
        return convert_ton_address_to_hex(a) == convert_ton_address_to_hex(b)
    except Exception:
        return False


async def credit_unmemoed_deposit(
    db: AsyncSession,
    *,
    event_id: str,
    telegram_id: int,
    admin_id: int,
    confirm: bool,
) -> dict[str, Any]:
    """Preview (``confirm=False``) or credit a memo-less USDT deposit to a player."""
    from app.api.v1.endpoints.wallet import _split_web3_top_up

    if not EVENT_ID_RE.match(event_id or ""):
        raise UnmemoedDepositError("event_id must be a 64-character hex transaction hash.")
    event_id = event_id.lower()
    settings = get_settings()
    if not settings.MASTER_WALLET_ADDRESS:
        raise UnmemoedDepositError("MASTER_WALLET_ADDRESS is not configured.", 503)

    deposit = parse_unmemoed_usdt_deposit(await fetch_ton_event(event_id), settings.MASTER_WALLET_ADDRESS)
    credited, fee = _split_web3_top_up(deposit["amount_cents"])

    user_result = await db.execute(
        select(User).where(User.telegram_id == telegram_id).with_for_update()
    )
    user = user_result.scalars().first()
    if not user:
        raise UnmemoedDepositError("Player not found.", 404)

    # Any user: the event is one payment, whoever it was attributed to.
    prior = await db.execute(select(Transaction.user_id).where(Transaction.reference_id == event_id))
    prior_user = prior.scalars().first()
    if prior_user is not None:
        raise UnmemoedDepositError(f"Event was already credited to user {prior_user}.", 409)

    summary = {
        "event_id": event_id,
        "telegram_id": telegram_id,
        "username": user.username,
        "sender": deposit["sender"],
        "sender_matches_linked_wallet": _same_address(deposit["sender"], user.wallet_address),
        "comment": deposit["comment"],
        "timestamp": deposit["timestamp"],
        "gross_cents": deposit["amount_cents"],
        "credit_cents": credited,
        "fee_cents": fee,
        "credited": False,
    }
    if not confirm:
        await db.rollback()
        return summary

    user.balance += credited
    db.add(Transaction(
        user_id=telegram_id, type="deposit", amount=credited, fee=fee,
        status="completed", reference_id=event_id,
    ))
    db.add(Transaction(
        user_id=telegram_id, type="deposit_fee", amount=-fee, fee=0,
        status="completed", reference_id=f"fee_{event_id[:16]}",
    ))
    await db.commit()
    await db.refresh(user)
    logger.warning(
        "[TRANSACTION] manual unmemoed deposit credit event_id=%s user_id=%s admin_id=%s "
        "credited=%s fee=%s sender=%s",
        event_id, telegram_id, admin_id, credited, fee, deposit["sender"],
    )

    try:
        from app.services.gram_rewards import check_referral_after_deposit
        await check_referral_after_deposit(db, user.id)
    except Exception as referral_err:
        logger.warning("Referral check after manual deposit credit failed: %s", referral_err)

    try:
        from app.services.telegram_bot import TelegramService
        await TelegramService.send_notification(
            telegram_id,
            "<b>✅ Deposit credited</b>\n\n"
            f"Your USDT transfer arrived without a memo, so we matched it by hand.\n"
            f"• <b>Credited:</b> +${credited / 100:.2f} USDT\n"
            f"• <b>Top-up fee (5%):</b> -${fee / 100:.2f} USDT\n"
            f"• <b>Transaction:</b> <a href=\"https://tonviewer.com/transaction/{event_id}\">"
            f"{event_id[:10]}...{event_id[-8:]}</a>\n\n"
            f"<i>Balance: {user.balance / 100:.2f} USDT. Next time, include your ref_ memo "
            "so it credits automatically.</i>",
        )
    except Exception as notify_err:
        logger.warning("Failed to notify player of manual deposit credit: %s", notify_err)

    summary["credited"] = True
    summary["new_balance_cents"] = user.balance
    return summary
