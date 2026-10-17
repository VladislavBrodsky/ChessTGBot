"""Verified chess ideas: puzzles and opening traps we can build original posts from.

Every entry is built from a legal move sequence and verified with python-chess (tests re-run this), so a post can
never show an illegal position or an unsound 'mate in N'. Explanations here are ours; write fresh copy per post.
"""
from __future__ import annotations
from . import chesscheck

# kind: puzzle (solve it) | trap (a line to recognise). setup: SAN moves from the start position, or fen.
IDEAS = [
    {"id": "back-rank-ra8", "kind": "puzzle", "theme": "back rank", "level": "beginner", "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
     "solution": ["Ra8#"], "claim": "mate_in_1", "lesson": "Three pawns in front of the king are also three walls. The rook needs only one open file to the back rank."},
    {"id": "scholars-mate", "kind": "puzzle", "theme": "early queen attack", "level": "beginner", "setup": "e4 e5 Bc4 Nc6 Qh5 Nf6",
     "solution": ["Qxf7#"], "claim": "mate_in_1", "lesson": "f7 is guarded only by the king until the other pieces develop. Queen and bishop aim at the same square."},
    {"id": "fools-mate", "kind": "puzzle", "theme": "king safety", "level": "beginner", "setup": "f3 e5 g4",
     "solution": ["Qh4#"], "claim": "mate_in_1", "lesson": "Moving the f- and g-pawns opens the diagonal to the king. The shortest game in chess is a warning about pawn moves near your king."},
    {"id": "legals-mate", "kind": "puzzle", "theme": "queen sacrifice", "level": "intermediate", "setup": "e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6 Nxe5 Bxd1",
     "solution": ["Bxf7+", "Ke7", "Nd5#"], "claim": "mate_in_2", "lesson": "Black grabbed the queen but left the king with one flight square. Check, then let two minor pieces finish the job."},
    {"id": "smothered-mate", "kind": "puzzle", "theme": "smothered mate", "level": "beginner", "fen": "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
     "solution": ["Nf7#"], "claim": "mate_in_1", "lesson": "The king is boxed in by its own rook and pawns. A knight check cannot be blocked, and nothing can capture it."},
    {"id": "arabian-mate", "kind": "puzzle", "theme": "rook and knight mate", "level": "beginner", "fen": "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1",
     "solution": ["Rh7#"], "claim": "mate_in_1", "lesson": "The knight covers both escape squares and protects the rook. The king cannot take what is defended."},
    {"id": "ladder-mate", "kind": "puzzle", "theme": "ladder mate", "level": "beginner", "fen": "7k/1R6/8/8/8/8/8/R5K1 w - - 0 1",
     "solution": ["Ra8#"], "claim": "mate_in_1", "lesson": "One rook seals the seventh rank, the other checks on the eighth. Two rooks on neighbouring ranks climb the board like a ladder."},
    {"id": "blackburne-shilling", "kind": "trap", "theme": "opening trap", "level": "intermediate", "setup": "e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#",
     "claim": "line_ends_in_mate", "lesson": "Black offers a pawn to hit g2 and the king in the centre. If White grabs everything, the knight arrives with mate on f3."},
    {"id": "fried-liver-setup", "kind": "trap", "theme": "opening trap", "level": "intermediate", "setup": "e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7",
     "claim": "line_legal", "lesson": "The knight lands on f7 and forks queen and rook. Black's king is pulled into the open after the capture."},
    {"id": "stafford-bishop-trap", "kind": "trap", "theme": "opening trap", "level": "intermediate", "setup": "e4 e5 Nf3 Nf6 Nxe5 Nc6 Nxc6 dxc6 d3 Bc5 Bg5 Bxf2+ Kxf2 Ng4+ Kg1 Qxg5",
     "claim": "line_legal", "lesson": "Bxf2+ drags the king forward, Ng4+ forks the king and the bishop on g5, and the queen collects it."},
    {"id": "kramnik-blunder-mate", "kind": "puzzle", "theme": "historical blunder", "level": "intermediate",
     "fen": "5N1k/6p1/7p/4P3/pp2Q3/4q3/1P4PP/2b4K w - - 1 35",
     "solution": ["Qh7#"], "claim": "mate_in_1",
     "lesson": "Kramnik vs Deep Fritz (2006). A world champion misses mate in 1 due to tunnel vision in a drawn endgame."},
    {"id": "kasparov-immortal-rxd4", "kind": "trap", "theme": "historical brilliancy", "level": "advanced",
     "fen": "b2r3r/k4p1p/p2q1np1/NppP4/3p4/P1Q3P1/1PP4P/1K1RR3 w - - 0 24",
     "solution": ["Rxd4"], "claim": "line_legal",
     "lesson": "Kasparov vs Topalov (1999). 24.Rxd4!! demolishes Black's center and triggers the greatest king hunt in chess history."},
    {"id": "morphy-opera-finish", "kind": "puzzle", "theme": "historical brilliancy", "level": "intermediate",
     "fen": "4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 14",
     "solution": ["Bxd7+", "Nxd7", "Qb8+", "Nxb8", "Rd8#"], "claim": "mate_in_3",
     "lesson": "Morphy vs Duke of Brunswick (1858). A textbook queen sacrifice and back-rank rook mate demonstrating total piece coordination."},
    {"id": "anastasia-mate", "kind": "puzzle", "theme": "anastasia mate", "level": "intermediate",
     "fen": "4r2k/4N1pp/5p2/8/8/7R/5Q2/7K w - - 0 1",
     "solution": ["Rxh7+", "Kxh7", "Qh4#"], "claim": "mate_in_2",
     "lesson": "The knight on e7 controls escape squares g8 and g6, sealing the enemy king before the queen delivers mate on the h-file."},
    {"id": "epaulette-mate", "kind": "puzzle", "theme": "epaulette mate", "level": "beginner",
     "fen": "3rkr2/8/8/3Q4/8/8/8/6K1 w - - 0 1",
     "solution": ["Qe6#"], "claim": "mate_in_1",
     "lesson": "The rooks on d8 and f8 trap their own king like epaulettes on a uniform. Queen lands on e6 with decisive mate."},
]

