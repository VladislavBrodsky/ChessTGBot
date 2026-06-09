from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# Use settings directly
DATABASE_URL = settings.DATABASE_URL

# Fix for Heroku/Railway style URLs which often omit the driver
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    # Import models here to avoid circular import with Base
    from app.models.user import User
    from app.models.game_history import GameHistory
    from app.models.gamification import Task, UserTask, Referral, TaskType
    from app.models.transaction import Transaction
    
    async with engine.begin() as conn:
        # In a fully migrated environment, we should only use Alembic.
        # However, for the first run or dev, we can keep create_all if needed,
        # but the goal is to move to Alembic exclusively.
        await conn.run_sync(Base.metadata.create_all)
        print("Database Schema: Tables verified via Base metadata.")

    # Seed default tasks if empty
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(Task))
        existing_tasks = result.scalars().all()
        if not existing_tasks:
            default_tasks = [
                Task(id=1, title_key="daily_win", description_key="Win a chess match today", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=True, icon="trophy"),
                Task(id=2, title_key="daily_play", description_key="Play 3 chess matches", xp_reward=30, task_type=TaskType.PLAY, target_count=3, is_daily=True, icon="gamepad"),
                Task(id=3, title_key="daily_login", description_key="Login to the app", xp_reward=10, task_type=TaskType.LOGIN, target_count=1, is_daily=True, icon="sync")
            ]
            session.add_all(default_tasks)
            await session.commit()
            print("Database Seeding: Default daily tasks seeded successfully.")
