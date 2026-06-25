from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.user import User
from datetime import datetime

async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int, for_update: bool = False):
    query = select(User).filter(User.telegram_id == telegram_id)
    if for_update:
        query = query.with_for_update()
    result = await db.execute(query)
    return result.scalars().first()

async def create_user(db: AsyncSession, telegram_id: int, first_name: str, last_name: str = None, username: str = None, photo_url: str = None):
    from app.services.gamification_service import GamificationService
    ref_code = await GamificationService.generate_referral_code(db)
    db_user = User(
        telegram_id=telegram_id,
        first_name=first_name,
        last_name=last_name,
        username=username,
        photo_url=photo_url,
        elo=1000,
        is_premium=False,
        referral_code=ref_code
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def update_subscription(db: AsyncSession, user: User, tier: str, expires_at: datetime = None):
    user.is_premium = True
    user.premium_tier = tier
    user.premium_expires_at = expires_at
    user.premium_warning_sent = 0
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def update_elo(db: AsyncSession, user: User, new_elo: int, result: str, commit: bool = True):
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
    if commit:
        await db.commit()
        await db.refresh(user)
    else:
        await db.flush()
        await db.refresh(user)
    return user

async def update_wallet_address(db: AsyncSession, user: User, wallet_address: str):
    user.wallet_address = wallet_address
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

async def update_balance(db: AsyncSession, user: User, amount: int):
    """
    amount: Positive for deposits/wins, negative for wagers/withdrawals (in cents)
    """
    user.balance += amount
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

async def atomic_credit(db: AsyncSession, telegram_id: int, amount: int, commit: bool = True) -> User:
    """
    Atomically credit a user's balance using SQL-level UPDATE.
    Always succeeds (amount must be positive).
    Returns the refreshed User object.
    """
    if amount <= 0:
        raise ValueError("Credit amount must be positive")

    stmt = (
        update(User)
        .where(User.telegram_id == telegram_id)
        .values(balance=User.balance + amount)
    )
    await db.execute(stmt)
    if commit:
        await db.commit()

    # Re-fetch user with updated balance
    result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
    return result.scalars().first()

async def atomic_debit(db: AsyncSession, telegram_id: int, amount: int, commit: bool = True) -> User | None:
    """
    Atomically debit a user's balance using SQL-level UPDATE with a WHERE guard.
    The WHERE clause ensures balance >= amount, preventing negative balances
    and eliminating race conditions from concurrent requests.

    Returns the refreshed User object on success, or None if insufficient funds.
    """
    if amount <= 0:
        raise ValueError("Debit amount must be positive")

    stmt = (
        update(User)
        .where(User.telegram_id == telegram_id, User.balance >= amount)
        .values(balance=User.balance - amount)
    )
    result = await db.execute(stmt)
    if commit:
        await db.commit()

    if result.rowcount == 0:
        # No rows updated — insufficient balance
        return None

    # Re-fetch user with updated balance
    user_result = await db.execute(select(User).filter(User.telegram_id == telegram_id))
    return user_result.scalars().first()
