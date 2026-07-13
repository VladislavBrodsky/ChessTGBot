import asyncio
import logging
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import delete, distinct, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal
from app.models.telemetry import TelemetryDailyRollup, TelemetryLog

logger = logging.getLogger(__name__)

_MAINTENANCE_LOCK_ID = 91320260713


def _midnight(day: date) -> datetime:
    return datetime.combine(day, time.min)


async def rollup_telemetry_day(db: AsyncSession, day: date) -> int:
    """Replace one UTC day's aggregates so reruns remain idempotent."""
    start = _midnight(day)
    end = start + timedelta(days=1)
    result = await db.execute(
        select(
            TelemetryLog.event_type.label("event_type"),
            func.count(TelemetryLog.id).label("event_count"),
            func.count(distinct(TelemetryLog.user_id)).label("unique_users"),
        )
        .where(TelemetryLog.created_at >= start, TelemetryLog.created_at < end)
        .group_by(TelemetryLog.event_type)
    )
    rows = result.all()

    await db.execute(
        delete(TelemetryDailyRollup).where(TelemetryDailyRollup.rollup_date == day)
    )
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add_all(
        [
            TelemetryDailyRollup(
                rollup_date=day,
                event_type=row.event_type,
                event_count=int(row.event_count),
                unique_users=int(row.unique_users),
                created_at=now,
                updated_at=now,
            )
            for row in rows
        ]
    )
    return len(rows)


async def run_telemetry_maintenance(
    db: AsyncSession,
    *,
    today: date | None = None,
    retention_days: int | None = None,
) -> dict[str, int | bool]:
    """Roll up complete UTC days, then prune expired raw telemetry."""
    settings = get_settings()
    today = today or datetime.now(timezone.utc).date()
    retention_days = max(
        1,
        retention_days if retention_days is not None else settings.TELEMETRY_RAW_RETENTION_DAYS,
    )

    if db.get_bind().dialect.name == "postgresql":
        lock_result = await db.execute(
            text("SELECT pg_try_advisory_xact_lock(:lock_id)"),
            {"lock_id": _MAINTENANCE_LOCK_ID},
        )
        if not bool(lock_result.scalar()):
            await db.rollback()
            return {"skipped": True, "rolled_days": 0, "rollup_rows": 0, "raw_deleted": 0}

    cutoff_day = today - timedelta(days=retention_days)
    last_complete_day = today - timedelta(days=1)
    earliest_raw = (
        await db.execute(select(func.min(TelemetryLog.created_at)))
    ).scalar_one_or_none()
    latest_rollup = (
        await db.execute(select(func.max(TelemetryDailyRollup.rollup_date)))
    ).scalar_one_or_none()

    start_day: date | None = None
    if latest_rollup is not None:
        # Reprocess a two-day overlap to absorb delayed client batches.
        start_day = max(cutoff_day, latest_rollup - timedelta(days=1))
    elif earliest_raw is not None:
        start_day = max(cutoff_day, earliest_raw.date())

    rolled_days = 0
    rollup_rows = 0
    if start_day is not None:
        day = start_day
        while day <= last_complete_day:
            rollup_rows += await rollup_telemetry_day(db, day)
            rolled_days += 1
            day += timedelta(days=1)

    prune_result = await db.execute(
        delete(TelemetryLog).where(TelemetryLog.created_at < _midnight(cutoff_day))
    )
    raw_deleted = int(prune_result.rowcount or 0)
    await db.commit()
    return {
        "skipped": False,
        "rolled_days": rolled_days,
        "rollup_rows": rollup_rows,
        "raw_deleted": raw_deleted,
    }


async def start_telemetry_maintenance_loop() -> None:
    settings = get_settings()
    hour = settings.TELEMETRY_MAINTENANCE_HOUR_UTC
    if not 0 <= hour <= 23:
        logger.warning("Invalid TELEMETRY_MAINTENANCE_HOUR_UTC=%s; using 2", hour)
        hour = 2

    while True:
        try:
            now = datetime.now(timezone.utc)
            next_run = now.replace(hour=hour, minute=0, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
            await asyncio.sleep((next_run - now).total_seconds())

            async with AsyncSessionLocal() as db:
                result = await run_telemetry_maintenance(db)
                if result["skipped"]:
                    logger.info("Telemetry maintenance skipped; another instance holds the lock")
                else:
                    logger.info(
                        "Telemetry maintenance complete: %s day(s), %s rollup row(s), %s raw row(s) pruned",
                        result["rolled_days"],
                        result["rollup_rows"],
                        result["raw_deleted"],
                    )
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Telemetry maintenance failed; it will retry next night")
