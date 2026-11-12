"""Post-hoc fair-play screening of wagered games (see app/services/fair_play.py)."""
from datetime import datetime, timezone

from sqlalchemy import BigInteger, Boolean, DateTime, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class FairPlayAnalysis(Base):
    """One engine analysis of one player's moves in one wagered game.

    A row is written for both players of every analysed game (even a game too
    short to judge, with moves_analyzed=0) so the worker never re-analyses it.
    """
    __tablename__ = "fair_play_analyses"
    __table_args__ = (UniqueConstraint("game_id", "player_id", name="uq_fair_play_game_player"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[str] = mapped_column(String, index=True, nullable=False)
    player_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    color: Mapped[str] = mapped_column(String(1), nullable=False)
    moves_analyzed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    engine_matches: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_centipawn_loss: Mapped[float | None] = mapped_column(Float, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    engine_depth: Mapped[int] = mapped_column(Integer, nullable=False)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)


class FairPlayReview(Base):
    """A player under fair-play review. While status is open or upheld, every
    withdrawal by the player is held in the admin pending_review queue."""
    __tablename__ = "fair_play_reviews"

    player_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False)  # open | cleared | upheld
    first_game_id: Mapped[str] = mapped_column(String, nullable=False)
    flagged_games: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    opened_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_utcnow)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
