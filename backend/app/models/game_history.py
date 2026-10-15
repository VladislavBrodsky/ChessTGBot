from sqlalchemy import Integer, String, BigInteger, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from datetime import datetime, timezone

class GameHistory(Base):
    __tablename__ = "game_history"
    __table_args__ = (Index("ix_game_history_type_ended_at", "game_type", "ended_at"),)

    # Explicit nullability preserves the existing schema when adding Mapped types.
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    game_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=True)
    
    # Players
    white_player_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=True)
    black_player_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=True)
    
    # Result
    winner: Mapped[str | None] = mapped_column(String, nullable=True)  # 'w', 'b', or None for draw
    result_type: Mapped[str | None] = mapped_column(String, nullable=True)  # 'checkmate', 'resignation', 'timeout', 'draw'
    
    # ELO Changes
    white_elo_before: Mapped[int] = mapped_column(Integer, nullable=True)
    white_elo_after: Mapped[int] = mapped_column(Integer, nullable=True)
    black_elo_before: Mapped[int] = mapped_column(Integer, nullable=True)
    black_elo_after: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Game Details
    total_moves: Mapped[int] = mapped_column(Integer, default=0, nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)  # Game duration
    final_fen: Mapped[str | None] = mapped_column(String, nullable=True)  # Final board position
    
    # Metadata
    game_type: Mapped[str] = mapped_column(String, default='online', nullable=True)  # 'online', 'computer'
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=True)
    ended_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=True)
    
    # Web3 Betting
    bid_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=True)  # In cents (smallest unit)
    platform_rake: Mapped[int] = mapped_column(Integer, default=0, nullable=True)  # In cents (3% of pool)
    payout_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=True)  # In cents (97% of pool)
    moves_json: Mapped[str | None] = mapped_column(String, nullable=True)  # JSON representation of all moves
    difficulty: Mapped[str | None] = mapped_column(String, nullable=True)

