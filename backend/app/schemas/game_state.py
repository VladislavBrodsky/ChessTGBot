from pydantic import BaseModel
from typing import Optional, List

class ChessMove(BaseModel):
    from_square: str
    to_square: str
    promotion: Optional[str] = None

class GameState(BaseModel):
    fen: str
    turn: str  # 'w' or 'b'
    is_check: bool
    is_checkmate: bool
    is_stalemate: bool
    is_game_over: bool
    winner: Optional[str] = None  # 'w', 'b', or None
    legal_moves: List[str]
    white_player_id: Optional[int] = None
    black_player_id: Optional[int] = None
    bid_amount: int = 0
    time_control_seconds: int = 600
    white_time_left: float = 600.0
    black_time_left: float = 600.0
    last_move_at: Optional[float] = None
    move_history: List[str] = []
    result_type: Optional[str] = None

class JoinGameRequest(BaseModel):
    game_id: str
    player_id: Optional[str] = None # For reconnecting or spectating
