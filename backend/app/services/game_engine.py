import chess
from app.schemas.game_state import GameState

class GameEngine:
    def __init__(self):
        self.board = chess.Board()

    def get_state(self) -> GameState:
        return GameState(
            fen=self.board.fen(),
            turn='w' if self.board.turn == chess.WHITE else 'b',
            is_check=self.board.is_check(),
            is_checkmate=self.board.is_checkmate(),
            is_stalemate=self.board.is_stalemate(),
            is_game_over=self.board.is_game_over(),
            winner='w' if self.board.outcome() and self.board.outcome().winner == chess.WHITE else 
                   ('b' if self.board.outcome() and self.board.outcome().winner == chess.BLACK else None),
            legal_moves=[move.uci() for move in self.board.legal_moves]
        )

    def make_move(self, uci: str) -> bool:
        try:
            move = chess.Move.from_uci(uci)
            if move in self.board.legal_moves:
                self.board.push(move)
                return True
            return False
        except ValueError:
            return False
