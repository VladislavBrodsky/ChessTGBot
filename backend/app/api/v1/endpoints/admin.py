"""
Admin API endpoints.

All routes require the authenticated user to be a designated admin
(Telegram IDs: 1016749901 or 716720099).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, or_, desc, update, union
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_admin_user, get_db
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.transaction import Transaction
from app.models.game_history import GameHistory
from app.models.gamification import Referral
from app.models.broadcast import Broadcast
from app.models.xp_transaction import XpTransaction

logger = logging.getLogger(__name__)

router = APIRouter()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _cents_to_dollars(cents: int) -> float:
    return round(cents / 100, 2)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BroadcastCreate(BaseModel):
    message: str
    audience: str = "all"   # all | premium | standard | joined_24h | joined_7d | joined_30d


# ---------------------------------------------------------------------------
# 1.  Dashboard KPIs
# ---------------------------------------------------------------------------

@router.get("/stats")
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Returns a comprehensive snapshot of platform metrics:
    user counts, engagement, financials, referral tree summary, and
    14-day daily signup / revenue charts.
    """
    from app.services.session_manager import SessionManager
    import json

    session_mgr = SessionManager()
    cache_key = "admin:dashboard:stats"
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            cached_stats = await session_mgr.redis.get(cache_key)
            if cached_stats:
                return json.loads(cached_stats)
        except Exception as e:
            logger.warning(f"Failed to fetch admin stats from Redis: {e}")

    now = _now_utc()
    ago_24h = now - timedelta(hours=24)
    ago_7d  = now - timedelta(days=7)
    ago_30d = now - timedelta(days=30)
    ago_14d = now - timedelta(days=14)

    # ── User counts ──────────────────────────────────────────────────────────
    total_users_res = await db.execute(select(func.count(User.id)))
    total_users: int = total_users_res.scalar_one() or 0

    premium_res = await db.execute(
        select(func.count(User.id)).where(User.is_premium)
    )
    premium_users: int = premium_res.scalar_one() or 0

    blocked_res = await db.execute(
        select(func.count(User.id)).where(User.is_blocked == True)  # noqa: E712
    )
    total_blocked_users: int = blocked_res.scalar_one() or 0

    # ── Activity (users active via games, transactions, signups, or check-ins) ──
    async def _active_users(since: datetime) -> int:
        q1 = select(GameHistory.white_player_id.label("player_id")).where(
            GameHistory.game_type == "online",
            GameHistory.created_at >= since,
        )
        q2 = select(GameHistory.black_player_id.label("player_id")).where(
            GameHistory.game_type == "online",
            GameHistory.created_at >= since,
        )
        q3 = select(Transaction.user_id.label("player_id")).where(
            Transaction.created_at >= since,
        )
        q4 = select(User.id.label("player_id")).where(
            User.created_at >= since,
        )
        q5 = select(User.id.label("player_id")).where(
            User.last_checkin_date >= since,
        )
        q_union = union(q1, q2, q3, q4, q5)
        subq = q_union.subquery()
        q_count = select(func.count(subq.c.player_id))
        r = await db.execute(q_count)
        return r.scalar_one() or 0

    active_24h = await _active_users(ago_24h)
    active_7d  = await _active_users(ago_7d)
    active_30d = await _active_users(ago_30d)

    # ── Games ────────────────────────────────────────────────────────────────
    total_games_res = await db.execute(
        select(func.count(GameHistory.id)).where(GameHistory.game_type == "online")
    )
    total_games: int = total_games_res.scalar_one() or 0

    games_today_res = await db.execute(
        select(func.count(GameHistory.id)).where(
            GameHistory.game_type == "online",
            GameHistory.created_at >= ago_24h,
        )
    )
    games_today: int = games_today_res.scalar_one() or 0

    # ── Financials ───────────────────────────────────────────────────────────
    async def _sum_tx(tx_type: str, status: str | None = "completed") -> int:
        q = select(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).where(
            Transaction.type == tx_type
        )
        if status:
            q = q.where(Transaction.status == status)
        r = await db.execute(q)
        return r.scalar_one() or 0

    total_deposits     = await _sum_tx("deposit")
    total_withdrawals  = await _sum_tx("withdrawal")
    total_chargebacks  = await _sum_tx("chargeback")
    total_refunds      = await _sum_tx("refund")
    
    total_fees_res = await db.execute(
        select(func.coalesce(func.sum(Transaction.fee), 0))
    )
    total_fees: int = total_fees_res.scalar_one() or 0

    total_wagers_res = await db.execute(
        select(func.coalesce(func.sum(func.abs(Transaction.amount)), 0)).where(
            Transaction.type == "game_rake"
        )
    )
    platform_rake: int = total_wagers_res.scalar_one() or 0
    net_revenue = total_fees + platform_rake

    # ── Referrals ────────────────────────────────────────────────────────────
    total_refs_res = await db.execute(select(func.count(Referral.id)))
    total_referrals: int = total_refs_res.scalar_one() or 0
    activated_refs_res = await db.execute(
        select(func.count(Referral.id)).where(Referral.activated_at.is_not(None))
    )
    activated_referrals: int = activated_refs_res.scalar_one() or 0
    referral_activation_rate = (
        round(activated_referrals / total_referrals * 100, 1)
        if total_referrals
        else 0.0
    )

    # Level breakdown — count unique referrers at depth 1,2,3 (simple proxy)
    # Level 1 = direct refs, level 2 = refs of refs, etc.
    # We only store flat referrals so we estimate levels via join depth
    # Simple: level_1 = distinct referrers, level_2,3 approximated by sub-query
    level_1_res = await db.execute(
        select(func.count(func.distinct(Referral.referrer_id)))
    )
    level_1 = level_1_res.scalar_one() or 0

    # ── Optimized Daily signup / revenue chart (last 14 days) ──────────────────
    # Daily signups (proxy: game activity)
    games_stmt = (
        select(
            func.date(GameHistory.created_at).label("date"),
            func.count(GameHistory.id).label("count")
        )
        .where(
            GameHistory.game_type == "online",
            GameHistory.created_at >= ago_14d
        )
        .group_by(func.date(GameHistory.created_at))
    )
    games_res = await db.execute(games_stmt)
    
    # Daily revenue (fees + rake)
    rev_stmt = (
        select(
            func.date(Transaction.created_at).label("date"),
            func.coalesce(
                func.sum(
                    Transaction.fee + func.case((Transaction.type == "game_rake", func.abs(Transaction.amount)), else_=0)
                ),
                0,
            ).label("total_cents")
        )
        .where(
            Transaction.status == "completed",
            Transaction.created_at >= ago_14d
        )
        .group_by(func.date(Transaction.created_at))
    )
    rev_res = await db.execute(rev_stmt)

    def _to_str_key(d):
        if hasattr(d, "strftime"):
            return d.strftime("%Y-%m-%d")
        return str(d)

    games_by_date = {_to_str_key(row.date): row.count for row in games_res}
    rev_by_date = {_to_str_key(row.date): row.total_cents for row in rev_res}

    daily_signups: list[dict] = []
    daily_revenue: list[dict] = []
    for i in range(13, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_label = day_date.strftime("%Y-%m-%d")
        daily_signups.append({"date": day_label, "count": games_by_date.get(day_label, 0)})
        daily_revenue.append({"date": day_label, "total_cents": rev_by_date.get(day_label, 0)})

    conversion_rate = round((premium_users / total_users * 100), 1) if total_users else 0.0
    engagement_rate = round((active_24h / total_users * 100), 1) if total_users else 0.0

    stats_payload = {
        "total_users": total_users,
        "total_blocked_users": total_blocked_users,
        "premium_users": premium_users,
        "premium_conversion_rate": conversion_rate,
        "active_24h": active_24h,
        "active_7d": active_7d,
        "active_30d": active_30d,
        "engagement_rate_24h": engagement_rate,
        "total_games": total_games,
        "games_today": games_today,
        "total_deposits_cents": total_deposits,
        "total_withdrawals_cents": total_withdrawals,
        "total_chargebacks_cents": total_chargebacks,
        "total_refunds_cents": total_refunds,
        "total_fees_cents": total_fees,
        "platform_rake_cents": platform_rake,
        "net_revenue_cents": net_revenue,
        "total_referrals": total_referrals,
        "activated_referrals": activated_referrals,
        "referral_activation_rate": referral_activation_rate,
        "referral_levels": {"level_1": level_1},
        "daily_activity": daily_signups,
        "daily_revenue": daily_revenue,
    }

    # Save cache (5 min TTL)
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            await session_mgr.redis.set(cache_key, json.dumps(stats_payload), ex=300)
        except Exception as e:
            logger.warning(f"Failed to save admin stats to Redis: {e}")

    return stats_payload


# ---------------------------------------------------------------------------
# 2.  User management
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_users(
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("id"),
    order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Paginated, searchable list of all users."""
    offset = (page - 1) * limit

    q = select(User)
    count_q = select(func.count(User.id))

    if search:
        term = f"%{search}%"
        condition = or_(
            User.username.ilike(term),
            User.first_name.ilike(term),
            cast_bigint_search(User.telegram_id, search),
        )
        q = q.where(condition)
        count_q = count_q.where(condition)

    # Sorting
    sort_col = getattr(User, sort, User.id)
    q = q.order_by(desc(sort_col) if order == "desc" else sort_col)
    q = q.offset(offset).limit(limit)

    total_res = await db.execute(count_q)
    total: int = total_res.scalar_one() or 0

    users_res = await db.execute(q)
    users = users_res.scalars().all()

    # Count referrals per user via subquery
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "users": [_user_summary(u) for u in users],
    }


def cast_bigint_search(col, value: str):
    """Try to match telegram_id if the search string is numeric."""
    try:
        int_val = int(value)
        return col == int_val
    except ValueError:
        return col == -1  # no match


def _user_summary(u: User) -> dict:
    return {
        "id": u.id,
        "telegram_id": u.telegram_id,
        "username": u.username,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "elo": u.elo,
        "games_played": u.games_played,
        "wins": u.wins,
        "losses": u.losses,
        "draws": u.draws,
        "balance_cents": u.balance,
        "is_premium": u.is_premium,
        "premium_tier": u.premium_tier,
        "premium_expires_at": u.premium_expires_at.isoformat() if u.premium_expires_at else None,
        "level": u.level,
        "xp": u.xp,
        "wallet_address": u.wallet_address,
        "referral_code": u.referral_code,
    }


@router.get("/users/{telegram_id}")
async def get_user_detail(
    telegram_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Full user profile including recent transactions and XP history."""
    user_res = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Recent 20 transactions
    txs_res = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == telegram_id)
        .order_by(desc(Transaction.created_at))
        .limit(20)
    )
    txs = txs_res.scalars().all()

    # Recent 10 XP transactions
    xp_res = await db.execute(
        select(XpTransaction)
        .where(XpTransaction.user_id == telegram_id)
        .order_by(desc(XpTransaction.created_at))
        .limit(10)
    )
    xp_txs = xp_res.scalars().all()

    # Referral count
    ref_count_res = await db.execute(
        select(func.count(Referral.id)).where(Referral.referrer_id == user.id)
    )
    ref_count: int = ref_count_res.scalar_one() or 0

    return {
        "user": _user_summary(user),
        "referral_count": ref_count,
        "transactions": [_tx_summary(t) for t in txs],
        "xp_history": [
            {
                "id": x.id,
                "amount": x.amount,
                "reason": x.reason,
                "reference_id": x.reference_id,
                "created_at": x.created_at.isoformat() if x.created_at else None,
            }
            for x in xp_txs
        ],
    }


