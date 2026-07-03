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

    # Piece-Square Tables (favoring center control and development)
    PAWN_PST = [
        0,  0,  0,  0,  0,  0,  0,  0,
        50, 50, 50, 50, 50, 50, 50, 50,
        10, 10, 20, 30, 30, 20, 10, 10,
         5,  5, 10, 25, 25, 10,  5,  5,
         0,  0,  0, 20, 20,  0,  0,  0,
         5, -5,-10,  0,  0,-10, -5,  5,
         5, 10, 10,-20,-20, 10, 10,  5,
         0,  0,  0,  0,  0,  0,  0,  0
    ]
    KNIGHT_PST = [
        -50,-40,-30,-30,-30,-30,-40,-50,
        -40,-20,  0,  0,  0,  0,-20,-40,
        -30,  0, 10, 15, 15, 10,  0,-30,
        -30,  5, 15, 20, 20, 15,  5,-30,
        -30,  0, 15, 20, 20, 15,  0,-30,
        -30,  5, 10, 15, 15, 10,  5,-30,
        -40,-20,  0,  5,  5,  0,-20,-40,
        -50,-40,-30,-30,-30,-30,-40,-50
    ]
    BISHOP_PST = [
        -20,-10,-10,-10,-10,-10,-10,-20,
        -10,  0,  0,  0,  0,  0,  0,-10,
        -10,  0,  5, 10, 10,  5,  0,-10,
        -10,  5,  5, 10, 10,  5,  5,-10,
        -10,  0, 10, 10, 10, 10,  0,-10,
        -10, 10, 10, 10, 10, 10, 10,-10,
        -10,  5,  0,  0,  0,  0,  5,-10,
        -20,-10,-10,-10,-10,-10,-10,-20
    ]

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
        
        # Material evaluation
        for piece_type, value in self.PIECE_VALUES.items():
            score += len(self.board.pieces(piece_type, chess.WHITE)) * value
            score -= len(self.board.pieces(piece_type, chess.BLACK)) * value
        
        # Positional bonuses using Piece-Square Tables (PST)
        for sq in self.board.pieces(chess.PAWN, chess.WHITE):
            score += self.PAWN_PST[chess.square_mirror(sq)]
        for sq in self.board.pieces(chess.PAWN, chess.BLACK):
            score -= self.PAWN_PST[sq]

        for sq in self.board.pieces(chess.KNIGHT, chess.WHITE):
            score += self.KNIGHT_PST[chess.square_mirror(sq)]
        for sq in self.board.pieces(chess.KNIGHT, chess.BLACK):
            score -= self.KNIGHT_PST[sq]

        for sq in self.board.pieces(chess.BISHOP, chess.WHITE):
            score += self.BISHOP_PST[chess.square_mirror(sq)]
        for sq in self.board.pieces(chess.BISHOP, chess.BLACK):
            score -= self.BISHOP_PST[sq]

        # Add a bit of randomness to avoid predictable play
        score += random.randint(-5, 5)
        return score

    def minimax(self, depth: int, alpha: float, beta: float, is_maximizing: bool) -> tuple[int, chess.Move | None]:
        if depth == 0 or self.board.is_game_over():
            return self.evaluate_board(), None

        legal_moves = list(self.board.legal_moves)
        # Sort moves (captures first) to optimize alpha-beta pruning
        legal_moves.sort(key=lambda m: self.board.is_capture(m), reverse=True)

        best_move = None
        if is_maximizing:
            max_eval = -float('inf')
            for move in legal_moves:
                self.board.push(move)
                eval_val, _ = self.minimax(depth - 1, alpha, beta, False)
                self.board.pop()
                if eval_val > max_eval:
                    max_eval = eval_val
                    best_move = move
                alpha = max(alpha, eval_val)
                if beta <= alpha:
                    break
            return max_eval, best_move
        else:
            min_eval = float('inf')
            for move in legal_moves:
                self.board.push(move)
                eval_val, _ = self.minimax(depth - 1, alpha, beta, True)
                self.board.pop()
                if eval_val < min_eval:
                    min_eval = eval_val
                    best_move = move
                beta = min(beta, eval_val)
                if beta <= alpha:
                    break
            return min_eval, best_move

    def get_best_move(self, depth: int = 3) -> str:
        """Finds the best move using a minimax search with alpha-beta pruning at the specified depth."""
        _, best_move = self.minimax(depth, -float('inf'), float('inf'), self.board.turn == chess.WHITE)
        if best_move:
            return best_move.uci()
        
        legal_moves = list(self.board.legal_moves)
        return legal_moves[0].uci() if legal_moves else None
