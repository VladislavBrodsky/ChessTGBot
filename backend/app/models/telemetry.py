from sqlalchemy import BigInteger, Column, Date, DateTime, Integer, JSON, String, UniqueConstraint
from app.core.database import Base
from datetime import datetime, timezone

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(BigInteger, index=True, nullable=True)  # Nullable for guest/anonymous events
    event_type = Column(String, index=True, nullable=False)   # e.g., 'page_visit', 'session_start', etc.
    event_data = Column(JSON, nullable=True)                 # Metadata dict
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), index=True)


class TelemetryDailyRollup(Base):
    __tablename__ = "telemetry_daily_rollups"
    __table_args__ = (
        UniqueConstraint("rollup_date", "event_type", name="uq_telemetry_rollup_date_event"),
    )

    id = Column(Integer, primary_key=True, index=True)
    rollup_date = Column(Date, nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_count = Column(Integer, nullable=False, default=0)
    unique_users = Column(Integer, nullable=False, default=0)
    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
    )