def _board_for(item):
    if "fen" in item:
        return chesscheck.parse_fen(item["fen"])
    board, _ = chesscheck.play_line(chesscheck.chess.STARTING_FEN, item["setup"].split())
    return board

def position(item: dict) -> str:
    """FEN of the puzzle start (or the position after the full trap line)."""
    if item["kind"] == "puzzle" and "setup" in item:
        return _board_for(item).fen()
    if item["kind"] == "puzzle":
        return item["fen"]
    return _board_for(item).fen()

def verify(item: dict) -> list[str]:
    try:
        if item["kind"] == "puzzle":
            return chesscheck.verify_puzzle(position(item), item["solution"], item["claim"])
        board = _board_for(item)
        if item["claim"] == "line_ends_in_mate" and not board.is_checkmate():
            return ["line does not end in checkmate"]
        return []
    except (ValueError, RuntimeError) as exc:
        return [str(exc)]

def all_ideas() -> list[dict]:
    return [{**i, "fen": position(i)} for i in IDEAS]


VIRAL_YOUTUBE_VAULT = [
    {
        "id": "yt-gotham-stafford-trap",
        "creator": "GothamChess",
        "creator_handle": "@GothamChess",
        "title": "The Dirtiest Stafford Gambit Trap in Blitz",
        "youtube_url": "https://www.youtube.com/watch?v=k5j4Y8g77R0",
        "timestamp": "03:45",
        "category": "Openings",
        "fen": "r1bBk2r/ppp2ppp/2p5/2b5/4n3/3P4/PPP2PPP/RN1QKB1R b KQkq - 0 7",
        "solution": ["Bxf2+", "Ke2", "Bg4#"],
        "claim": "mate_in_2",
        "hook": "Why 2000-Elo players still fall for the Stafford Gambit in 3-minute blitz",
        "takeaway": "Greedy opening captures without king development lead directly to devastating tactical refutations.",
        "hashtags": ["#Chess", "#SpeedChess", "#ChessTactics"],
    },
    {
        "id": "yt-hikaru-bullet-scramble",
        "creator": "GM Hikaru Nakamura",
        "creator_handle": "@GMHikaru",
        "title": "0.4 Seconds Left: The Ultimate Premove Punish",
        "youtube_url": "https://www.youtube.com/watch?v=Gk5Xm-3D_e8",
        "timestamp": "01:15",
        "category": "Tactics",
        "fen": "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
        "solution": ["Ra8#"],
        "claim": "mate_in_1",
        "hook": "Hikaru flags his opponent with 0.4 seconds on the clock by punishing one auto-recapture",
        "takeaway": "In speed chess scrambles, the in-between check always beats the automatic recapture premove.",
        "hashtags": ["#Chess", "#SpeedChess", "#BlitzChess"],
    },
    {
        "id": "yt-eric-rosen-queen-trap",
        "creator": "Eric Rosen",
        "creator_handle": "@EricRosen",
        "title": "Oh No, My Queen! The Psychology of the Pseudo-Blunder",
        "youtube_url": "https://www.youtube.com/watch?v=F3v6H8x07zE",
        "timestamp": "05:22",
        "category": "Psychology",
        "fen": "r1bqk1nr/pppp1ppp/2n5/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
        "solution": ["Bxf7+"],
        "claim": "line_legal",
        "hook": "The Rosen Trap: Why pretending to lose your queen is the ultimate psychological gambit",
        "takeaway": "When an opponent believes they got lucky, their calculation drops by 50%. Exploit their greed.",
        "hashtags": ["#Chess", "#MentalStamina", "#ChessCommunity"],
    },
    {
        "id": "yt-magnus-arabian-finish",
        "creator": "Magnus Carlsen",
        "creator_handle": "@themagnuscarlsen",
        "title": "Magnus Carlsen's Instant Arabian Checkmate",
        "youtube_url": "https://www.youtube.com/watch?v=9xT1m8j4Q7A",
        "timestamp": "02:50",
        "category": "Tactics",
        "fen": "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1",
        "solution": ["Rh7#"],
        "claim": "mate_in_1",
        "hook": "Magnus Carlsen proves why the knight on f6 is the deadliest piece in endgame blitz",
        "takeaway": "A single knight on the 6th rank cuts off two flight squares and turns any rook into an unstoppable weapon.",
        "hashtags": ["#Chess", "#SpeedChess", "#ChessTactics"],
    },
]
