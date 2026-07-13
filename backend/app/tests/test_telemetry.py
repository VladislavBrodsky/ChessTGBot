import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.endpoints.telemetry import TelemetryBatch, TelemetryEvent, log_telemetry
from app.core.database import Base
from app.models.telemetry import TelemetryLog


@pytest_asyncio.fixture
async def db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_telemetry_uses_authenticated_telegram_id(db):
    payload = TelemetryBatch(
        events=[
            TelemetryEvent(
                user_id=999999,
                event_type="session_start",
                event_data={"source": "test"},
            )
        ]
    )

    result = await log_telemetry(payload, telegram_id=123456, db=db)

    assert result == {"status": "success", "logged_count": 1}
    stored = (await db.execute(select(TelemetryLog))).scalars().one()
    assert stored.user_id == 123456
    assert stored.event_type == "session_start"
    assert stored.event_data == {"source": "test"}
