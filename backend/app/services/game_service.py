import chess
import math
from app.services.game_engine import GameEngine
from app.services.session_manager import SessionManager
from app.schemas.game_state import GameState
from typing import Optional
from app.core.database import get_db, AsyncSessionLocal
from app.crud import user as user_crud

class GameService:
    def __init__(self):
        self.session_manager = SessionManager()

    async def create_game(self, game_id: str, is_bot_game: bool = False) -> GameState:
        """Initialize a new game and save to Redis."""
        engine = GameEngine() # Starts with new board
        state = engine.get_state()
        if is_bot_game:
            state.black_player_id = -1 # Special ID for bot
        await self.session_manager.save_game(game_id, state)
        return state

    async def get_game_state(self, game_id: str) -> Optional[GameState]:
        """Fetch current state from Redis."""
        return await self.session_manager.get_game(game_id)

    async def join_game(self, game_id: str, user_id: int) -> Optional[GameState]:
        """Assign user to White or Black if available."""
        state = await self.session_manager.get_game(game_id)
        if not state:
            return None
        
        changed = False
        if not state.white_player_id:
            state.white_player_id = user_id
            changed = True
        elif not state.black_player_id and state.white_player_id != user_id:
            state.black_player_id = user_id
            changed = True
        
        # If it's a bot game, ensure player 1 is white or black correctly
        # Usually player 1 is white in bot games for mobile simplicity
        
        if changed:
            await self.session_manager.save_game(game_id, state)
        
        return state

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
            
            # Preserve Players
            new_state.white_player_id = current_state.white_player_id
            new_state.black_player_id = current_state.black_player_id

            # 4. Save to Redis
            await self.session_manager.save_game(game_id, new_state)
            
            # Check for Game Over
            if new_state.is_game_over:
                await self.end_game(game_id, new_state)
            
            # 5. Handle Bot Move if applicable
            if not new_state.is_game_over and new_state.black_player_id == -1 and new_state.turn == 'b':
                # Trigger bot move asynchronously? For simplicity now, let's do it in a separate call or wait
                # In SocketIO context, it's better to trigger it after a small delay
                pass

            return new_state
        
        return None

    async def make_bot_move(self, game_id: str) -> Optional[GameState]:
        """Calculates and applies the best move for the bot."""
        current_state = await self.session_manager.get_game(game_id)
        if not current_state or current_state.is_game_over:
            return None

        board = chess.Board(current_state.fen)
        engine = GameEngine()
        engine.board = board

        bot_move_uci = engine.get_best_move()
        if bot_move_uci and engine.make_move(bot_move_uci):
            new_state = engine.get_state()
            new_state.white_player_id = current_state.white_player_id
            new_state.black_player_id = current_state.black_player_id

            await self.session_manager.save_game(game_id, new_state)
            
            if new_state.is_game_over:
                await self.end_game(game_id, new_state)

            return new_state
        return None

    def calculate_new_elo(self, rating1: int, rating2: int, actual_score: float, k: int = 32) -> int:
        expected_score = 1 / (1 + 10 ** ((rating2 - rating1) / 400))
        return round(rating1 + k * (actual_score - expected_score))

    async def end_game(self, game_id: str, state: GameState):
        """Process game result and update ELO."""
        async with AsyncSessionLocal() as session:
            white_id = state.white_player_id
            black_id = state.black_player_id
            
            # Fetch users
            white_user = await user_crud.get_user_by_telegram_id(session, white_id) if white_id and white_id != -1 else None
            black_user = await user_crud.get_user_by_telegram_id(session, black_id) if black_id and black_id != -1 else None

            if not white_user or (not black_user and black_id != -1):
                 # One player is missing or bot game (skip ELO for bot games for now)
                 return

            # Determine Result
            score_white = 0.5
            if state.winner == 'w':
                score_white = 1.0
            elif state.winner == 'b':
                score_white = 0.0
            
            # Calculate ELO change
            new_white_elo = self.calculate_new_elo(white_user.elo, black_user.elo, score_white)
            new_black_elo = self.calculate_new_elo(black_user.elo, white_user.elo, 1.0 - score_white)

            # Update DB
            if state.winner == 'w':
                await user_crud.update_elo(session, white_user, new_white_elo, 'win')
                await user_crud.update_elo(session, black_user, new_black_elo, 'loss')
            elif state.winner == 'b':
                await user_crud.update_elo(session, white_user, new_white_elo, 'loss')
                await user_crud.update_elo(session, black_user, new_black_elo, 'win')
            else:
                 await user_crud.update_elo(session, white_user, new_white_elo, 'draw')
                 await user_crud.update_elo(session, black_user, new_black_elo, 'draw')
