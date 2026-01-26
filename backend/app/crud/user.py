from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from datetime import datetime

async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int):
    result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
    return result.scalars().first()

async def create_user(db: AsyncSession, telegram_id: int, first_name: str, last_name: str = None, username: str = None, photo_url: str = None):
    db_user = User(
        telegram_id=telegram_id,
        first_name=first_name,
        last_name=last_name,
        username=username,
        photo_url=photo_url,
        elo=1000,
        is_premium=False
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def update_subscription(db: AsyncSession, user: User, tier: str, expires_at: datetime = None):
    user.is_premium = True
    user.premium_tier = tier
    user.premium_expires_at = expires_at
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_elo(db: AsyncSession, user: User, new_elo: int, result: str):
    """
    result: 'win', 'loss', 'draw'
    """
    user.elo = new_elo
    user.games_played += 1
    if result == 'win':
        user.wins += 1
    elif result == 'loss':
        user.losses += 1
    elif result == 'draw':
        user.draws += 1
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def get_top_users(db: AsyncSession, limit: int = 50):
    result = await db.execute(
        select(User)
        .order_by(User.elo.desc())
        .limit(limit)
    )
    return result.scalars().all()