# ---------------------------------------------------------------------------
# 3.  Transactions ledger
# ---------------------------------------------------------------------------

@router.get("/transactions")
async def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Paginated, filterable transaction ledger."""
    offset = (page - 1) * limit

    q = select(Transaction).order_by(desc(Transaction.created_at))
    count_q = select(func.count(Transaction.id))

    if type:
        q = q.where(Transaction.type == type)
        count_q = count_q.where(Transaction.type == type)
    if status:
        q = q.where(Transaction.status == status)
        count_q = count_q.where(Transaction.status == status)
    if user_id:
        q = q.where(Transaction.user_id == user_id)
        count_q = count_q.where(Transaction.user_id == user_id)

    total_res = await db.execute(count_q)
    total: int = total_res.scalar_one() or 0

    txs_res = await db.execute(q.offset(offset).limit(limit))
    txs = txs_res.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "transactions": [_tx_summary(t) for t in txs],
    }


def _tx_summary(t: Transaction) -> dict:
    return {
        "id": t.id,
        "user_id": t.user_id,
        "type": t.type,
        "amount_cents": t.amount,
        "fee_cents": t.fee,
        "status": t.status,
        "reference_id": t.reference_id,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


# ---------------------------------------------------------------------------
# 3b.  Solvency / reserve reconciliation
# ---------------------------------------------------------------------------

@router.get("/solvency")
async def get_solvency(
    onchain: bool = Query(True, description="Include the on-chain USDT custody balance"),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Reserve reconciliation report. Combines total user liabilities and the ledger
    accounting breakdown with the custody wallet's on-chain USDT balance.

    Read-only. See SolvencyService for the multi-asset caveat on the on-chain
    figure — it counts USDT only and is a payout-capacity floor, not total
    reserves.
    """
    from app.services.solvency_service import SolvencyService

    report = await SolvencyService.run_solvency_report(db, include_onchain=onchain)

    # Add human-readable dollar figures alongside the raw cents.
    def _d(key: str):
        v = report.get(key)
        return _cents_to_dollars(v) if isinstance(v, int) else None

    report["total_liabilities_usd"] = _d("total_liabilities_cents")
    report["platform_revenue_usd"] = _d("platform_revenue_cents")
    report["onchain_usdt_usd"] = _d("onchain_usdt_cents")
    report["usdt_surplus_deficit_usd"] = _d("usdt_surplus_deficit_cents")
    report["internal_discrepancy_usd"] = _d("internal_discrepancy_cents")
    return report


