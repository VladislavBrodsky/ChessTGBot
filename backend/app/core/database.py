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
    from sqlalchemy import text
    
    async with engine.begin() as conn:
        # Create tables if not exist
        await conn.run_sync(Base.metadata.create_all)
        
        # Hot Patch: Ensure new columns exist (Self-healing schema)
        # This is a robust way to handle model updates without heavy Alembic in small projects
        try:
            # Check if premium columns exist, add if missing
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_tier VARCHAR"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITHOUT TIME ZONE"))
            print("Database Schema Sync: Premium columns verified.")
        except Exception as e:
            print(f"Database Schema Sync Warning: {e}")
