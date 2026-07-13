from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.telemetry import TelemetryLog
from app.api.v1.deps import get_current_telegram_id, ip_rate_limit
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class TelemetryEvent(BaseModel):
    # Kept for compatibility with already-deployed clients. The authenticated
    # Telegram identity below is authoritative and this value is never stored.
    user_id: Optional[int] = None
    event_type: str
    event_data: Optional[Dict[str, Any]] = None

class TelemetryBatch(BaseModel):
    events: List[TelemetryEvent]

@router.post("/log", dependencies=[Depends(ip_rate_limit(limit=30, window=60))])
async def log_telemetry(
    payload: TelemetryBatch,
    telegram_id: int = Depends(get_current_telegram_id),
    db: AsyncSession = Depends(get_db),
):
    """
    Log a batch of player telemetry events (e.g., page visits, session timers, queue actions).
    """
    try:
        logs = []
        for event in payload.events:
            log_entry = TelemetryLog(
                user_id=telegram_id,
                event_type=event.event_type,
                event_data=event.event_data
            )
            db.add(log_entry)
            logs.append(log_entry)
        
        await db.commit()
        return {"status": "success", "logged_count": len(logs)}
    except Exception as e:
        logger.error(f"Error logging telemetry: {e}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store telemetry data"
        )
