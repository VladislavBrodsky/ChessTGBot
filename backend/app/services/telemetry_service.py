import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.telemetry import TelemetryLog

logger = logging.getLogger(__name__)

async def log_backend_telemetry(db: AsyncSession, user_id: Optional[int], event_type: str, event_data: Optional[dict] = None) -> None:
    """
    Log telemetry events directly from the backend database session.
    """
    try:
        log_entry = TelemetryLog(
            user_id=user_id,
            event_type=event_type,
            event_data=event_data
        )
        db.add(log_entry)
        await db.commit()
    except Exception as e:
        logger.warning(f"Backend telemetry logging failed for event {event_type}: {e}")
