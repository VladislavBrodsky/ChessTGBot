"""Platform profit: how much of the custody wallet is the platform's, and
moving it out to the company wallet.

The master wallet holds player money and platform earnings (5% top-up fees,
game rake) together. Profit that can leave is what remains after everything
the wallet still owes:

    available = on-chain USDT
              - player balances
              - withdrawals already debited but not yet confirmed on chain
              - stakes held in matchmaking
              - stakes sitting in unsettled game pots
              - sweeps sent in the last RECENT_SWEEP_WINDOW (the chain's
                jetton balance lags a broadcast by seconds; without this a
                second sweep could re-spend the same surplus from player funds)
              - PROFIT_SWEEP_RESERVE_CENTS (cushion for timing and fees)

A sweep is admin-triggered: preview first, then confirm. It only pays the
configured COMPANY_WALLET_ADDRESS, which must be a different wallet from the
master, and it goes through the same signing path, lock and custody pre-check
as player payouts.
"""

import asyncio
import html
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import and_, exists, func, select
from sqlalchemy.orm import aliased

from app.core.config import get_settings
from app.models.transaction import Transaction
from app.models.user import User

logger = logging.getLogger(__name__)

# Withdrawal rows whose debit is already off the player's balance but whose
# USDT has not been confirmed as sent.
UNSENT_WITHDRAWAL_STATUSES = ("pending_confirmation", "pending_review", "processing_payout", "pending")
SETTLEMENT_TYPES = ("game_win", "refund", "game_refund")
MIN_SWEEP_CENTS = 100
RECENT_SWEEP_WINDOW = timedelta(minutes=10)

_sweep_lock = asyncio.Lock()


class SweepRefused(ValueError):
    pass


async def _obligations(db) -> dict:
    balances = int((await db.execute(select(func.coalesce(func.sum(User.balance), 0)).where(User.balance > 0))).scalar() or 0)
    unsent = int((await db.execute(
        select(func.coalesce(func.sum(-Transaction.amount), 0))
        .where(Transaction.type == "withdrawal", Transaction.status.in_(UNSENT_WITHDRAWAL_STATUSES))
    )).scalar() or 0)
    held = int((await db.execute(
        select(func.coalesce(func.sum(-Transaction.amount), 0))
        .where(Transaction.type == "game_wager", Transaction.status == "pending")
    )).scalar() or 0)
    settled = aliased(Transaction)
    open_pots = int((await db.execute(
        select(func.coalesce(func.sum(-Transaction.amount), 0)).where(
            Transaction.type == "game_wager",
            Transaction.status == "completed",
            ~exists().where(and_(settled.reference_id == Transaction.reference_id,
                                 settled.type.in_(SETTLEMENT_TYPES))),
        )
    )).scalar() or 0)
    return {
        "player_balances_cents": balances,
        "unsent_withdrawals_cents": unsent,
        "held_stakes_cents": held,
        "open_pots_cents": open_pots,
    }


def _same_wallet(a: str, b: str) -> bool:
    from app.api.v1.endpoints.wallet import convert_ton_address_to_hex
    try:
        return convert_ton_address_to_hex(a) == convert_ton_address_to_hex(b)
    except Exception:
        return False


def company_wallet_problem(settings) -> Optional[str]:
    """Why sweeps are blocked by configuration, or None if they may run."""
    company = (settings.COMPANY_WALLET_ADDRESS or "").strip()
    if not company:
        return "COMPANY_WALLET_ADDRESS is not set"
    try:
        from tonsdk.utils import Address
        Address(company)
    except Exception:
        return "COMPANY_WALLET_ADDRESS is not a valid TON address"
    if _same_wallet(company, settings.MASTER_WALLET_ADDRESS):
        return "COMPANY_WALLET_ADDRESS must be a different wallet from MASTER_WALLET_ADDRESS"
    return None


