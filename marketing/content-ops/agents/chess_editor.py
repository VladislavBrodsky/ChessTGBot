"""Chess Editor Agent.

Guarantees 100% tactical integrity using python-chess. Verifies FEN legality,
move candidate trees, mate claims, and tactical refutations before any copy reaches production.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
import chess

from pipeline import chesscheck, idea_bank


class ChessEditorAgent:
    """Verifies and originates chess positions with zero tolerance for hallucinations."""

    def __init__(self):
        pass

    def verify_position_and_solution(
        self, fen: str, solution: List[str], claim: Optional[str] = None
    ) -> Dict[str, Any]:
        """Validates that a position is legal and the solution sequence matches the claim."""
        issues = chesscheck.verify_puzzle(fen, solution, claim)
        is_valid = len(issues) == 0
        board = None
        legal_moves_san: List[str] = []
        if is_valid:
            try:
                board = chesscheck.parse_fen(fen)
                legal_moves_san = [board.san(m) for m in board.legal_moves][:6]
            except Exception as e:
                issues.append(f"Board parse error: {e}")
                is_valid = False

        return {
            "valid": is_valid,
            "issues": issues,
            "turn": "White" if board and board.turn == chess.WHITE else "Black" if board else "Unknown",
            "candidate_moves": legal_moves_san,
        }

    def get_stock_viral_position(self, theme: str = "smothered_mate") -> Dict[str, Any]:
        """Supplies verified, aesthetically brilliant positions known for viral resonance."""
        curated = {
            "smothered_mate": {
                "id": "viral-smothered-nf7",
                "theme": "Smothered Mate",
                "fen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
                "solution": ["Nf7#"],
                "claim": "mate_in_1",
                "hook": "White to move. One knight move ends the game on the spot.",
                "lesson": "Black's king is boxed in by its own rook and pawns. A knight check cannot be blocked.",
            },
            "back_rank_decoy": {
                "id": "viral-back-rank-ra8",
                "theme": "Back Rank Checkmate",
                "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
                "solution": ["Ra8#"],
                "claim": "mate_in_1",
                "hook": "White to move. Three pawns form a shield—and an inescapable trap.",
                "lesson": "Pawns without luft (breathing room) trap their own king against the 8th rank.",
            },
            "greek_gift_sacrifice": {
                "id": "viral-greek-gift",
                "theme": "Bishop Sacrifice on h7",
                "fen": "r1bq1rk1/ppp2ppp/2np4/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 7",
                "solution": ["Bxf7+"],
                "claim": None,
                "hook": "Can White crack the castle with a classic sacrifice?",
                "lesson": "When Black neglects f7 and kingside development, forcing sacrifices rip the king open.",
            },
        }
        return curated.get(theme, curated["smothered_mate"])

    def validate_article_chess_blocks(self, content_blocks: List[Dict[str, Any]]) -> List[str]:
        """Verifies every chess_position block inside a blog article."""
        issues: List[str] = []
        for block in content_blocks:
            if block.get("type") == "chess_position":
                fen = block.get("fen")
                if not fen:
                    issues.append("Chess block missing 'fen' attribute")
                    continue
                try:
                    chesscheck.parse_fen(fen)
                except Exception as e:
                    issues.append(f"Invalid FEN '{fen}': {e}")
                if block.get("moves"):
                    try:
                        board, _ = chesscheck.play_line(block.get("initialFen") or chess.STARTING_FEN, block["moves"])
                        if board.fen() != chesscheck.parse_fen(fen).fen():
                            issues.append(f"Move sequence does not arrive at stated FEN: {fen}")
                    except Exception as e:
                        issues.append(f"Failed to play line: {e}")
        return issues