# ---------------------------------------------------------------------------
# 3c.  Withdrawal review (velocity control)
# ---------------------------------------------------------------------------
# Withdrawals at/above WITHDRAWAL_REVIEW_THRESHOLD_CENTS are debited (funds held)
# and parked as status="pending_review" with the destination address stashed in
# reference_id ("pending_review:<address>"). An approval first claims the row
# with a conditional update and commits it as processing_payout before it can
# execute the irreversible on-chain payout.

@router.get("/withdrawals/pending")
async def list_pending_withdrawals(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List withdrawals held for manual review."""
    res = await db.execute(
        select(Transaction)
        .where(Transaction.type == "withdrawal", Transaction.status == "pending_review")
        .order_by(Transaction.created_at.asc())
    )
    txs = res.scalars().all()
    out = []
    for t in txs:
        address = ""
        if t.reference_id and t.reference_id.startswith("pending_review:"):
            address = t.reference_id.split(":", 1)[1]
        out.append({
            "id": t.id,
            "user_id": t.user_id,
            "amount_cents": -t.amount,      # stored negative; report the positive amount
            "amount_usd": _cents_to_dollars(-t.amount),
            "fee_cents": t.fee,
            "destination_address": address,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })
    return {"pending": out, "count": len(out)}


@router.post("/withdrawals/{tx_id}/approve")
async def approve_withdrawal(
    tx_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Approve a held withdrawal: execute the on-chain payout and mark it sent."""
    from app.core.config import get_settings
    from app.services.withdrawal_review import (
        PENDING_REVIEW_STATUS,
        PROCESSING_PAYOUT_STATUS,
        REVIEW_REFERENCE_PREFIX,
        claim_payout,
        release_payout_claim,
    )
    settings = get_settings()
    from app.services.payout_readiness import get_payout_readiness
    payout_readiness = get_payout_readiness(settings)

    res = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = res.scalars().first()
    if not tx or tx.type != "withdrawal":
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if tx.status != PENDING_REVIEW_STATUS:
        raise HTTPException(status_code=409, detail=f"Withdrawal is already {tx.status}")

    if not tx.reference_id or not tx.reference_id.startswith(REVIEW_REFERENCE_PREFIX):
        raise HTTPException(status_code=400, detail="Withdrawal is missing its destination address")
    if not payout_readiness.ready:
        raise HTTPException(status_code=503, detail="Withdrawals are temporarily unavailable; this request remains pending review")
    address = tx.reference_id.split(":", 1)[1]

    amount = -tx.amount                    # positive requested amount
    transfer_amount_cents = amount - (tx.fee or 0)

    # Commit a conditional claim before touching the blockchain. This makes
    # concurrent admin clicks, retries, and process-local duplicate requests
    # observe the same durable owner state.
    claimed, approved_at = await claim_payout(db, tx_id, _admin.telegram_id)
    if not claimed:
        res = await db.execute(select(Transaction.status).where(Transaction.id == tx_id))
        current_status = res.scalar_one_or_none() or "unavailable"
        raise HTTPException(status_code=409, detail=f"Withdrawal is already {current_status}")

    tx_hash = None
    is_real = False
    if payout_readiness.mode == "real":
        try:
            from app.services.payout_service import BlockchainBroadcastError, execute_usdt_payout
            tx_hash = await execute_usdt_payout(address, transfer_amount_cents)
            is_real = True
        except BlockchainBroadcastError as broadcast_err:
            # A timeout/error at broadcast time may still have reached the
            # chain. Keep the withdrawal non-reviewable and let the crawler
            # reconcile the persisted message hash when one is available.
            tx_hash = broadcast_err.msg_hash or None
            await db.execute(
                update(Transaction)
                .where(Transaction.id == tx_id, Transaction.status == PROCESSING_PAYOUT_STATUS)
                .values(status="pending", reference_id=tx_hash)
            )
            await db.commit()
            logger.warning(
                "[TRANSACTION] withdrawal approval broadcast uncertain "
                "tx_id=%s user_id=%s admin_id=%s reference_id=%s",
                tx_id,
                tx.user_id,
                _admin.telegram_id,
                tx_hash,
            )
            return {
                "status": "approved_pending_reconciliation",
                "tx_id": tx_id,
                "reference_id": tx_hash,
                "approved_by_admin_id": _admin.telegram_id,
                "approved_at": approved_at.isoformat(),
            }
        except Exception as payout_err:
            # This is a known pre-broadcast failure. Release only our durable
            # processing claim, never the user's held balance.
            released = await release_payout_claim(db, tx_id)
            logger.error(
                "[TRANSACTION] withdrawal approval failed before broadcast "
                "tx_id=%s user_id=%s admin_id=%s claim_released=%s error=%s",
                tx_id,
                tx.user_id,
                _admin.telegram_id,
                released,
                payout_err,
            )
            raise HTTPException(status_code=502, detail="On-chain payout failed before broadcast; withdrawal remains pending review")
    else:
        tx_hash = f"mock_{address[:6]}_{amount}"

    await db.execute(
        update(Transaction)
        .where(Transaction.id == tx_id, Transaction.status == PROCESSING_PAYOUT_STATUS)
        .values(status="pending" if is_real else "completed", reference_id=tx_hash)
    )
    await db.commit()
    logger.info(
        "[TRANSACTION] withdrawal approved tx_id=%s user_id=%s admin_id=%s "
        "amount_cents=%s fee_cents=%s reference_id=%s status=%s",
        tx_id,
        tx.user_id,
        _admin.telegram_id,
        amount,
        tx.fee or 0,
        tx_hash,
        "pending" if is_real else "completed",
    )

    try:
        from app.services.telegram_bot import TelegramService
        await TelegramService.send_notification(
            tx.user_id,
            "<b>✅ Withdrawal Approved</b>\n\n"
            f"• <b>Amount:</b> ${amount / 100:.2f} USDT\n"
            f"• <b>Sent to Wallet:</b> ${transfer_amount_cents / 100:.2f} USDT\n"
            "<i>Your withdrawal has been approved and is being processed on-chain.</i>"
        )
    except Exception:
        pass

    return {
        "status": "approved",
        "tx_id": tx_id,
        "reference_id": tx_hash,
        "approved_by_admin_id": _admin.telegram_id,
        "approved_at": approved_at.isoformat(),
    }


@router.post("/withdrawals/{tx_id}/reject")
async def reject_withdrawal(
    tx_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Reject a held withdrawal: refund the held balance to the user."""
    from app.crud import user as user_crud
    from app.services.withdrawal_review import PENDING_REVIEW_STATUS, reject_pending_review

    res = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    tx = res.scalars().first()
    if not tx or tx.type != "withdrawal":
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if tx.status != PENDING_REVIEW_STATUS:
        raise HTTPException(status_code=409, detail=f"Withdrawal is already {tx.status}")

    refund = -tx.amount                    # positive amount to return
    rejected, rejected_at = await reject_pending_review(db, tx_id, _admin.telegram_id)
    if not rejected:
        await db.rollback()
        res = await db.execute(select(Transaction.status).where(Transaction.id == tx_id))
        current_status = res.scalar_one_or_none() or "unavailable"
        raise HTTPException(status_code=409, detail=f"Withdrawal is already {current_status}")

    # The status transition and balance credit deliberately share one commit.
    await user_crud.atomic_credit(db, tx.user_id, refund, commit=False)
    db.add(Transaction(
        user_id=tx.user_id,
        type="withdrawal_refund",
        amount=refund,
        fee=0,
        status="completed",
        reference_id=f"withdrawal_refund:{tx.id}",
    ))
    await db.commit()
    logger.info(
        "[TRANSACTION] withdrawal rejected tx_id=%s user_id=%s admin_id=%s refunded_cents=%s",
        tx_id,
        tx.user_id,
        _admin.telegram_id,
        refund,
    )

    try:
        from app.services.telegram_bot import TelegramService
        await TelegramService.send_notification(
            tx.user_id,
            "<b>↩️ Withdrawal Declined</b>\n\n"
            f"• <b>Amount refunded:</b> ${refund / 100:.2f} USDT\n\n"
            "<i>Your withdrawal could not be approved and the full amount has been returned to your balance.</i>"
        )
    except Exception:
        pass

    return {
        "status": "rejected",
        "tx_id": tx_id,
        "refunded_cents": refund,
        "rejected_by_admin_id": _admin.telegram_id,
        "rejected_at": rejected_at.isoformat(),
    }


# ---------------------------------------------------------------------------
# 4.  Game history
# ---------------------------------------------------------------------------

@router.get("/games")
async def list_games(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Paginated game history, optionally filtered by player."""
    offset = (page - 1) * limit

    q = (
        select(GameHistory)
        .where(GameHistory.game_type == "online")
        .order_by(desc(GameHistory.created_at))
    )
    count_q = select(func.count(GameHistory.id)).where(GameHistory.game_type == "online")

    if user_id:
        condition = or_(
            GameHistory.white_player_id == user_id,
            GameHistory.black_player_id == user_id,
        )
        q = q.where(condition)
        count_q = count_q.where(condition)

    total_res = await db.execute(count_q)
    total: int = total_res.scalar_one() or 0

    games_res = await db.execute(q.offset(offset).limit(limit))
    games = games_res.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "games": [_game_summary(g) for g in games],
    }


def _game_summary(g: GameHistory) -> dict:
    return {
        "id": g.id,
        "game_id": g.game_id,
        "white_player_id": g.white_player_id,
        "black_player_id": g.black_player_id,
        "winner": g.winner,
        "result_type": g.result_type,
        "white_elo_before": g.white_elo_before,
        "white_elo_after": g.white_elo_after,
        "black_elo_before": g.black_elo_before,
        "black_elo_after": g.black_elo_after,
        "total_moves": g.total_moves,
        "duration_seconds": g.duration_seconds,
        "bid_amount_cents": g.bid_amount,
        "platform_rake_cents": g.platform_rake,
        "payout_amount_cents": g.payout_amount,
        "created_at": g.created_at.isoformat() if g.created_at else None,
        "ended_at": g.ended_at.isoformat() if g.ended_at else None,
    }


# ---------------------------------------------------------------------------
# 5.  Broadcasts
# ---------------------------------------------------------------------------

@router.post("/broadcasts")
async def create_broadcast(
    payload: BroadcastCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    """
    Creates a broadcast campaign and immediately launches it as a background task.
    The task rate-limits to ≈28 msgs/sec to stay under Telegram's 30/sec limit.
    """
    allowed_audiences = {"all", "premium", "standard", "joined_24h", "joined_7d", "joined_30d"}
    if payload.audience not in allowed_audiences:
        raise HTTPException(status_code=400, detail=f"Invalid audience. Allowed: {allowed_audiences}")

    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Fetch target audience IDs
    user_ids = await _resolve_audience(db, payload.audience)
    if not user_ids:
        raise HTTPException(status_code=400, detail="No users found for the selected audience")

    broadcast = Broadcast(
        admin_id=admin.telegram_id,
        message=payload.message,
        audience=payload.audience,
        total_count=len(user_ids),
        sent_count=0,
        failed_count=0,
        status="pending",
    )
    db.add(broadcast)
    await db.commit()
    await db.refresh(broadcast)

    # Launch background task
    asyncio.create_task(
        _run_broadcast(broadcast.id, user_ids, payload.message),
        name=f"broadcast-{broadcast.id}",
    )

    return {
        "id": broadcast.id,
        "status": "pending",
        "total_count": broadcast.total_count,
        "audience": broadcast.audience,
        "created_at": broadcast.created_at.isoformat() if broadcast.created_at else None,
    }


@router.get("/broadcasts")
async def list_broadcasts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """List broadcast campaigns ordered by most recent."""
    offset = (page - 1) * limit

    total_res = await db.execute(select(func.count(Broadcast.id)))
    total: int = total_res.scalar_one() or 0

    res = await db.execute(
        select(Broadcast).order_by(desc(Broadcast.created_at)).offset(offset).limit(limit)
    )
    broadcasts = res.scalars().all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "broadcasts": [_broadcast_summary(b) for b in broadcasts],
    }


@router.post("/broadcasts/{broadcast_id}/cancel")
async def cancel_broadcast(
    broadcast_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """Mark a broadcast as cancelled (the background task checks this flag)."""
    res = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
    broadcast = res.scalars().first()
    if not broadcast:
        raise HTTPException(status_code=404, detail="Broadcast not found")

    if broadcast.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Broadcast is already {broadcast.status}")

    broadcast.status = "cancelled"
    await db.commit()
    return {"id": broadcast_id, "status": "cancelled"}


def _broadcast_summary(b: Broadcast) -> dict:
    return {
        "id": b.id,
        "admin_id": b.admin_id,
        "audience": b.audience,
        "message_preview": (b.message[:100] + "…") if len(b.message) > 100 else b.message,
        "total_count": b.total_count,
        "sent_count": b.sent_count,
        "failed_count": b.failed_count,
        "status": b.status,
        "progress_pct": round(b.sent_count / b.total_count * 100, 1) if b.total_count else 0,
        "created_at": b.created_at.isoformat() if b.created_at else None,
        "completed_at": b.completed_at.isoformat() if b.completed_at else None,
    }


# ---------------------------------------------------------------------------
# Broadcast helpers
# ---------------------------------------------------------------------------

async def _resolve_audience(db: AsyncSession, audience: str) -> list[int]:
    """Return a list of telegram_ids for the given audience segment."""
    now = _now_utc()

    if audience in ("joined_24h", "joined_7d", "joined_30d"):
        days_map = {"joined_24h": 1/24, "joined_7d": 7.0, "joined_30d": 30.0}
        since = now - timedelta(hours=24 if audience == "joined_24h" else days_map[audience] * 24)
        white_res = await db.execute(
            select(GameHistory.white_player_id).where(GameHistory.created_at >= since).distinct()
        )
        black_res = await db.execute(
            select(GameHistory.black_player_id).where(GameHistory.created_at >= since).distinct()
        )
        white_ids = [_extract_id(v) for v in white_res.scalars().all()]
        black_ids = [_extract_id(v) for v in black_res.scalars().all()]
        return [v for v in set(white_ids + black_ids) if v is not None]

    # all | premium | standard
    q = select(User.telegram_id)
    if audience == "premium":
        q = q.where(User.is_premium)
    elif audience == "standard":
        q = q.where(~User.is_premium)

    res = await db.execute(q)
    return [_extract_id(v) for v in res.scalars().all() if _extract_id(v) is not None]


def _extract_id(value) -> int | None:
    """Safely extract a telegram_id from either an int or a User object (mock compat)."""
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if hasattr(value, "telegram_id"):
        return value.telegram_id
    try:
        return int(value)
    except (TypeError, ValueError):
        return None



async def _run_broadcast(broadcast_id: int, user_ids: list[int], message: str) -> None:
    """
    Background coroutine: sends the message to every user in the list,
    rate-limited to ~28 messages/sec (35 ms delay) to stay under Telegram's
    30 msgs/sec global limit.  Periodically updates progress in the database.
    """
    from app.services.telegram_bot import TelegramService

    DELAY_SECS = 0.035      # ~28/sec
    BATCH_SIZE = 50         # flush DB progress every N messages

    sent = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        # Mark as running
        res = await db.execute(select(Broadcast).where(Broadcast.id == broadcast_id))
        bc = res.scalars().first()
        if not bc:
            return
        bc.status = "running"
        await db.commit()

        for i, telegram_id in enumerate(user_ids):
            # Check for cancellation
            if i % BATCH_SIZE == 0 and i > 0:
                await db.refresh(bc)
                if bc.status == "cancelled":
                    logger.info(f"[Broadcast {broadcast_id}] Cancelled after {sent} messages.")
                    break
                bc.sent_count = sent
                bc.failed_count = failed
                await db.commit()

            try:
                await TelegramService.send_notification(telegram_id, message)
                sent += 1
            except Exception as exc:
                logger.warning(f"[Broadcast {broadcast_id}] Failed for {telegram_id}: {exc}")
                failed += 1

            await asyncio.sleep(DELAY_SECS)

        # Final update
        if bc.status != "cancelled":
            bc.status = "completed"
            bc.completed_at = _now_utc()
        bc.sent_count = sent
        bc.failed_count = failed
        await db.commit()

    logger.info(
        f"[Broadcast {broadcast_id}] Done — sent={sent}, failed={failed}, "
        f"total={len(user_ids)}"
    )


# ---------------------------------------------------------------------------
# 6.  System Status
# ---------------------------------------------------------------------------

@router.get("/system/status")
async def get_system_status(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Returns a real-time health snapshot of all core backend subsystems:
    Database, Redis, Telegram Bot, Web3 / Wallets, XP Engine, and Notifications.
    """
    import time
    from app.core.config import get_settings
    from app.services.session_manager import SessionManager
    from app.services.telegram_bot import TelegramService

    settings = get_settings()
    results: dict = {}

    # ── 1. Database ───────────────────────────────────────────────────────────
    try:
        t0 = time.monotonic()
        await db.execute(select(func.count(User.id)))
        db_latency_ms = round((time.monotonic() - t0) * 1000, 1)
        results["database"] = {
            "status": "online",
            "latency_ms": db_latency_ms,
            "detail": "PostgreSQL async connection healthy",
        }
    except Exception as e:
        results["database"] = {
            "status": "offline",
            "latency_ms": None,
            "detail": str(e),
        }

    # ── 2. Redis ──────────────────────────────────────────────────────────────
    session_mgr = SessionManager()
    if session_mgr._use_memory or not session_mgr.redis:
        results["redis"] = {
            "status": "memory_fallback",
            "latency_ms": None,
            "detail": "Redis unavailable — using in-process memory store",
        }
    else:
        try:
            t0 = time.monotonic()
            await session_mgr.redis.ping()
            redis_latency_ms = round((time.monotonic() - t0) * 1000, 1)
            results["redis"] = {
                "status": "online",
                "latency_ms": redis_latency_ms,
                "detail": "Redis connection healthy",
            }
        except Exception as e:
            results["redis"] = {
                "status": "offline",
                "latency_ms": None,
                "detail": str(e),
            }

    # ── 3. Telegram Bot ───────────────────────────────────────────────────────
    try:
        if TelegramService.application and TelegramService.application.bot:
            t0 = time.monotonic()
            bot_info = await TelegramService.application.bot.get_me()
            tg_latency_ms = round((time.monotonic() - t0) * 1000, 1)
            results["telegram_bot"] = {
                "status": "online",
                "latency_ms": tg_latency_ms,
                "bot_username": f"@{bot_info.username}",
                "bot_id": bot_info.id,
                "is_leader": TelegramService.is_currently_leader,
                "receiver_active": TelegramService.receiver_active,
                "receiver_type": TelegramService.receiver_type,
                "detail": "Telegram Bot API reachable",
            }
        else:
            results["telegram_bot"] = {
                "status": "initializing",
                "latency_ms": None,
                "bot_username": f"@{settings.TELEGRAM_BOT_USERNAME}",
                "bot_id": None,
                "is_leader": False,
                "receiver_active": False,
                "receiver_type": None,
                "detail": "Bot application not yet started (may be passive instance)",
            }
    except Exception as e:
        results["telegram_bot"] = {
            "status": "offline",
            "latency_ms": None,
            "bot_username": f"@{settings.TELEGRAM_BOT_USERNAME}",
            "bot_id": None,
            "is_leader": False,
            "receiver_active": False,
            "receiver_type": None,
            "detail": str(e),
        }

    # ── 4. Web3 / Wallets ─────────────────────────────────────────────────────
    ton_api_configured = bool(settings.TON_API_KEY)
    ton_console_configured = bool(settings.TON_CONSOLE_TOKEN)
    from app.services.payout_readiness import get_payout_readiness
    payout_readiness = get_payout_readiness(settings)

    # Try to get master wallet balance via TON API
    master_balance_nano: int | None = None
    ton_api_status = "unconfigured"
    if ton_api_configured:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"https://tonapi.io/v2/accounts/{settings.MASTER_WALLET_ADDRESS}",
                    headers={"Authorization": f"Bearer {settings.TON_API_KEY}"},
                )
                if resp.status_code == 200:
                    account_data = resp.json()
                    master_balance_nano = account_data.get("balance", 0)
                    ton_api_status = "online"
                else:
                    ton_api_status = f"error_{resp.status_code}"
        except Exception as e:
            ton_api_status = f"offline: {str(e)[:60]}"

    master_balance_ton = round(master_balance_nano / 1e9, 4) if master_balance_nano is not None else None

    results["web3"] = {
        "status": ton_api_status,
        "ton_api_configured": ton_api_configured,
        "ton_console_configured": ton_console_configured,
        "payout_ready": payout_readiness.ready,
        "payout_mode": payout_readiness.mode,
        "payout_unavailable_reason": payout_readiness.reason,
        "master_wallet_address": settings.MASTER_WALLET_ADDRESS,
        "company_wallet_address": settings.COMPANY_WALLET_ADDRESS,
        "master_wallet_balance_ton": master_balance_ton,
        "detail": "TON API reachable" if ton_api_status == "online" else ton_api_status,
    }

    # ── 5. XP / Gamification Engine ───────────────────────────────────────────
    try:
        xp_count_res = await db.execute(select(func.count()).select_from(__import__('app.models.xp_transaction', fromlist=['XpTransaction']).XpTransaction))
        xp_total = xp_count_res.scalar_one() or 0
    except Exception:
        xp_total = None

    results["xp_engine"] = {
        "status": "online",
        "total_xp_transactions": xp_total,
        "xp_per_level": 200,
        "detail": "Gamification engine operational",
    }

    # ── 6. Notifications ──────────────────────────────────────────────────────
    # Count recent broadcasts
    try:
        broadcasts_res = await db.execute(
            select(func.count(Broadcast.id)).where(Broadcast.status.in_(["running", "pending"]))
        )
        active_broadcasts = broadcasts_res.scalar_one() or 0
        completed_res = await db.execute(
            select(func.count(Broadcast.id)).where(Broadcast.status == "completed")
        )
        completed_broadcasts = completed_res.scalar_one() or 0
        results["notifications"] = {
            "status": "online",
            "active_broadcasts": active_broadcasts,
            "completed_broadcasts": completed_broadcasts,
            "detail": "Broadcast notification system operational",
        }
    except Exception as e:
        results["notifications"] = {
            "status": "offline",
            "active_broadcasts": 0,
            "completed_broadcasts": 0,
            "detail": str(e),
        }

    # ── 7. Ledger Audit ──────────────────────────────────────────────────────
    try:
        from app.services.ledger_audit import LedgerAuditService
        mismatches = await LedgerAuditService.run_audit(db)
        if mismatches:
            results["ledger_audit"] = {
                "status": "partial",
                "mismatches_count": len(mismatches),
                "detail": f"Detected {len(mismatches)} balance/ledger mismatch anomalies!",
                "mismatches": [
                    {
                        "telegram_id": row.telegram_id,
                        "first_name": row.first_name,
                        "balance": row.balance,
                        "ledger_sum": row.ledger_sum
                    }
                    for row in mismatches
                ]
            }
        else:
            results["ledger_audit"] = {
                "status": "online",
                "mismatches_count": 0,
                "detail": "Ledger double-entry reconciliation healthy.",
            }
    except Exception as e:
        results["ledger_audit"] = {
            "status": "offline",
            "mismatches_count": None,
            "detail": f"Failed to run audit: {str(e)}",
        }

    # ── Summary ───────────────────────────────────────────────────────────────
    all_statuses = [v.get("status") for v in results.values()]
    if all(s == "online" for s in all_statuses):
        overall = "all_systems_operational"
    elif any(s == "offline" for s in all_statuses):
        overall = "degraded"
    else:
        overall = "partial"

    return {
        "overall": overall,
        "checked_at": _now_utc().isoformat(),
        "systems": results,
    }


@router.post("/benchmark")
async def trigger_benchmark(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_admin_user),
):
    """
    Runs production-safe performance benchmarks inside the live server container:
    - Minimax search time for depths 2, 3, and 4.
    - Measure live Database connection latency.
    - Measure live Redis cache connection latency (if configured).
    """
    import time
    import statistics
    import chess
    from app.services.game_engine import GameEngine
    from app.services.session_manager import SessionManager

    engine_results = {}
    positions = {
        "Starting": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "Mid-game": "r1bq1rk1/pp2bppp/2n1pn2/2pp4/2PP4/2N1PNP1/PP1B1PBP/R2Q1RK1 w - - 0 9",
        "End-game": "8/k7/8/8/8/8/1Q6/K7 w - - 0 1"
    }

    # 1. Engine Benchmarks
    for depth in [2, 3, 4]:
        depth_key = f"depth_{depth}"
        engine_results[depth_key] = {}
        for pos_name, fen in positions.items():
            engine = GameEngine()
            engine.board = chess.Board(fen)
            
            # Warmup
            engine.get_best_move(depth=1)
            
            # Measure
            start = time.perf_counter()
            engine.get_best_move(depth=depth)
            end = time.perf_counter()
            engine_results[depth_key][pos_name] = round((end - start) * 1000.0, 2)

    # 2. Database latency benchmark (20 trials)
    db_latencies = []
    for _ in range(20):
        start = time.perf_counter()
        await db.execute(select(func.count(User.id)))
        db_latencies.append((time.perf_counter() - start) * 1000.0)
    db_avg = round(statistics.mean(db_latencies), 2)
    db_p95 = round(statistics.quantiles(db_latencies, n=20)[18], 2)

    # 3. Redis latency benchmark (20 trials)
    redis_avg = None
    redis_p95 = None
    session_mgr = SessionManager()
    if session_mgr.redis and not session_mgr._use_memory:
        try:
            redis_latencies = []
            for _ in range(20):
                start = time.perf_counter()
                await session_mgr.redis.ping()
                redis_latencies.append((time.perf_counter() - start) * 1000.0)
            redis_avg = round(statistics.mean(redis_latencies), 2)
            redis_p95 = round(statistics.quantiles(redis_latencies, n=20)[18], 2)
        except Exception as redis_err:
            logger.warning(f"Redis benchmark failed: {redis_err}")
            SessionManager._use_memory = True

    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "benchmarks": {
            "engine": engine_results,
            "database_ms": {
                "average": db_avg,
                "p95": db_p95
            },
            "redis_ms": {
                "average": redis_avg,
                "p95": redis_p95
            } if redis_avg is not None else None
        }
    }
