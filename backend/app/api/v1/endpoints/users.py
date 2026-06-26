from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.crud import user as user_crud
from pydantic import BaseModel
from app.models.user import User
from app.api.v1.deps import get_current_user
from app.core.config import get_settings

settings = get_settings()

router = APIRouter()

from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

class LeaderboardItem(BaseModel):
    telegram_id: int
    first_name: str
    last_name: Optional[str] = None
    photo_url: Optional[str] = None
    elo: int
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

class ReferralEarningPoint(BaseModel):
    date: str   # ISO date string e.g. "2025-06-10"
    amount: float  # In USDT (cents / 100)

class ReferralStats(BaseModel):
    total_referrals: int
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
    - active_referrals: referrals who played at least 1 game in the last 7 days
    - total_earnings_usdt: cumulative referral commission received (USDT)
    - earnings_chart: daily referral earnings for the last 30 days (for SVG chart)
    """
    from app.models.gamification import Referral
    from app.models.transaction import Transaction
    from sqlalchemy import func

    # 1. Total referrals
    total_result = await db.execute(
        select(func.count(Referral.id)).where(Referral.referrer_id == current_user.id)
    )
    total_referrals = total_result.scalar() or 0

    # 2. Active referrals: referred users who played >= 1 game in the last 7 days
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

    # 3. Total earnings from referral commissions
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

    # 4. Daily earnings for last 30 days (for chart)
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
        active_referrals=active_referrals,
        total_earnings_usdt=round(total_earnings_usdt, 4),
        earnings_chart=earnings_chart
    )

@router.get("/leaderboard", response_model=List[LeaderboardItem])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    top_users = await user_crud.get_top_users(db, limit=50)
    
    # Return leaderboard data
    return [
        LeaderboardItem(
            telegram_id=user.telegram_id,
            first_name=user.first_name,
            last_name=user.last_name,
            photo_url=f"/api/v1/users/avatar/{user.telegram_id}" if user.photo_url else None,
            elo=user.elo,
            rank=idx + 1
        )
        for idx, user in enumerate(top_users)
    ]

@router.get("/avatar/{telegram_id}")
async def get_user_avatar(telegram_id: int):
    """
    Get user profile photo from local cache or fetch and cache it from Telegram Bot API.
    Does not require authentication (public resource).
    """
    import os
    from fastapi.responses import FileResponse
    avatar_dir = "static_avatars"
    os.makedirs(avatar_dir, exist_ok=True)
    file_path = os.path.join(avatar_dir, f"{telegram_id}.jpg")
    
    # Serve cached version if exists
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})
        
    # Fetch from Telegram Bot API
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
                        return FileResponse(file_path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to fetch/cache avatar in endpoint for {telegram_id}: {e}")
            
    raise HTTPException(status_code=404, detail="Avatar not found")

@router.get("/{telegram_id}", response_model=UserStats)
async def get_user_stats(
    telegram_id: int,
    db: AsyncSession = Depends(get_db),
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
        bot_username=settings.TELEGRAM_BOT_USERNAME
    )

@router.post("/sync", response_model=UserStats)
async def sync_user(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync current user profile. 
    The user is automatically created/retrieved by the get_current_user dependency 
    which validates the X-Telegram-Init-Data header.
    """
    # Refresh photo URL dynamically from Telegram Bot API on sync (as URLs expire after 1 hour)
    try:
        from app.services.telegram_bot import TelegramService
        if TelegramService.application and TelegramService.application.bot:
            photo_url = await TelegramService.get_user_profile_photo(current_user.telegram_id, TelegramService.application.bot)
            if photo_url and current_user.photo_url != photo_url:
                current_user.photo_url = photo_url
                db.add(current_user)
                await db.commit()
                await db.refresh(current_user)
    except Exception:
        pass

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
        bot_username=settings.TELEGRAM_BOT_USERNAME
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
        
    updated_user = await user_crud.update_wallet_address(db, current_user, request.wallet_address)
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
    Purchase subscription using platform balance.
    Authorized user only.
    """
    from datetime import timedelta
    from app.models.transaction import Transaction

    # Enforce premium tier and calculate price
    tier = request.tier.lower()
    if tier != "premium":
        raise HTTPException(status_code=400, detail="Only 'premium' subscription tier is supported")
        
    period = request.billing_period.lower()
    if period == "annual":
        price = 29580  # $295.80 USDT (15% discount on 12 months)
    else:
        period = "monthly"
        price = 2900   # $29.00 USDT

    # Re-fetch with a row-level write lock to guard against concurrent subscription requests
    locked_user = await user_crud.get_user_by_telegram_id(db, current_user.telegram_id, for_update=True)
    if not locked_user:
        raise HTTPException(status_code=404, detail="User not found")

    if locked_user.balance < price:
        raise HTTPException(
            status_code=400,
            detail="Insufficient balance for premium subscription"
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    locked_user.balance -= price
    db.add(locked_user)

    # Log Transaction
    tx = Transaction(
        user_id=locked_user.telegram_id,
        type="subscription",
        amount=-price,
        fee=0,
        status="completed",
        reference_id=f"sub_{tier}_{period}_{int(now.timestamp())}"
    )
    db.add(tx)

    # Calculate expiration duration based on billing period (accumulative)
    days = 365 if period == "annual" else 30
    if locked_user.is_premium_active and locked_user.premium_expires_at:
        expires_at = locked_user.premium_expires_at + timedelta(days=days)
    else:
        expires_at = now + timedelta(days=days)

    updated_user = await user_crud.update_subscription(db, locked_user, "premium", expires_at)

    
    # Send Premium welcome notification to the subscriber
    from app.services.telegram_bot import TelegramService
    await TelegramService.send_premium_welcome(
        user_id=locked_user.telegram_id,
        first_name=locked_user.first_name,
        expires_at=expires_at,
        lang=locked_user.preferred_language
    )
    
    # Distribute subscription purchase commission across referrers
    from app.services.referral_commission_service import ReferralCommissionService
    await ReferralCommissionService.distribute_subscription_commissions(db, locked_user.id, price)
    await db.commit()
    
    return {"status": "success", "tier": updated_user.premium_tier}
