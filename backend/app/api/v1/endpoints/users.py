from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db, get_read_db
from app.crud import user as user_crud
from pydantic import BaseModel
from app.models.user import User
from app.api.v1.deps import get_current_user, ip_rate_limit
from app.core.config import get_settings

settings = get_settings()

router = APIRouter()

from typing import Optional, List  # noqa: E402
from datetime import datetime, timezone, timedelta  # noqa: E402

class LeaderboardItem(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    elo: int
    rank: int

class AcademyLeaderboardItem(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    xp: int
    study_streak: int
    rank: int

class OpponentInfo(BaseModel):
    name: str
    elo: int

class RecentGame(BaseModel):
    game_id: str
    opponent: OpponentInfo
    result: str  # 'win', 'loss', 'draw'
    elo_change: int
    played_at: Optional[str]
    duration_seconds: Optional[int]

class CurrentStreak(BaseModel):
    type: Optional[str]  # 'win', 'loss', or None
    count: int

class BestStreak(BaseModel):
    wins: int
    date: Optional[datetime]

class UserStats(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    elo: int
    games_played: int
    wins: int
    losses: int
    draws: int
    is_premium: bool
    premium_tier: Optional[str] = None
    premium_expires_at: Optional[datetime] = None
    premium_billing_period: Optional[str] = None  # "monthly" | "annual"
    
    # Enhanced stats
    win_rate: float
    loss_rate: float
    draw_rate: float
    global_rank: int
    percentile: float
    total_score: float
    current_streak: CurrentStreak
    best_streak: BestStreak
    recent_games: List[RecentGame]
    referral_code: Optional[str] = None
    xp: int = 0
    level: int = 1
    bot_username: str = "FinChess_bot"
    # Arena notification targeting. `region` is None until the user answers the
    # region prompt, which the frontend uses to decide whether to show it.
    region: Optional[str] = None
    arena_notifications: bool = True
    has_stripe_subscription: bool = False  # True only when subscribed via Stripe card (has stripe_customer_id)
    study_streak: int = 0
    unlocked_items: Optional[str] = None
    xp_multiplier: float = 1.0
    multiplier_expires_at: Optional[datetime] = None

class ReferralEarningPoint(BaseModel):
    date: str   # ISO date string e.g. "2025-06-10"
    amount: float  # In USDT (cents / 100)

class ReferralStats(BaseModel):
    total_referrals: int
    activated_referrals: int  # completed the qualifying referral milestone
    activation_rate: float
    active_referrals: int   # played >= 1 game in the last 7 days
    total_earnings_usdt: float  # sum of referral_commission transactions in USDT
    earnings_chart: List[ReferralEarningPoint]  # last 30 days daily earnings

@router.get("/referrals/stats", response_model=ReferralStats)
async def get_referral_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns referral program statistics for the current user:
    - total_referrals: total number of people who signed up via this user's link
    - activated_referrals: referrals who completed the qualifying game milestone
    - activation_rate: activated referrals as a percentage of total referrals
    - active_referrals: referrals who played at least 1 game in the last 7 days
    - total_earnings_usdt: cumulative referral commission received (USDT)
    - earnings_chart: daily referral earnings for the last 30 days (for SVG chart)
    """
    from app.models.gamification import Referral
    from app.models.transaction import Transaction

    # 1. Total referrals
    total_result = await db.execute(
        select(func.count(Referral.id)).where(Referral.referrer_id == current_user.id)
    )
    total_referrals = total_result.scalar() or 0

    # 2. Activated referrals: durable completion of the qualifying milestone
    activated_result = await db.execute(
        select(func.count(Referral.id)).where(
            Referral.referrer_id == current_user.id,
            Referral.activated_at.is_not(None),
        )
    )
    activated_referrals = activated_result.scalar() or 0
    activation_rate = (
        round(activated_referrals / total_referrals * 100, 1)
        if total_referrals
        else 0.0
    )

    # 3. Active referrals: referred users who played >= 1 game in the last 7 days
    week_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=7)
    
    # Query transactions of referred users directly using JOIN
    active_tx_result = await db.execute(
        select(func.count(func.distinct(Referral.referred_user_id)))
        .select_from(Referral)
        .join(User, User.id == Referral.referred_user_id)
        .join(Transaction, Transaction.user_id == User.telegram_id)
        .where(
            and_(
                Referral.referrer_id == current_user.id,
                Transaction.type.in_(["game_wager", "game_win"]),
                Transaction.created_at >= week_ago
            )
        )
    )
    active_referrals = active_tx_result.scalar() or 0
    
    # Fallback: count referred users who have games_played > 0 if active tx approach returns 0
    if active_referrals == 0:
        fallback_result = await db.execute(
            select(func.count(Referral.referred_user_id))
            .select_from(Referral)
            .join(User, User.id == Referral.referred_user_id)
            .where(
                and_(
                    Referral.referrer_id == current_user.id,
                    User.games_played > 0
                )
            )
        )
        active_referrals = fallback_result.scalar() or 0

    # 4. Total earnings from referral commissions
    total_earnings_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            and_(
                Transaction.user_id == current_user.telegram_id,
                Transaction.type == "referral_commission",
                Transaction.status == "completed"
            )
        )
    )
    total_earnings_cents = total_earnings_result.scalar() or 0
    total_earnings_usdt = total_earnings_cents / 100.0

    # 5. Daily earnings for last 30 days (for chart)
    thirty_days_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    daily_result = await db.execute(
        select(
            func.date(Transaction.created_at).label("day"),
            func.sum(Transaction.amount).label("total")
        ).where(
            and_(
                Transaction.user_id == current_user.telegram_id,
                Transaction.type == "referral_commission",
                Transaction.status == "completed",
                Transaction.created_at >= thirty_days_ago
            )
        ).group_by(func.date(Transaction.created_at)).order_by(func.date(Transaction.created_at))
    )
    daily_rows = daily_result.fetchall()
    earnings_chart = [
        ReferralEarningPoint(date=str(row.day), amount=round(row.total / 100.0, 4))
        for row in daily_rows
    ]

    return ReferralStats(
        total_referrals=total_referrals,
        activated_referrals=activated_referrals,
        activation_rate=activation_rate,
        active_referrals=active_referrals,
        total_earnings_usdt=round(total_earnings_usdt, 4),
        earnings_chart=earnings_chart
    )

@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_read_db)):
    from app.services.session_manager import SessionManager
    import json
    
    session_mgr = SessionManager()
    cache_key = "api:cache:leaderboard"
    
    # Try cache first if Redis is available
    if not SessionManager._use_memory and session_mgr.redis:
        try:
            cached_data = await session_mgr.redis.get(cache_key)
            if cached_data:
                return Response(content=cached_data, media_type="application/json")
        except Exception as e:
            print(f"Leaderboard Redis cache error: {e}")
            
    # Cache miss: fetch from DB
    top_users = await user_crud.get_top_users(db, limit=50)
    
    # Build data
    leaderboard_data = [
        {
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "photo_url": f"/api/v1/users/avatar/{user.telegram_id}" if user.photo_url else None,
            "elo": user.elo,
            "games_played": user.games_played,
            "win_rate": round((user.wins / user.games_played * 100) if user.games_played > 0 else 0),
            "rank": idx + 1
        }
        for idx, user in enumerate(top_users)
    ]
    
    # Serialize once
    json_data = json.dumps(leaderboard_data)
    
    # Store in cache with 5-minute TTL
    if not SessionManager._use_memory and session_mgr.redis:
        try:
            await session_mgr.redis.set(cache_key, json_data, ex=300)
        except Exception as e:
            print(f"Leaderboard Redis cache set error: {e}")
            
    return Response(content=json_data, media_type="application/json")

@router.get("/leaderboard/academy")
async def get_academy_leaderboard(db: AsyncSession = Depends(get_read_db)):
    from app.services.session_manager import SessionManager
    import json
    
    session_mgr = SessionManager()
    cache_key = "api:cache:leaderboard:academy"
    
    # Try cache first if Redis is available
    if not SessionManager._use_memory and session_mgr.redis:
        try:
            cached_data = await session_mgr.redis.get(cache_key)
            if cached_data:
                return Response(content=cached_data, media_type="application/json")
        except Exception as e:
            print(f"Academy Leaderboard Redis cache error: {e}")
            
    # Cache miss: fetch from DB
    result = await db.execute(
        select(User).order_by(User.xp.desc(), User.study_streak.desc()).limit(50)
    )
    top_users = result.scalars().all()
    
    # Build data
    leaderboard_data = [
        {
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "photo_url": f"/api/v1/users/avatar/{user.telegram_id}" if user.photo_url else None,
            "xp": user.xp,
            "study_streak": user.study_streak,
            "rank": idx + 1
        }
        for idx, user in enumerate(top_users)
    ]
    
    # Serialize once
    json_data = json.dumps(leaderboard_data)
    
    # Store in cache with 5-minute TTL
    if not SessionManager._use_memory and session_mgr.redis:
        try:
            await session_mgr.redis.set(cache_key, json_data, ex=300)
        except Exception as e:
            print(f"Academy Leaderboard Redis cache set error: {e}")
            
    return Response(content=json_data, media_type="application/json")

@router.get("/avatar/{telegram_id}")
async def get_user_avatar(telegram_id: int, request: Request):
    """
    Get user profile photo from local cache or fetch and cache it from Telegram Bot API.
    Does not require authentication (public resource).
    Supports ETag / If-None-Match for 304 Not Modified — eliminates re-downloads entirely.
    """
    import os
    import time
    import hashlib
    from fastapi.responses import FileResponse, Response
    avatar_dir = "static_avatars"
    os.makedirs(avatar_dir, exist_ok=True)
    file_path = os.path.join(avatar_dir, f"{telegram_id}.jpg")
    # Negative-cache sentinel: touched when Telegram confirms the user has no
    # profile photo, so we don't re-hit the Bot API on every render. Filesystem
    # based to match the positive cache above (both are per-instance and rebuild
    # cheaply after a redeploy).
    none_path = os.path.join(avatar_dir, f"{telegram_id}.none")

    CACHE_SECONDS = 604800  # 7 days — avatars rarely change
    NEGATIVE_CACHE_SECONDS = 3600  # 1 hour — how long a "no avatar" result sticks
    NOT_FOUND_BROWSER_SECONDS = 300  # 5 min — let clients cache the 404 briefly

    def _build_etag(path: str) -> str:
        """Generate a stable ETag from file mtime + size."""
        stat = os.stat(path)
        raw = f"{stat.st_mtime}-{stat.st_size}"
        return f'"{hashlib.md5(raw.encode()).hexdigest()}"'

    def _serve_cached(path: str) -> FileResponse | Response:
        etag = _build_etag(path)
        # 304 Not Modified — browser already has the latest copy
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            return Response(status_code=304, headers={
                "Cache-Control": f"public, max-age={CACHE_SECONDS}, immutable",
                "ETag": etag,
            })
        return FileResponse(path, media_type="image/jpeg", headers={
            "Cache-Control": f"public, max-age={CACHE_SECONDS}, immutable",
            "ETag": etag,
        })

    def _not_found() -> Response:
        # Cacheable 404 so a re-rendering client stops re-requesting a missing
        # avatar every frame. Short max-age keeps recovery quick once the user
        # sets a photo.
        return Response(status_code=404, headers={
            "Cache-Control": f"public, max-age={NOT_FOUND_BROWSER_SECONDS}",
        })

    def _mark_no_avatar() -> None:
        try:
            with open(none_path, "w"):
                pass
        except OSError:
            pass

    def _clear_no_avatar() -> None:
        try:
            os.remove(none_path)
        except OSError:
            pass

    # Fast path: serve cached version if it exists (regardless of age — ETag handles freshness)
    if os.path.exists(file_path):
        try:
            mtime = os.path.getmtime(file_path)
            # Only re-fetch from Telegram if file is older than 24 hours
            if time.time() - mtime < 86400:
                return _serve_cached(file_path)
        except Exception:
            pass

    # Negative cache: if we recently confirmed this user has no avatar, skip the
    # Telegram round-trip entirely. Serving a stale positive cache (if one somehow
    # exists) still wins over a 404.
    if os.path.exists(none_path):
        try:
            if time.time() - os.path.getmtime(none_path) < NEGATIVE_CACHE_SECONDS:
                if os.path.exists(file_path):
                    return _serve_cached(file_path)
                return _not_found()
        except OSError:
            pass

    # Slow path: fetch from Telegram Bot API and cache locally
    from app.services.telegram_bot import TelegramService
    if TelegramService.application and TelegramService.application.bot:
        bot = TelegramService.application.bot
        try:
            photos = await bot.get_user_profile_photos(telegram_id, limit=1)
            if photos.total_count > 0:
                file = await bot.get_file(photos.photos[0][-1].file_id)
                import httpx
                async with httpx.AsyncClient(timeout=10.0) as client:
                    res = await client.get(file.file_path)
                    if res.status_code == 200:
                        with open(file_path, "wb") as f:
                            f.write(res.content)
                        os.utime(file_path, None)
                        # Photo is back — drop any stale "no avatar" marker.
                        _clear_no_avatar()
                        return _serve_cached(file_path)
            else:
                # Telegram definitively reports no profile photo. Remember it so
                # every subsequent render doesn't re-hit the Bot API.
                _mark_no_avatar()
        except Exception as e:
            import logging
            from app.core.alerts import (
                is_benign_telegram_avatar_error,
                is_benign_telegram_file_error,
                is_transient_telegram_error,
            )
            # A momentary Telegram API outage (timeout / 502) OR a benign
            # "Wrong file_id or the file is temporarily unavailable" BadRequest
            # (Telegram briefly loses an avatar file_id it just handed us) are
            # both self-healing and covered by the stale-cache fallback below —
            # so they log at WARNING and must not page admins.
            if is_benign_telegram_avatar_error(e):
                _mark_no_avatar()
                logging.getLogger(__name__).warning(
                    f"Avatar unavailable for {telegram_id}: {e}"
                )
            elif is_transient_telegram_error(e) or is_benign_telegram_file_error(e):
                logging.getLogger(__name__).warning(f"Transient Telegram API error fetching avatar for {telegram_id}: {e}")
            else:
                logging.getLogger(__name__).error(f"Failed to fetch/cache avatar for {telegram_id}: {e}")

    # Fallback: serve stale cached file rather than returning 404
    if os.path.exists(file_path):
        return _serve_cached(file_path)

    return _not_found()

@router.get("/{telegram_id}", response_model=UserStats)
async def get_user_stats(
    telegram_id: int,
    db: AsyncSession = Depends(get_read_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user stats. Only accessible by the authenticated user themselves.
    """
    if current_user.telegram_id != telegram_id:
        raise HTTPException(status_code=403, detail="Forbidden: Access denied")
    
    # Calculate enhanced stats
    from app.services.user_stats import calculate_user_stats
    enhanced_stats = await calculate_user_stats(db, current_user, telegram_id)
    
    return UserStats(
        telegram_id=current_user.telegram_id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        photo_url=f"/api/v1/users/avatar/{current_user.telegram_id}" if current_user.photo_url else None,
        elo=current_user.elo,
        games_played=current_user.games_played,
        wins=current_user.wins,
        losses=current_user.losses,
        draws=current_user.draws,
        is_premium=current_user.is_premium_active,
        premium_tier=current_user.premium_tier,
        premium_expires_at=current_user.premium_expires_at,
        premium_billing_period=current_user.premium_billing_period,
        win_rate=enhanced_stats["win_rate"],
        loss_rate=enhanced_stats["loss_rate"],
        draw_rate=enhanced_stats["draw_rate"],
        global_rank=enhanced_stats["global_rank"],
        percentile=enhanced_stats["percentile"],
        total_score=enhanced_stats["total_score"],
        current_streak=CurrentStreak(**enhanced_stats["current_streak"]),
        best_streak=BestStreak(**enhanced_stats["best_streak"]),
        recent_games=[RecentGame(**game) for game in enhanced_stats["recent_games"]],
        referral_code=current_user.referral_code,
        xp=current_user.xp,
        level=current_user.level,
        bot_username=settings.TELEGRAM_BOT_USERNAME,
        region=current_user.region,
        # Coerce None (unrefreshed / pre-migration rows) to the opt-in default.
        arena_notifications=(
            current_user.arena_notifications if current_user.arena_notifications is not None else True
        ),
        has_stripe_subscription=bool(current_user.stripe_customer_id and current_user.stripe_subscription_id),
        study_streak=current_user.study_streak or 0,
        unlocked_items=current_user.unlocked_items,
        # None on unflushed instances (column default applies at INSERT).
        xp_multiplier=current_user.xp_multiplier or 1.0,
        multiplier_expires_at=current_user.multiplier_expires_at,
    )

@router.post("/sync", response_model=UserStats, dependencies=[Depends(ip_rate_limit(limit=10, window=60))])
async def sync_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync current user profile. 
    The user is automatically created/retrieved by the get_current_user dependency 
    which validates the X-Telegram-Init-Data header.
    """
    # Run self-healing zombie wager routine on app launch sync
    import logging
    try:
        from app.services.game_service import GameService
        await GameService().heal_zombie_wagers(db, current_user.telegram_id)
        # Refresh current_user to ensure we have the latest balance and state
        await db.refresh(current_user)
    except Exception as e:
        logging.getLogger(__name__).error(f"Error in heal_zombie_wagers on sync: {e}")



    # Calculate enhanced stats
    from app.services.user_stats import calculate_user_stats
    enhanced_stats = await calculate_user_stats(db, current_user, current_user.telegram_id)
    
    return UserStats(
        telegram_id=current_user.telegram_id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        photo_url=f"/api/v1/users/avatar/{current_user.telegram_id}" if current_user.photo_url else None,
        elo=current_user.elo,
        games_played=current_user.games_played,
        wins=current_user.wins,
        losses=current_user.losses,
        draws=current_user.draws,
        is_premium=current_user.is_premium_active,
        premium_tier=current_user.premium_tier,
        premium_expires_at=current_user.premium_expires_at,
        premium_billing_period=current_user.premium_billing_period,
        win_rate=enhanced_stats["win_rate"],
        loss_rate=enhanced_stats["loss_rate"],
        draw_rate=enhanced_stats["draw_rate"],
        global_rank=enhanced_stats["global_rank"],
        percentile=enhanced_stats["percentile"],
        total_score=enhanced_stats["total_score"],
        current_streak=CurrentStreak(**enhanced_stats["current_streak"]),
        best_streak=BestStreak(**enhanced_stats["best_streak"]),
        recent_games=[RecentGame(**game) for game in enhanced_stats["recent_games"]],
        referral_code=current_user.referral_code,
        xp=current_user.xp,
        level=current_user.level,
        bot_username=settings.TELEGRAM_BOT_USERNAME,
        region=current_user.region,
        # Coerce None (unrefreshed / pre-migration rows) to the opt-in default.
        arena_notifications=(
            current_user.arena_notifications if current_user.arena_notifications is not None else True
        ),
        has_stripe_subscription=bool(current_user.stripe_customer_id and current_user.stripe_subscription_id),
        study_streak=current_user.study_streak or 0,
        unlocked_items=current_user.unlocked_items,
        # None on unflushed instances (column default applies at INSERT).
        xp_multiplier=current_user.xp_multiplier or 1.0,
        multiplier_expires_at=current_user.multiplier_expires_at,
    )



class WalletLinkRequest(BaseModel):
    telegram_id: int
    wallet_address: str

@router.post("/wallet")
async def link_wallet(
    request: WalletLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.telegram_id != request.telegram_id:
        raise HTTPException(status_code=403, detail="Forbidden: Cannot link wallet for another user")
        
    try:
        updated_user = await user_crud.update_wallet_address(db, current_user, request.wallet_address)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "success", "wallet_address": updated_user.wallet_address}

class SubscriptionRequest(BaseModel):
    tier: str
    billing_period: str = "monthly"  # "monthly" or "annual"

@router.post("/subscribe")
async def subscribe_user(
    request: SubscriptionRequest, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Purchase or upgrade a subscription using platform balance.
    Handles three scenarios:
      1. New subscription
      2. Upgrade: monthly → annual (prorated: unused monthly days credited toward annual price)
      3. Extension: same plan, adds more days
    """
    from datetime import timedelta
    from app.models.transaction import Transaction

    tier = request.tier.lower()
    if tier != "premium":
        raise HTTPException(status_code=400, detail="Only 'premium' subscription tier is supported")

    period = request.billing_period.lower()
    if period not in ("monthly", "annual"):
        period = "monthly"

    MONTHLY_PRICE = 2900   # $29.00
    ANNUAL_PRICE  = 29580  # $295.80

    price = ANNUAL_PRICE if period == "annual" else MONTHLY_PRICE

    # Row-level lock to prevent race conditions
    locked_user = await user_crud.get_user_by_telegram_id(db, current_user.telegram_id, for_update=True)
    if not locked_user:
        raise HTTPException(status_code=404, detail="User not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    is_active = locked_user.is_premium_active and locked_user.premium_expires_at
    current_period = locked_user.premium_billing_period  # "monthly", "annual", or None

    # ── Upgrade: monthly → annual ───────────────────────────────────────────
    upgrade_credit = 0
    if is_active and current_period == "monthly" and period == "annual":
        # Credit unused days from remaining monthly period (fair proration)
        remaining_seconds = max((locked_user.premium_expires_at - now).total_seconds(), 0)
        remaining_days = remaining_seconds / 86400
        daily_rate = MONTHLY_PRICE / 30
        upgrade_credit = int(remaining_days * daily_rate)  # cents to credit back
        price = max(ANNUAL_PRICE - upgrade_credit, 0)

    # ── Block same-plan re-purchase (Stripe users should use portal) ───────
    elif is_active and current_period == period and locked_user.stripe_subscription_id:
        raise HTTPException(
            status_code=400,
            detail="You already have an active Stripe subscription on this plan. Use 'Manage Subscription' to change it."
        )

    if locked_user.balance < price:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Required: ${price/100:.2f} USD"
        )

    locked_user.balance -= price
    db.add(locked_user)

    # Log the transaction (include upgrade credit note if applicable)
    tx_note = f"upgrade_monthly_to_annual_credit_{upgrade_credit}" if upgrade_credit else f"sub_{tier}_{period}"
    tx = Transaction(
        user_id=locked_user.telegram_id,
        type="subscription",
        amount=-price,
        fee=0,
        status="completed",
        reference_id=f"{tx_note}_{int(now.timestamp())}"
    )
    db.add(tx)

    # ── Calculate new expiry ────────────────────────────────────────────────
    days = 365 if period == "annual" else 30
    if is_active and current_period == "monthly" and period == "annual":
        # Upgrade: start annual from NOW (unused monthly already credited via price reduction)
        expires_at = now + timedelta(days=days)
    elif is_active and locked_user.premium_expires_at:
        # Extension / same plan: accumulate days
        expires_at = locked_user.premium_expires_at + timedelta(days=days)
    else:
        expires_at = now + timedelta(days=days)

    updated_user = await user_crud.update_subscription(
        db, locked_user, "premium", expires_at, billing_period=period
    )

    # Telegram notification
    try:
        from app.services.telegram_bot import TelegramService
        await TelegramService.send_premium_welcome(
            user_id=locked_user.telegram_id,
            first_name=locked_user.first_name,
            expires_at=expires_at,
            lang=locked_user.preferred_language
        )
    except Exception as notify_err:
        logger.warning(f"Failed to send Telegram premium welcome: {notify_err}")

    # Distribute referral commissions on the net charged price
    from app.services.referral_commission_service import ReferralCommissionService
    await ReferralCommissionService.distribute_subscription_commissions(db, locked_user.id, price)
    await db.commit()

    action = "upgraded" if upgrade_credit else "subscribed"
    return {
        "status": "success",
        "tier": updated_user.premium_tier,
        "billing_period": period,
        "action": action,
        "upgrade_credit_cents": upgrade_credit,
        "charged_cents": price,
        "expires_at": expires_at.isoformat(),
    }

