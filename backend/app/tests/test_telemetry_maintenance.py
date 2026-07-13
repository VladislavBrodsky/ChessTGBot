from datetime import date, datetime

import pytest
import pytest_asyncio
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.telemetry import TelemetryDailyRollup, TelemetryLog
from app.services.telemetry_maintenance import run_telemetry_maintenance


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
async def test_rollup_replaces_late_data_before_pruning_raw_logs(db):
    db.add_all([
        TelemetryLog(
            user_id=99,
            event_type="expired_event",
            created_at=datetime(2026, 7, 10, 23, 59),
        ),
        TelemetryLog(
            user_id=1,
            event_type="page_visit",
            created_at=datetime(2026, 7, 12, 8, 0),
        ),
        TelemetryLog(
            user_id=1,
            event_type="page_visit",
            created_at=datetime(2026, 7, 12, 9, 0),
        ),
        TelemetryLog(
            user_id=None,
            event_type="page_visit",
            created_at=datetime(2026, 7, 12, 10, 0),
        ),
        TelemetryLog(
            user_id=2,
            event_type="session_start",
            created_at=datetime(2026, 7, 12, 11, 0),
        ),
        TelemetryLog(
            user_id=3,
            event_type="today_is_incomplete",
            created_at=datetime(2026, 7, 13, 1, 0),
        ),
    ])
    await db.commit()

    result = await run_telemetry_maintenance(
        db,
        today=date(2026, 7, 13),
        retention_days=2,
    )

    assert result["skipped"] is False
    assert result["raw_deleted"] == 1
    page_rollup = (
        await db.execute(
            select(TelemetryDailyRollup).where(
                TelemetryDailyRollup.rollup_date == date(2026, 7, 12),
                TelemetryDailyRollup.event_type == "page_visit",
            )
        )
    ).scalars().one()
    assert page_rollup.event_count == 3
    assert page_rollup.unique_users == 1
    assert (
        await db.execute(
            select(func.count(TelemetryDailyRollup.id)).where(
                TelemetryDailyRollup.event_type == "today_is_incomplete"
            )
        )
    ).scalar_one() == 0

    db.add(TelemetryLog(
        user_id=4,
        event_type="page_visit",
        created_at=datetime(2026, 7, 12, 23, 55),
    ))
    await db.commit()
    await run_telemetry_maintenance(
        db,
        today=date(2026, 7, 13),
        retention_days=2,
    )

    refreshed_rollups = (
        await db.execute(
            select(TelemetryDailyRollup).where(
                TelemetryDailyRollup.rollup_date == date(2026, 7, 12),
                TelemetryDailyRollup.event_type == "page_visit",
            )
        )
    ).scalars().all()
    assert len(refreshed_rollups) == 1
    assert refreshed_rollups[0].event_count == 4
    assert refreshed_rollups[0].unique_users == 2

    remaining_types = set(
        (await db.execute(select(TelemetryLog.event_type))).scalars().all()
    )
    assert "expired_event" not in remaining_types
    assert "today_is_incomplete" in remaining_types
