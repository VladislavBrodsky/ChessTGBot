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
from sqlalchemy import select, func, and_, or_, desc
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
        select(func.count(User.id)).where(User.is_premium == True)
    )
    premium_users: int = premium_res.scalar_one() or 0

    # ── Activity (users who played a game or made a transaction in window) ──
    async def _active_users(since: datetime) -> int:
        q_union = (
            select(GameHistory.white_player_id.label("player_id"))
            .where(
                GameHistory.game_type == "online",
                GameHistory.created_at >= since,
            )
            .union(
                select(GameHistory.black_player_id.label("player_id"))
                .where(
                    GameHistory.game_type == "online",
                    GameHistory.created_at >= since,
                )
            )
        )
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
    
    # Daily revenue
    rev_stmt = (
        select(
            func.date(Transaction.created_at).label("date"),
            func.coalesce(func.sum(Transaction.fee), 0).label("total_cents")
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
        "total_fees_cents": total_fees,
        "platform_rake_cents": platform_rake,
        "net_revenue_cents": net_revenue,
        "total_referrals": total_referrals,
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
        q = q.where(User.is_premium == True)
    elif audience == "standard":
        q = q.where(User.is_premium == False)

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
