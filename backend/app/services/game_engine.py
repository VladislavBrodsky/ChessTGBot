import chess
import random
from app.schemas.game_state import GameState

class GameEngine:
    # Basic piece values for evaluation
    PIECE_VALUES = {
        chess.PAWN: 100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK: 500,
        chess.QUEEN: 900,
        chess.KING: 20000
    }

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

    def evaluate_board(self) -> int:
        """Returns a score for the board status. Positive favors white, negative favors black."""
        if self.board.is_checkmate():
            return -99999 if self.board.turn == chess.WHITE else 99999
        if self.board.is_stalemate() or self.board.is_insufficient_material():
            return 0

        score = 0
        for piece_type, value in self.PIECE_VALUES.items():
            score += len(self.board.pieces(piece_type, chess.WHITE)) * value
            score -= len(self.board.pieces(piece_type, chess.BLACK)) * value
        
        # Add a bit of randomness to avoid predictable play
        score += random.randint(-10, 10)
        return score

    def get_best_move(self) -> str:
        """Finds the best move using a 1-level deep heuristic search."""
        legal_moves = list(self.board.legal_moves)
        if not legal_moves:
            return None

        best_move = None
        if self.board.turn == chess.WHITE:
            max_eval = -float('inf')
            for move in legal_moves:
                self.board.push(move)
                eval = self.evaluate_board()
                self.board.pop()
                if eval > max_eval:
                    max_eval = eval
                    best_move = move
        else:
            min_eval = float('inf')
            for move in legal_moves:
                self.board.push(move)
                eval = self.evaluate_board()
                self.board.pop()
                if eval < min_eval:
                    min_eval = eval
                    best_move = move

        return best_move.uci() if best_move else legal_moves[0].uci()