async def get_profit_position(db) -> dict:
    from app.services.solvency_service import SolvencyService

    settings = get_settings()
    owed = await _obligations(db)
    total_owed = sum(owed.values())
    reserve = int(settings.PROFIT_SWEEP_RESERVE_CENTS)
    onchain, onchain_error = await SolvencyService.get_onchain_usdt_cents()
    since = datetime.now(timezone.utc).replace(tzinfo=None) - RECENT_SWEEP_WINDOW
    in_flight = int((await db.execute(
        select(func.coalesce(func.sum(-Transaction.amount), 0))
        .where(Transaction.type == "profit_sweep", Transaction.created_at >= since)
    )).scalar() or 0)
    available = None if onchain is None else max(0, onchain - total_owed - in_flight - reserve)
    swept = int((await db.execute(
        select(func.coalesce(func.sum(-Transaction.amount), 0))
        .where(Transaction.type == "profit_sweep", Transaction.status.in_(("completed", "pending")))
    )).scalar() or 0)
    return {
        **owed,
        "total_owed_cents": total_owed,
        "reserve_cents": reserve,
        "recent_sweeps_cents": in_flight,
        "onchain_usdt_cents": onchain,
        "onchain_error": onchain_error,
        "available_profit_cents": available,
        "swept_to_date_cents": swept,
        "company_wallet_address": settings.COMPANY_WALLET_ADDRESS or None,
        "sweep_blocked_reason": company_wallet_problem(settings),
    }


async def sweep_profit(db, *, admin_id: int, amount_cents: Optional[int], confirm: bool) -> dict:
    """Preview (confirm=False) or send profit to the company wallet.

    amount_cents=None sweeps everything available. The position is recomputed
    inside the lock so two confirmations can't both spend the same surplus.
    """
    from app.services.payout_service import BlockchainBroadcastError, execute_usdt_payout

    settings = get_settings()
    async with _sweep_lock:
        position = await get_profit_position(db)
        if position["sweep_blocked_reason"]:
            raise SweepRefused(position["sweep_blocked_reason"])
        available = position["available_profit_cents"]
        if available is None:
            raise SweepRefused(f"On-chain USDT balance unavailable: {position['onchain_error']}")
        amount = available if amount_cents is None else int(amount_cents)
        if amount < MIN_SWEEP_CENTS:
            raise SweepRefused(f"Nothing to sweep: available profit is ${available / 100:.2f} (minimum ${MIN_SWEEP_CENTS / 100:.2f})")
        if amount > available:
            raise SweepRefused(f"Requested ${amount / 100:.2f} exceeds available profit ${available / 100:.2f}")

        result = {**position, "sweep_amount_cents": amount, "sent": False}
        if not confirm:
            return result

        status, reference = "completed", None
        try:
            reference = await execute_usdt_payout(settings.COMPANY_WALLET_ADDRESS, amount)
        except BlockchainBroadcastError as err:
            # May have reached the chain: record it so it is never re-swept,
            # and leave it for a person to confirm on Tonviewer.
            status, reference = "pending", err.msg_hash
        db.add(Transaction(
            user_id=None, type="profit_sweep", amount=-amount, fee=0,
            status=status, reference_id=reference,
        ))
        await db.commit()
        logger.info(
            "Profit sweep of $%.2f to company wallet by admin %s: status=%s ref=%s",
            amount / 100, admin_id, status, reference,
        )
        try:
            from app.core.alerts import send_alert_with_redis_rate_limit
            ref = html.escape(str(reference or "—"))
            await send_alert_with_redis_rate_limit(
                f"profit_sweep:{reference}",
                "🏦 <b>Profit sweep sent to company wallet</b>\n\n"
                f"• <b>Amount:</b> ${amount / 100:,.2f} USDT\n"
                f"• <b>To:</b> <code>{html.escape(settings.COMPANY_WALLET_ADDRESS)}</code>\n"
                f"• <b>By admin:</b> <code>{admin_id}</code>\n"
                f"• <b>Status:</b> {status}\n"
                f"• <b>Message hash:</b> <code>{ref}</code>",
                system="treasury",
            )
        except Exception as alert_err:
            logger.warning("Could not alert treasury about profit sweep: %s", alert_err)
        return {**result, "sent": True, "status": status, "reference_id": reference}
