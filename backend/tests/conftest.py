import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.database import Base, get_db
from app.main import app
from app.core.config import get_settings
from app.models.user import User

settings = get_settings()

# Use a test database
TEST_DATABASE_URL = settings.DATABASE_URL + "_test"
if TEST_DATABASE_URL.startswith("postgresql://"):
    TEST_DATABASE_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

class MockScalars:
    def __init__(self, data):
        self.data = data
    def first(self):
        return self.data[0] if self.data else None
    def all(self):
        return self.data

class MockResult:
    def __init__(self, data):
        self.data = data
    def scalars(self):
        return MockScalars(self.data)
    def scalar_one(self):
        """Return first element or 0 (for COUNT/SUM aggregates)."""
        if not self.data:
            return 0
        val = self.data[0]
        # If it's a model object, return it; if it's a scalar (int/float), return it
        return val
    def scalar_one_or_none(self):
        if not self.data:
            return None
        return self.data[0]

class MockAsyncSession:
    def __init__(self):
        self.users = {}
        self.transactions = []
        self.broadcasts = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def execute(self, statement):
        stmt_str = str(statement)
        
        # Determine telegram_id if checking users
        telegram_id = None
        
        # Inspect bound compile params first
        try:
            params = statement.compile().params
            for k, v in params.items():
                if "telegram_id" in k or "id" in k:
                    telegram_id = v
        except Exception:
            pass

        # Parse string query as fallback
        if not telegram_id:
            for word in stmt_str.replace("=", " ").replace(":", " ").replace("(", " ").replace(")", " ").split():
                if word.isdigit():
                    telegram_id = int(word)
                    break

        # COUNT / aggregate queries — return 0 or empty lists for admin stats
        stmt_lower = stmt_str.lower()
        if "count(" in stmt_lower or "sum(" in stmt_lower or "coalesce(" in stmt_lower:
            return MockResult([0])

        if "broadcast" in stmt_lower:
            if telegram_id:
                matched = [b for b in self.broadcasts if b.id == telegram_id]
                return MockResult(matched)
            return MockResult(list(self.broadcasts))

        if "transaction" in stmt_lower:
            ref_id = None
            try:
                params = statement.compile().params
                for k, v in params.items():
                    if "reference_id" in k or "ref" in k:
                        ref_id = v
            except Exception:
                pass
            if not ref_id:
                for tx in self.transactions:
                    if tx.reference_id and tx.reference_id in stmt_str:
                        ref_id = tx.reference_id
                        break
            if ref_id:
                matched = [tx for tx in self.transactions if tx.reference_id == ref_id]
                return MockResult(matched)
            return MockResult(list(self.transactions))

        if "users" in stmt_lower or "user" in stmt_lower:
            if telegram_id and telegram_id in self.users:
                return MockResult([self.users[telegram_id]])
            # Return all users when no specific ID
            return MockResult(list(self.users.values()))

        return MockResult([])

    def add(self, obj):
        from app.models.broadcast import Broadcast
        if isinstance(obj, User):
            if obj.games_played is None: obj.games_played = 0
            if obj.wins is None: obj.wins = 0
            if obj.losses is None: obj.losses = 0
            if obj.draws is None: obj.draws = 0
            if obj.elo is None: obj.elo = 1000
            if obj.balance is None: obj.balance = 0
            if obj.level is None: obj.level = 1
            if obj.xp is None: obj.xp = 0
            self.users[obj.telegram_id] = obj
        elif isinstance(obj, Broadcast):
            # Assign a fake id if not set
            if not obj.id:
                obj.id = len(self.broadcasts) + 1
            if not obj.created_at:
                from datetime import datetime, timezone
                obj.created_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.broadcasts.append(obj)
        else:
            self.transactions.append(obj)

    async def commit(self):
        pass

    async def refresh(self, obj):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    # If using internal Railway hostname locally, fallback cleanly to avoid gaierror
    if "postgres.railway.internal" in TEST_DATABASE_URL:
        yield None
        return

    try:
        engine = create_async_engine(TEST_DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        yield engine
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await engine.dispose()
    except Exception:
        yield None

@pytest_asyncio.fixture
async def db_session(test_engine):
    if test_engine is None:
        mock_sess = MockAsyncSession()
        yield mock_sess
        return

    session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
        await session.rollback()
        
        # Clean up database tables to prevent cross-test state leakage
        from sqlalchemy import text
        tables = [
            "unlocked_puzzles",
            "solved_puzzles",
            "unlocked_lessons",
            "referrals",
            "user_tasks",
            "tasks",
            "game_history",
            "transactions",
            "xp_transactions",
            "broadcasts",
            "users"
        ]
        for table in tables:
            try:
                await session.execute(text(f"DELETE FROM {table};"))
            except Exception:
                pass
        await session.commit()

@pytest_asyncio.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()

@pytest.fixture(scope="session", autouse=True)
def patch_database_sessions(test_engine):
    import app.services.game_service
    import app.core.database
    
    if test_engine is None:
        class MockSessionFactory:
            def __call__(self):
                return MockAsyncSession()
        
        app.services.game_service.AsyncSessionLocal = MockSessionFactory()
        app.core.database.AsyncSessionLocal = MockSessionFactory()
    else:
        session_factory = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
        app.services.game_service.AsyncSessionLocal = session_factory
        app.core.database.AsyncSessionLocal = session_factory
