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
    from app.models.gamification import Task, UserTask, Referral, TaskType, SolvedPuzzle
    from app.models.transaction import Transaction
    from app.models.xp_transaction import XpTransaction
    
    async with engine.begin() as conn:
        # In a fully migrated environment, we should only use Alembic.
        # However, for the first run or dev, we can keep create_all if needed,
        # but the goal is to move to Alembic exclusively.
        await conn.run_sync(Base.metadata.create_all)
        print("Database Schema: Tables verified via Base metadata.")

    # Seed default tasks & achievements idempotently by ID
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        default_tasks = [
            Task(id=1, title_key="daily_win", description_key="Win a chess match today", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=True, icon="trophy"),
            Task(id=2, title_key="daily_play", description_key="Play 3 chess matches", xp_reward=30, task_type=TaskType.PLAY, target_count=3, is_daily=True, icon="gamepad"),
            Task(id=3, title_key="daily_login", description_key="Login to the app", xp_reward=10, task_type=TaskType.LOGIN, target_count=1, is_daily=True, icon="sync"),
            Task(id=101, title_key="ach_first_win", description_key="First Blood: Win your first chess match", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=False, icon="award"),
            Task(id=102, title_key="ach_win_10", description_key="Novice Victor: Win 10 chess matches", xp_reward=150, task_type=TaskType.WIN, target_count=10, is_daily=False, icon="shield"),
            Task(id=103, title_key="ach_play_25", description_key="Chess Enthusiast: Play 25 chess matches", xp_reward=250, task_type=TaskType.PLAY, target_count=25, is_daily=False, icon="book"),
            Task(id=104, title_key="ach_refer_5", description_key="Network Builder: Invite 5 friends to FinChess", xp_reward=500, task_type=TaskType.REFER, target_count=5, is_daily=False, icon="users"),
            Task(id=201, title_key="join_channel", description_key="Subscribe to official channel @chess_hub", xp_reward=150, task_type=TaskType.LOGIN, target_count=1, is_daily=False, icon="telegram"),
            Task(id=202, title_key="join_chat", description_key="Subscribe to official chat @chesshub_chat", xp_reward=150, task_type=TaskType.LOGIN, target_count=1, is_daily=False, icon="telegram")
        ]
        
        seeded = 0
        for task in default_tasks:
            result = await session.execute(select(Task).where(Task.id == task.id))
            if not result.scalars().first():
                session.add(task)
                seeded += 1
                
        if seeded > 0:
            await session.commit()
            print(f"Database Seeding: {seeded} default tasks/achievements seeded successfully.")
