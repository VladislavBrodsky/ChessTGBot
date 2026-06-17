from pydantic import BaseModel, computed_field
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

    # Cached Player info (to avoid db calls on moves/fetches)
    white_username: Optional[str] = None
    black_username: Optional[str] = None
    white_elo: Optional[int] = None
    black_elo: Optional[int] = None

    # Settlement detail caches
    white_elo_before: Optional[int] = None
    white_elo_after: Optional[int] = None
    black_elo_before: Optional[int] = None
    black_elo_after: Optional[int] = None
    payout_amount: Optional[int] = None
    platform_rake: Optional[int] = None

    @computed_field
    @property
    def status(self) -> str:
        if self.is_game_over:
            return 'aborted' if self.result_type == 'aborted' else 'completed'
        return 'active'

    @computed_field
    @property
    def winner_id(self) -> Optional[int]:
        if self.winner == 'w':
            return self.white_player_id
        if self.winner == 'b':
            return self.black_player_id
        return None

    @computed_field
    @property
    def wager_amount(self) -> int:
        return self.bid_amount

class JoinGameRequest(BaseModel):
    game_id: str
    player_id: Optional[str] = None # For reconnecting or spectating
