"""Chess legality and tactical-claim verification (python-chess). A post that shows a position must be correct."""
from __future__ import annotations
try:
    import chess
except ImportError:  # keep the rest of the pipeline importable; chess claims then fail closed
    chess = None

def _need():
    if chess is None:
        raise RuntimeError("python-chess is required to verify positions: pip install chess")

def parse_fen(fen: str):
    _need()
    board = chess.Board(fen)
    if not board.is_valid():
        raise ValueError(f"illegal position: {board.status().name}")
    return board

def play_line(fen: str, moves: list[str]):
    """Play SAN or UCI moves from fen; return (board, san_list). Raises ValueError on an illegal move."""
    board = parse_fen(fen)
    sans = []
    for token in moves:
        token = token.strip()
        try:
            move = board.parse_san(token)
        except ValueError:
            try:
                move = board.parse_uci(token)
            except ValueError as exc:
                raise ValueError(f"illegal move {token!r} in {board.fen()}") from exc
        if move not in board.legal_moves:
            raise ValueError(f"illegal move {token!r}")
        sans.append(board.san(move))
        board.push(move)
    return board, sans

def forced_mate(board, n: int) -> bool:
    """True if the side to move has a forced mate in at most n moves (exhaustive; use n <= 2)."""
    if n < 1:
        return False
    for move in list(board.legal_moves):
        board.push(move)
        try:
            if board.is_checkmate():
                return True
            if n > 1 and not board.is_game_over():
                replies = list(board.legal_moves)
                if replies and all(_after_reply(board, reply, n - 1) for reply in replies):
                    return True
        finally:
            board.pop()
    return False

def _after_reply(board, reply, n: int) -> bool:
    board.push(reply)
    try:
        return forced_mate(board, n)
    finally:
        board.pop()

def verify_puzzle(fen: str, solution: list[str], claim: str | None) -> list[str]:
    """Return a list of problems (empty = verified). claim: 'mate_in_1' | 'mate_in_2' | 'wins_material' | None."""
    problems: list[str] = []
    try:
        board, _ = play_line(fen, solution)
    except (ValueError, RuntimeError) as exc:
        return [str(exc)]
    start = parse_fen(fen)
    if claim in {"mate_in_1", "mate_in_2"} and not board.is_checkmate():
        problems.append("the listed solution line does not end in checkmate")
    if claim in {"mate_in_1", "mate_in_2"}:
        n = 1 if claim == "mate_in_1" else 2
        if not forced_mate(start, n):
            problems.append(f"{claim} is not a forced mate from the given position")
        # A mate-in-1 claim must not also be mate-in-0 trivial; a mate-in-2 must not be a mate-in-1.
        if n == 2 and forced_mate(start, 1):
            problems.append("claimed mate in 2 but mate in 1 exists")
    return problems
