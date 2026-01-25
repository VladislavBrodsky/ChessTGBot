from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from app.core.database import Base
from datetime import datetime

class GameHistory(Base):
    __tablename__ = "game_history"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(String, unique=True, index=True)
    
    # Players
    white_player_id = Column(BigInteger, index=True)
    black_player_id = Column(BigInteger, index=True)
    
    # Result
    winner = Column(String, nullable=True)  # 'w', 'b', or None for draw
    result_type = Column(String, nullable=True)  # 'checkmate', 'resignation', 'timeout', 'draw'
    
    # ELO Changes
    white_elo_before = Column(Integer)
    white_elo_after = Column(Integer)
    black_elo_before = Column(Integer)
    black_elo_after = Column(Integer)
    
    # Game Details
    total_moves = Column(Integer, default=0)
    duration_seconds = Column(Integer, nullable=True)  # Game duration
    final_fen = Column(String, nullable=True)  # Final board position
    
    # Metadata
    game_type = Column(String, default='online')  # 'online', 'computer'
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, default=datetime.utcnow)
