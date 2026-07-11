from sqlalchemy import Column, Integer, BigInteger, String, DateTime, ForeignKey, UniqueConstraint
from app.core.database import Base
from datetime import datetime, timezone


def _utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Arena(Base):
    """One scheduled daily arena event.

    Rows are created lazily by the arena scheduler loop; `status` walks
    scheduled -> live -> settling -> finished. Times are naive UTC, matching
    the rest of the schema.
    """
    __tablename__ = "arenas"
    __table_args__ = (UniqueConstraint('starts_at', name='uq_arenas_starts_at'),)

    id = Column(Integer, primary_key=True, index=True)
    starts_at = Column(DateTime, nullable=False, index=True)
    ends_at = Column(DateTime, nullable=False)
    status = Column(String, default="scheduled", nullable=False)  # scheduled | live | settling | finished
    time_control_seconds = Column(Integer, default=300, nullable=False)
    notified_at = Column(DateTime, nullable=True)   # T-15min broadcast sent
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=_utcnow, nullable=False)


class ArenaPlayer(Base):
    """A user's participation + score in one arena. user_id is a telegram_id
    (BigInteger), consistent with game_history player columns."""
    __tablename__ = "arena_players"
    __table_args__ = (UniqueConstraint('arena_id', 'user_id', name='uq_arena_players_arena_user'),)

    id = Column(Integer, primary_key=True, index=True)
    arena_id = Column(Integer, ForeignKey("arenas.id"), index=True, nullable=False)
    user_id = Column(BigInteger, index=True, nullable=False)
    score = Column(Integer, default=0, nullable=False)
    wins = Column(Integer, default=0, nullable=False)
    draws = Column(Integer, default=0, nullable=False)
    losses = Column(Integer, default=0, nullable=False)
    games_played = Column(Integer, default=0, nullable=False)
    joined_at = Column(DateTime, default=_utcnow, nullable=False)
