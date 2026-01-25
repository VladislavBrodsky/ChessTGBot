from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from pydantic import BaseModel

router = APIRouter()

from typing import Optional, List, Dict, Any
from datetime import datetime

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

@router.get("/{telegram_id}", response_model=UserStats)
async def get_user_stats(telegram_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_telegram_id(db, telegram_id)
    if not user:
        # Create default user if not exists (auto-register on first fetch)
        user = await user_crud.create_user(db, telegram_id, f"User_{telegram_id}")
    
    # Calculate enhanced stats
    from app.services.user_stats import calculate_user_stats
    enhanced_stats = await calculate_user_stats(db, user, telegram_id)
    
    return UserStats(
        telegram_id=user.telegram_id,
        first_name=user.first_name,
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
        recent_games=[RecentGame(**game) for game in enhanced_stats["recent_games"]]
    )

class SubscriptionRequest(BaseModel):
    telegram_id: int
    tier: str

@router.post("/subscribe")
async def subscribe_user(request: SubscriptionRequest, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_telegram_id(db, request.telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Mock subscription logic: set it to expire in 30 days
    # In a real app, this would be called after a successful payment callback
    from datetime import timedelta
    expires_at = datetime.utcnow() + timedelta(days=30)
    
    updated_user = await user_crud.update_subscription(db, user, request.tier, expires_at)
    return {"status": "success", "tier": updated_user.premium_tier}
