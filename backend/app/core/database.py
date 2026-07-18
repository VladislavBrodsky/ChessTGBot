import logging

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Use settings directly
DATABASE_URL = settings.DATABASE_URL

# Fix for Heroku/Railway style URLs which often omit the driver
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

is_sqlite = DATABASE_URL.startswith("sqlite")
if is_sqlite:
    engine = create_async_engine(DATABASE_URL, echo=False)
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=30,
        pool_recycle=1800,
        pool_pre_ping=True
    )
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Read-only database replica configuration
DATABASE_READ_URL = settings.DATABASE_READ_URL or DATABASE_URL
if DATABASE_READ_URL.startswith("postgresql://"):
    DATABASE_READ_URL = DATABASE_READ_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if DATABASE_READ_URL == DATABASE_URL:
    read_engine = engine
    AsyncReadSessionLocal = AsyncSessionLocal
else:
    is_read_sqlite = DATABASE_READ_URL.startswith("sqlite")
    if is_read_sqlite:
        read_engine = create_async_engine(DATABASE_READ_URL, echo=False)
    else:
        read_engine = create_async_engine(
            DATABASE_READ_URL,
            echo=False,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=30,
            pool_recycle=1800,
            pool_pre_ping=True
        )
    AsyncReadSessionLocal = async_sessionmaker(read_engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def get_read_db():
    async with AsyncReadSessionLocal() as session:
        yield session

async def init_db():
    # Import models here to avoid circular import with Base
    from app.models.gamification import Task, TaskType
    from app.models.broadcast import Broadcast  # noqa: F401 — registers table with Base
    from app.models.telemetry import TelemetryDailyRollup, TelemetryLog  # noqa: F401
    
    is_sqlite = engine.url.drivername.startswith("sqlite")
    if is_sqlite:
        async with engine.begin() as conn:
            # In a fully migrated environment, we should only use Alembic.
            # However, for the first run or dev, we can keep create_all if needed,
            # but the goal is to move to Alembic exclusively.
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database schema: tables verified via SQLite Base metadata.")
    else:
        logger.info("Database schema: skipping create_all on PostgreSQL (managed by Alembic).")

    # Seed default tasks & achievements idempotently by ID
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
            Task(id=1, title_key="daily_win", description_key="Win a chess match today", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=True, icon="trophy"),
            Task(id=2, title_key="daily_play", description_key="Play 3 chess matches", xp_reward=30, task_type=TaskType.PLAY, target_count=3, is_daily=True, icon="gamepad"),
            Task(id=3, title_key="daily_login", description_key="Login to the app", xp_reward=10, task_type=TaskType.LOGIN, target_count=1, is_daily=True, icon="sync"),
            # Rewards choosing a human opponent over the AI — deliberately the
            # richest daily task, since PvP liquidity is the platform's scarcest
            # resource. Progress ticks in game_service settle for PvP games only.
            Task(id=4, title_key="daily_play_human", description_key="Play a match against a human opponent", xp_reward=60, task_type=TaskType.PLAY_HUMAN, target_count=1, is_daily=True, icon="users"),
            Task(id=101, title_key="ach_first_win", description_key="First Blood: Win your first chess match", xp_reward=50, task_type=TaskType.WIN, target_count=1, is_daily=False, icon="award"),
            Task(id=102, title_key="ach_win_10", description_key="Novice Victor: Win 10 chess matches", xp_reward=150, task_type=TaskType.WIN, target_count=10, is_daily=False, icon="shield"),
            Task(id=103, title_key="ach_play_25", description_key="Chess Enthusiast: Play 25 chess matches", xp_reward=250, task_type=TaskType.PLAY, target_count=25, is_daily=False, icon="book"),
            Task(id=104, title_key="ach_refer_5", description_key="Network Builder: Invite 5 friends to FinChess", xp_reward=1000, task_type=TaskType.REFER, target_count=5, is_daily=False, icon="users"),
            Task(id=105, title_key="ach_refer_1", description_key="First Blood: Invite 1 friend to FinChess", xp_reward=200, task_type=TaskType.REFER, target_count=1, is_daily=False, icon="users"),
            Task(id=106, title_key="ach_refer_3", description_key="Socializer: Invite 3 friends to FinChess", xp_reward=500, task_type=TaskType.REFER, target_count=3, is_daily=False, icon="users"),
            Task(id=107, title_key="ach_refer_10", description_key="Network Titan: Invite 10 friends to FinChess", xp_reward=2000, task_type=TaskType.REFER, target_count=10, is_daily=False, icon="users"),
            Task(id=108, title_key="ach_refer_25", description_key="Viral Master: Invite 25 friends to FinChess", xp_reward=5000, task_type=TaskType.REFER, target_count=25, is_daily=False, icon="users"),
            Task(id=109, title_key="ach_win_50", description_key="Champion: Win 50 chess matches", xp_reward=1000, task_type=TaskType.WIN, target_count=50, is_daily=False, icon="crown"),
            Task(id=110, title_key="ach_play_100", description_key="Grandmaster: Play 100 chess matches", xp_reward=1500, task_type=TaskType.PLAY, target_count=100, is_daily=False, icon="star"),
            Task(id=201, title_key="join_channel", description_key="Subscribe to official channel @chess_hub", xp_reward=150, task_type=TaskType.LOGIN, target_count=1, is_daily=False, icon="telegram"),
            Task(id=202, title_key="join_chat", description_key="Subscribe to official chat @chesshub_chat", xp_reward=150, task_type=TaskType.LOGIN, target_count=1, is_daily=False, icon="telegram"),
            Task(id=203, title_key="add_to_home_screen", description_key="Add App to your Home Screen", xp_reward=150, task_type=TaskType.LOGIN, target_count=1, is_daily=False, icon="home")
        ]
        
        seeded = 0
        for task in default_tasks:
            result = await session.execute(select(Task).where(Task.id == task.id))
            if not result.scalars().first():
                session.add(task)
                seeded += 1
                
        if seeded > 0:
            await session.commit()
            logger.info(
                "Database seeding: %s default tasks/achievements seeded successfully.",
                seeded,
            )
