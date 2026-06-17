from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from pydantic import BaseModel
from app.models.user import User
from app.api.v1.deps import get_current_user
from app.core.config import get_settings

settings = get_settings()

router = APIRouter()

from typing import Optional, List, Dict, Any
from datetime import datetime

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

@router.get("/leaderboard", response_model=List[LeaderboardItem])
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    top_users = await user_crud.get_top_users(db, limit=50)
    
    # Return leaderboard data
    return [
        LeaderboardItem(
            telegram_id=user.telegram_id,
            first_name=user.first_name,
            last_name=user.last_name,
            photo_url=user.photo_url,
            elo=user.elo,
            rank=idx + 1
        )
        for idx, user in enumerate(top_users)
    ]

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
        photo_url=current_user.photo_url,
        elo=current_user.elo,
        games_played=current_user.games_played,
        wins=current_user.wins,
        losses=current_user.losses,
        draws=current_user.draws,
        is_premium=current_user.is_premium,
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
        photo_url=current_user.photo_url,
        elo=current_user.elo,
        games_played=current_user.games_played,
        wins=current_user.wins,
        losses=current_user.losses,
        draws=current_user.draws,
        is_premium=current_user.is_premium,
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

    # Map tier pricing (in cents) for monthly and annual
    pricing_matrix = {
        "monthly": {
            "basic": 50,
            "premium": 120,
            "premium_plus": 250
        },
        "annual": {
            "basic": 500,
            "premium": 1200,
            "premium_plus": 2500
        }
    }
    
    period = request.billing_period.lower()
    if period not in pricing_matrix:
        period = "monthly"
        
    tier = request.tier.lower()
    price = pricing_matrix[period].get(tier, 50)
    
    if current_user.balance < price:
        raise HTTPException(
            status_code=400, 
            detail="Insufficient balance for premium subscription"
        )
        
    current_user.balance -= price
    db.add(current_user)

    # Log Transaction
    tx = Transaction(
        user_id=current_user.telegram_id,
        type="subscription",
        amount=-price,
        fee=0,
        status="completed",
        reference_id=f"sub_{tier}_{period}_{int(datetime.utcnow().timestamp())}"
    )
    db.add(tx)

    # Calculate expiration duration based on billing period
    days = 365 if period == "annual" else 30
    expires_at = datetime.utcnow() + timedelta(days=days)
    
    updated_user = await user_crud.update_subscription(db, current_user, request.tier, expires_at)
    return {"status": "success", "tier": updated_user.premium_tier}
