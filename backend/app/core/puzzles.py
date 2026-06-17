# 100 Gamified Chess Puzzles Dataset

CHESS_PUZZLES = [
    {
        "id": 1,
        "title": "Smothered Strike",
        "description": "White to play and mate in 1.",
        "fen": "6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1",
        "solution": ["g5f7"],
        "xp_reward": 50
    },
    {
        "id": 2,
        "title": "Back Rank Defeat",
        "description": "White to play and mate in 1 on the back rank.",
        "fen": "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
        "solution": ["e1e8"],
        "xp_reward": 50
    },
    {
        "id": 3,
        "title": "Scholar's Doom",
        "description": "White to play and deliver the final blow.",
        "fen": "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1",
        "solution": ["f3f7"],
        "xp_reward": 50
    },
    {
        "id": 4,
        "title": "Anastasia's Mate",
        "description": "White to play and deliver mate on the h-file.",
        "fen": "r4r1k/1p3pp1/8/3N4/8/8/8/1R1R2K1 w - - 0 1",
        "solution": ["d1d3"],
        "xp_reward": 60
    },
    {
        "id": 5,
        "title": "Tactical Fork",
        "description": "White to play and fork the King and Rook.",
        "fen": "3r4/8/3k4/8/3N4/8/3K4/8 w - - 0 1",
        "solution": ["d4f5"],
        "xp_reward": 60
    },
    {
        "id": 6,
        "title": "Double Checkmate",
        "description": "White to play and mate in 1.",
        "fen": "r1b2r1k/pp3ppp/2n5/2b3N1/2B5/8/PP3PPP/R1B2RK1 w - - 0 1",
        "solution": ["g5f7"],
        "xp_reward": 60
    },
    {
        "id": 7,
        "title": "Corner Trap",
        "description": "White to play and win the Bishop.",
        "fen": "b7/8/8/k7/8/1N6/8/K7 w - - 0 1",
        "solution": ["b3a5"],
        "xp_reward": 70
    },
    {
        "id": 8,
        "title": "Philidor's Gift",
        "description": "White to play and win the queen.",
        "fen": "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1",
        "solution": ["e4d5"],
        "xp_reward": 70
    },
    {
        "id": 9,
        "title": "Rook Skewer",
        "description": "White to play and skewer the black pieces.",
        "fen": "4k3/8/8/8/8/8/4R3/2K2r2 w - - 0 1",
        "solution": ["e2e1"],
        "xp_reward": 80
    },
    {
        "id": 10,
        "title": "Pawn Promotion",
        "description": "White to play and promote the pawn.",
        "fen": "8/4P3/8/k7/8/8/8/K7 w - - 0 1",
        "solution": ["e7e8q"],
        "xp_reward": 80
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
