from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

# Default to localhost if not set, but respect env var
DATABASE_URL = getattr(settings, "DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost/chess_db")

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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
