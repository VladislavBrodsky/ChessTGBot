import chess
import math
from app.services.game_engine import GameEngine
from app.services.session_manager import SessionManager
from app.schemas.game_state import GameState
from typing import Optional
from app.core.database import get_db
from app.crud import user as user_crud

class GameService:
    def __init__(self):
        self.session_manager = SessionManager()

    async def create_game(self, game_id: str) -> GameState:
        """Initialize a new game and save to Redis."""
        engine = GameEngine() # Starts with new board
        state = engine.get_state()
        await self.session_manager.save_game(game_id, state)
        return state

    async def get_game_state(self, game_id: str) -> Optional[GameState]:
        """Fetch current state from Redis."""
        return await self.session_manager.get_game(game_id)

    async def make_move(self, game_id: str, uci: str) -> Optional[GameState]:
        """Load state, apply move, save state. Returns new state if valid."""
        # 1. Load from Redis
        current_state = await self.session_manager.get_game(game_id)
        if not current_state:
            return None

        # 2. Reconstruct Board
        board = chess.Board(current_state.fen)
        engine = GameEngine()
        engine.board = board # Inject state

        # 3. Validate & Move
        if engine.make_move(uci):
            new_state = engine.get_state()
            # 4. Save to Redis
            await self.session_manager.save_game(game_id, new_state)
            
            # Check for Game Over
            if new_state.is_game_over:
                await self.end_game(game_id, new_state)

            return new_state
        
        return None

    def calculate_new_elo(self, rating1: int, rating2: int, actual_score: float, k: int = 32) -> int:
        expected_score = 1 / (1 + 10 ** ((rating2 - rating1) / 400))
        return round(rating1 + k * (actual_score - expected_score))

    async def end_game(self, game_id: str, state: GameState):
        """Process game result and update ELO."""
        # TODO: Get actual player IDs from the game state (stored in Redis or passed in)
        # For MVP, we'll mock player IDs or rely on frontend to send a 'finalize' request
        # But ideally, server handles this securely.
        pass # Logic moved to API endpoint for better session handling or handled here if IDs are available
