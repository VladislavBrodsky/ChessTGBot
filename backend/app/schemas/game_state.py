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

class JoinGameRequest(BaseModel):
    game_id: str
    player_id: Optional[str] = None # For reconnecting or spectating
