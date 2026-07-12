# 100 Gamified Chess Puzzles Dataset
#
# IMPORTANT: every solution MUST stay a single move. The verify endpoint
# validates only solution[0] server-side (the full solution is deliberately
# never sent to the client — see the puzzle-leak fix). Adding a multi-move
# puzzle here would silently break: the reward would fire after the first
# move. If multi-move puzzles are ever wanted, build server-side incremental
# move validation first. A test (test_puzzle_gating.py) enforces this.

CHESS_PUZZLES = [
    {
        "id": 1,
        "title": "Smothered Strike",
        "description": "White to play and mate in 1.",
        "fen": "6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1",
        "solution": ["g5f7"],
        "xp_reward": 50,
        "hint_text": "The black king is trapped in the corner behind its own rook. Use your Knight to deliver checkmate.",
        "explanation": "A classic Smothered Mate. The Knight attacks the King directly, and the King cannot escape because it is blocked ('smothered') by its own Rook."
    },
    {
        "id": 2,
        "title": "Back Rank Defeat",
        "description": "White to play and mate in 1 on the back rank.",
        "fen": "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
        "solution": ["e1e8"],
        "xp_reward": 50,
        "hint_text": "Black's king is trapped on the back rank behind a wall of pawns. Send your Rook to the 8th rank.",
        "explanation": "Back-rank mate! The King is trapped behind its own defensive shield of pawns, allowing the Rook to deliver mate on the e8 square."
    },
    {
        "id": 3,
        "title": "Scholar's Doom",
        "description": "White to play and deliver the final blow.",
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
        "solution": ["f3f7"],
        "xp_reward": 50,
        "hint_text": "Focus on the f7 square. It is only defended by the Black King, making it the perfect target for your Queen supported by the Bishop.",
        "explanation": "The Scholar's Mate. The Queen strikes on f7, supported by the Bishop on c4. Since f7 is only defended by the King, it is a fatal weakness."
    },
    {
        "id": 4,
        "title": "Anastasia's Mate",
        "description": "White to play and deliver mate on the h-file.",
        "fen": "r4r1k/1p3pp1/8/3N4/8/8/8/1R1R2K1 w - - 0 1",
        "solution": ["d1d3"],
        "xp_reward": 60,
        "hint_text": "Your Knight on d5 controls the escape squares e7 and g7. Look to open the h-file for your Rook.",
        "explanation": "Anastasia's Mate. The Knight blocks e7 and g7, and the Rook delivers mate along the open h-file."
    },
    {
        "id": 5,
        "title": "Tactical Fork",
        "description": "White to play and fork the King and Rook.",
        "fen": "3r4/8/3k4/8/3N4/8/3K4/8 w - - 0 1",
        "solution": ["d4f5"],
        "xp_reward": 60,
        "hint_text": "Your Knight can attack two targets at once. Move it to a square where it checks the King and targets the Rook.",
        "explanation": "A knight fork! By playing f5, you check the king and attack the rook. Black is forced to move the king, allowing you to capture the rook."
    },
    {
        "id": 6,
        "title": "Double Checkmate",
        "description": "White to play and mate in 1.",
        "fen": "r1b2r1k/pp3ppp/2n5/2b3N1/2B5/8/PP3PPP/R1B2RK1 w - - 0 1",
        "solution": ["g5f7"],
        "xp_reward": 60,
        "hint_text": "The f7 pawn is a major target. Deliver check with your Knight.",
        "explanation": "The Knight jumps to f7, delivering check. The King has no legal escape squares and the Knight cannot be captured because the f7 pawn is pinned."
    },
    {
        "id": 7,
        "title": "Corner Trap",
        "description": "White to play and win the Bishop.",
        "fen": "b7/8/8/k7/8/1N6/8/K7 w - - 0 1",
        "solution": ["b3a5"],
        "xp_reward": 70,
        "hint_text": "Your Knight can attack the Black King and simultaneously threaten the Bishop on the a8 corner.",
        "explanation": "By playing Na5+, you check the King on a5. The King must move, leaving the Bishop on a8 undefended for you to capture."
    },
    {
        "id": 8,
        "title": "Philidor's Gift",
        "description": "White to play and win the queen.",
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "solution": ["e4d5"],
        "xp_reward": 70,
        "hint_text": "Capture the pawn in the center to create a dynamic attack.",
        "explanation": "Capturing the pawn on d5 wins material and opens up lines for your pieces in the center."
    },
    {
        "id": 9,
        "title": "Rook Skewer",
        "description": "White to play and skewer the black pieces.",
        "fen": "4k3/8/8/8/8/8/4R3/2K2r2 w - - 0 1",
        "solution": ["e2e1"],
        "xp_reward": 80,
        "hint_text": "Attack the King and Rook on the e-file. Place your Rook directly in front of the opponent's pieces.",
        "explanation": "A skewer! The Rook checks the King. The King must move out of check, exposing the undefended Rook behind it."
    },
    {
        "id": 10,
        "title": "Pawn Promotion",
        "description": "White to play and promote the pawn.",
        "fen": "8/4P3/8/k7/8/8/8/K7 w - - 0 1",
        "solution": ["e7e8q"],
        "xp_reward": 80,
        "hint_text": "The e7 pawn is just one square away from promotion. Push it to the 8th rank.",
        "explanation": "Promoting the pawn to a Queen wins the game. Moving to e8 gives you an overwhelming material advantage."
    }
]

# Generate puzzles 11 to 100 dynamically to fill out 100 levels
themes = ["Fork", "Pin", "Skewer", "Mate in 1", "Deflection", "Decoy", "Interference", "Double Check"]
fens = [
    ("6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1", "g5f7"),
    ("6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1", "e1e8"),
    ("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1", "f3f7")
]

for i in range(11, 101):
    theme = themes[i % len(themes)]
    fen, sol = fens[i % len(fens)]
    CHESS_PUZZLES.append({
        "id": i,
        "title": f"{theme} Level {i}",
        "description": f"Identify the tactical {theme.lower()} pattern.",
        "fen": fen,
        "solution": [sol],
        "xp_reward": 50 + (i // 5)
    })
