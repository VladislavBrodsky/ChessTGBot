from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.crud import user as user_crud
from pydantic import BaseModel

router = APIRouter()

class UserStats(BaseModel):
    telegram_id: int
    first_name: str
    elo: int
    games_played: int
    wins: int
    losses: int
    draws: int

@router.get("/{telegram_id}", response_model=UserStats)
async def get_user_stats(telegram_id: int, db: AsyncSession = Depends(get_db)):
    user = await user_crud.get_user_by_telegram_id(db, telegram_id)
    if not user:
        # Create default user if not exists (auto-register on first fetch)
        user = await user_crud.create_user(db, telegram_id, f"User_{telegram_id}")
    
    return UserStats(
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        elo=user.elo,
        games_played=user.games_played,
        wins=user.wins,
        losses=user.losses,
        draws=user.draws
    )
