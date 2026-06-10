from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from pydantic import BaseModel
from app.models.user import User
from app.api.v1.deps import get_current_user

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
    premium_tier: Optional[str]
    premium_expires_at: Optional[datetime]
    
    # Enhanced stats (Phase 1)
    win_rate: float
    current_streak: CurrentStreak
    best_streak: BestStreak
    recent_games: List[RecentGame]
    referral_code: Optional[str] = None
    xp: int = 0
    level: int = 1

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
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    username: Optional[str] = None,
    photo_url: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get user stats. Auto-registers user if they do not exist and first_name is provided.
    Also synchronizes any updated profile fields (name, username, photo) on-the-fly.
    """
    user = await user_crud.get_user_by_telegram_id(db, telegram_id)
    if not user:
        if first_name:
            user = await user_crud.create_user(
                db,
                telegram_id=telegram_id,
                first_name=first_name,
                last_name=last_name,
                username=username,
                photo_url=photo_url
            )
        else:
            raise HTTPException(status_code=404, detail="User not found")
    else:
        # Sync profile information if provided and different
        updated = False
        if first_name and user.first_name != first_name:
            user.first_name = first_name
            updated = True
        if last_name and user.last_name != last_name:
            user.last_name = last_name
            updated = True
        if username and user.username != username:
            user.username = username
            updated = True
        if photo_url and user.photo_url != photo_url:
            user.photo_url = photo_url
            updated = True
        if updated:
            db.add(user)
            await db.commit()
            await db.refresh(user)
    
    # Calculate enhanced stats
    from app.services.user_stats import calculate_user_stats
    enhanced_stats = await calculate_user_stats(db, user, telegram_id)
    
    return UserStats(
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        photo_url=user.photo_url,
        elo=user.elo,
        games_played=user.games_played,
        wins=user.wins,
        losses=user.losses,
        draws=user.draws,
        is_premium=user.is_premium,
        premium_tier=user.premium_tier,
        premium_expires_at=user.premium_expires_at,
        win_rate=enhanced_stats["win_rate"],
        current_streak=CurrentStreak(**enhanced_stats["current_streak"]),
        best_streak=BestStreak(**enhanced_stats["best_streak"]),
        recent_games=[RecentGame(**game) for game in enhanced_stats["recent_games"]],
        referral_code=user.referral_code,
        xp=user.xp,
        level=user.level
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
        current_streak=CurrentStreak(**enhanced_stats["current_streak"]),
        best_streak=BestStreak(**enhanced_stats["best_streak"]),
        recent_games=[RecentGame(**game) for game in enhanced_stats["recent_games"]],
        referral_code=current_user.referral_code,
        xp=current_user.xp,
        level=current_user.level
    )



class WalletLinkRequest(BaseModel):
    telegram_id: int
    wallet_address: str

@router.post("/wallet")
async def link_wallet(request: WalletLinkRequest, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_telegram_id(db, request.telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    updated_user = await user_crud.update_wallet_address(db, user, request.wallet_address)
    return {"status": "success", "wallet_address": updated_user.wallet_address}

class SubscriptionRequest(BaseModel):
    tier: str

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

    # Map tier pricing (in cents)
    tier_pricing = {
        "basic": 50,
        "premium": 120,
        "premium_plus": 250
    }
    price = tier_pricing.get(request.tier.lower(), 50)
    
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
        reference_id=f"sub_{request.tier.lower()}_{int(datetime.utcnow().timestamp())}"
    )
    db.add(tx)

    expires_at = datetime.utcnow() + timedelta(days=30)
    updated_user = await user_crud.update_subscription(db, current_user, request.tier, expires_at)
    return {"status": "success", "tier": updated_user.premium_tier}
