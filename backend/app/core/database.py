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
    from app.models.gamification import Task, UserTask, Referral
    from sqlalchemy import text
    
    async with engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)
        
        # Hot Patch: Ensure new columns exist (Self-healing schema)
        try:
            # Subscription
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_tier VARCHAR"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITHOUT TIME ZONE"))
            
            # Gamification
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS xp BIGINT DEFAULT 0"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'en'"))
            
            # Create indexes/constraints potentially if missing (simplified here)
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_referral_code ON users (referral_code)"))
            
            print("Database Schema Sync: Columns verified.")
        except Exception as e:
            print(f"Database Schema Sync Warning: {e}")
