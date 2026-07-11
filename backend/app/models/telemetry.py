from sqlalchemy import Column, Integer, String, BigInteger, DateTime, JSON
from app.core.database import Base
from datetime import datetime, timezone

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True, nullable=True)  # Nullable for guest/anonymous events
    event_type = Column(String, index=True, nullable=False)   # e.g., 'page_visit', 'session_start', etc.
    event_data = Column(JSON, nullable=True)                 # Metadata dict
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)
