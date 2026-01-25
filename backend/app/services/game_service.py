import chess
from app.services.game_engine import GameEngine
from app.services.session_manager import SessionManager
from app.schemas.game_state import GameState
from typing import Optional

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
            
            # TODO: Async emit 'move_made' via SocketManager here or in the caller?
            # Ideally return state and let caller handle broadcast
            return new_state
        
        return None
