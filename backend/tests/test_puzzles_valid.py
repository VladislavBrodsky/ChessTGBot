"""Engine-verify the puzzle dataset: every puzzle's solution must be a single
legal move from its FEN, and the stated tactic (mate / fork / skewer /
promotion / material win) must actually hold on the board. Guards against
reintroducing the broken instructions users reported (mate-in-1s that weren't
mate, forks that didn't fork, an illegal position that "captured" the king).
"""
import chess
import pytest

from app.core.puzzles import CHESS_PUZZLES


def _knight_targets(sq):
    return set(chess.SquareSet(chess.BB_KNIGHT_ATTACKS[sq]))


def test_dataset_shape():
    assert len(CHESS_PUZZLES) == 100
    assert [p["id"] for p in CHESS_PUZZLES] == list(range(1, 101))
    # Puzzle 1's solution is hard-coded in test_puzzle_gating.py.
    assert CHESS_PUZZLES[0]["solution"] == ["g5f7"]


@pytest.mark.parametrize("p", CHESS_PUZZLES, ids=lambda p: f"{p['id']}-{p['title']}")
def test_puzzle_is_legal_single_move(p):
    board = chess.Board(p["fen"])
    assert board.is_valid(), f"invalid position: {board.status()}"
    assert len(p["solution"]) == 1, "solutions must stay single-move (verify invariant)"
    uci = p["solution"][0]
    assert uci in {m.uci() for m in board.legal_moves}, f"illegal solution move {uci}"


@pytest.mark.parametrize("p", CHESS_PUZZLES, ids=lambda p: f"{p['id']}-{p['title']}")
def test_puzzle_tactic_matches_claim(p):
    """The description's promise must be true on the board."""
    board = chess.Board(p["fen"])
    enemy = not board.turn
    king_sq = board.king(enemy)
    move = chess.Move.from_uci(p["solution"][0])
    dest = move.to_square
    desc = p["description"].lower()

    after = board.copy()
    after.push(move)

    if "mate" in desc:
        assert after.is_checkmate(), "description claims mate but move is not mate"
    elif "fork" in desc:
        # Knight forks: after the leap it attacks the enemy king and a rook.
        targets = _knight_targets(dest)
        rooks = [
            s for s in targets
            if board.piece_at(s) and board.piece_at(s).piece_type == chess.ROOK
            and board.piece_at(s).color == enemy
        ]
        assert king_sq in targets and rooks, "not a real King+Rook fork"
    elif "skewer" in desc:
        assert after.is_check(), "skewer must start with a check"
    elif "promote" in desc or "promotion" in desc:
        assert move.promotion is not None, "promotion move must promote"
    elif "win the queen" in desc:
        targets = _knight_targets(dest)
        q = [
            s for s in targets
            if board.piece_at(s) and board.piece_at(s).piece_type == chess.QUEEN
            and board.piece_at(s).color == enemy
        ]
        assert king_sq in targets and q, "move does not fork the queen"
    elif "win the bishop" in desc:
        targets = _knight_targets(dest)
        bishop = [
            s for s in targets
            if board.piece_at(s) and board.piece_at(s).piece_type == chess.BISHOP
            and board.piece_at(s).color == enemy
        ]
        assert king_sq in targets and bishop, "move does not fork the bishop"
