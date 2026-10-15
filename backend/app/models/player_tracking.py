"""Server-owned gameplay facts and bounded campaign routing."""
from datetime import datetime, timezone

from sqlalchemy import BigInteger, Column, Date, DateTime, Integer, String, UniqueConstraint
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class PlayerActivity(Base):
    __tablename__ = "player_activity"
    __table_args__ = (UniqueConstraint("day", "user_id", name="uq_player_activity_day_user"),)
    id = Column(Integer, primary_key=True)
    day = Column(Date, nullable=False, index=True)
    user_id = Column(BigInteger, nullable=False, index=True)  # Telegram identity everywhere
    recorded_at = Column(DateTime, nullable=False, default=utcnow)


class LaunchToken(Base):
    __tablename__ = "launch_tokens"
    token = Column(String(48), primary_key=True)
    destination = Column(String(16), nullable=False)
    game_id = Column(String(128), nullable=True, index=True)
    campaign = Column(String(64), nullable=False)
    inviter_id = Column(BigInteger, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    expires_at = Column(DateTime, nullable=False, index=True)


class PlayerAcquisition(Base):
    __tablename__ = "player_acquisition"
    user_id = Column(BigInteger, primary_key=True)
    campaign = Column(String(64), nullable=False, index=True)
    inviter_id = Column(BigInteger, nullable=True)
    token = Column(String(48), nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class ArenaGameResult(Base):
    __tablename__ = "arena_game_results"
    game_id = Column(String(128), primary_key=True)
    arena_id = Column(Integer, nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)


class CampaignDelivery(Base):
    __tablename__ = "campaign_deliveries"
    __table_args__ = (UniqueConstraint("campaign", "user_id", name="uq_campaign_delivery_user"),)
    id = Column(Integer, primary_key=True)
    campaign = Column(String(96), nullable=False)
    user_id = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    status = Column(String(16), nullable=False, default="reserved")
