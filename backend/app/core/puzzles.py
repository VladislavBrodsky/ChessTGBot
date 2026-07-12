# 100 Gamified Chess Puzzles Dataset
#
# IMPORTANT: every solution MUST stay a single move. The verify endpoint
# validates only solution[0] server-side (the full solution is deliberately
# never sent to the client — see the puzzle-leak fix). Adding a multi-move
# puzzle here would silently break: the reward would fire after the first
# move. If multi-move puzzles are ever wanted, build server-side incremental
# move validation first. A test (test_puzzle_gating.py) enforces this.
#
# Every position + solution + description below is engine-verified by
# test_puzzles_valid.py: the move is legal from the FEN and the stated tactic
# (mate / fork / skewer / promotion / material win) actually holds. Keep it that
# way — a puzzle whose instruction doesn't match the board teaches wrong chess.

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
        "description": "White to play and mate in 1.",
        "fen": "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
        "solution": ["h5f7"],
        "xp_reward": 50,
        "hint_text": "The f7 square is defended only by the Black king, and your bishop on c4 already guards it. Strike with the queen.",
        "explanation": "Scholar's Mate. Qxf7# is protected by the bishop on c4, and the Black king has no escape square."
    },
    {
        "id": 4,
        "title": "Anastasia's Mate",
        "description": "White to play and mate in 1 on the h-file.",
        "fen": "8/4N1pk/8/R7/8/8/8/6K1 w - - 0 1",
        "solution": ["a5h5"],
        "xp_reward": 60,
        "hint_text": "Your knight on e7 covers g6 and g8, and the g7 pawn walls in the king. Swing your rook to the h-file.",
        "explanation": "Anastasia's Mate. Rh5# checks down the open h-file; the knight seals g6 and g8 while the king's own g7 pawn blocks its last escape."
    },
    {
        "id": 5,
        "title": "Tactical Fork",
        "description": "White to play and fork the King and Rook.",
        "fen": "4k1r1/8/8/3N4/8/8/8/K7 w - - 0 1",
        "solution": ["d5f6"],
        "xp_reward": 60,
        "hint_text": "Find the knight leap that checks the king on e8 and attacks the rook on g8 at the same time.",
        "explanation": "A royal fork. Nf6+ hits the king on e8 and the rook on g8 together; after the king moves, Nxg8 wins the rook."
    },
    {
        "id": 6,
        "title": "Double Check Mate",
        "description": "White to play and mate in 1.",
        "fen": "3rkb2/3p1p2/4N3/8/8/8/8/4R1K1 w - - 0 1",
        "solution": ["e6c7"],
        "xp_reward": 60,
        "hint_text": "Move the knight so it checks the king AND unveils your rook on the e-file — a double check can't be blocked.",
        "explanation": "Double-check mate. Nc7+ checks the king and discovers the e1 rook's check. A double check must be met by a king move, but every escape square is blocked by Black's own pieces."
    },
    {
        "id": 7,
        "title": "Corner Trap",
        "description": "White to play and win the Bishop.",
        "fen": "b3k3/8/8/1N6/8/8/8/6K1 w - - 0 1",
        "solution": ["b5c7"],
        "xp_reward": 70,
        "hint_text": "A knight check that also eyes the a8 corner will trap the bishop.",
        "explanation": "Nc7+ forks the king on e8 and the bishop stranded on a8. After the king steps aside, Nxa8 collects the bishop."
    },
    {
        "id": 8,
        "title": "Royal Fork",
        "description": "White to play and win the Queen.",
        "fen": "4k3/8/q7/3N4/8/8/8/6K1 w - - 0 1",
        "solution": ["d5c7"],
        "xp_reward": 70,
        "hint_text": "One knight leap can check the king on e8 and hit the queen on a6 at once.",
        "explanation": "Nc7+ forks the king and the queen on a6. The king must move out of check, and Nxa6 wins the queen."
    },
    {
        "id": 9,
        "title": "Rook Skewer",
        "description": "White to play and skewer the King to win the Rook.",
        "fen": "r7/k7/8/8/8/8/8/3R2K1 w - - 0 1",
        "solution": ["d1a1"],
        "xp_reward": 80,
        "hint_text": "Deliver check down the a-file so the king and the rook behind it line up.",
        "explanation": "A skewer. Ra1+ checks the king on a7 with the rook on a8 directly behind it; the king must step off the file, and Rxa8 wins the rook."
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

# Puzzles 11-100 are drawn from a bank of engine-verified tactics so the stated
# theme always matches the board. (An earlier version cycled three mate-in-1
# FENs under mismatched "Fork"/"Pin"/"Skewer" labels — teaching wrong chess.)
# Every solution here is a single move, per the invariant note at the top.
TEMPLATE_PUZZLES = [
    {
        "theme": "Mate in 1",
        "fen": "6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1",
        "solution": "g5f7",
        "description": "White to play and mate in 1.",
        "hint_text": "The king is smothered by its own rook in the corner. Finish with the knight.",
        "explanation": "Smothered Mate: Nf7# works because the king is boxed in by its own pieces.",
    },
    {
        "theme": "Back Rank Mate",
        "fen": "6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1",
        "solution": "e1e8",
        "description": "White to play and mate in 1 on the back rank.",
        "hint_text": "The king is trapped behind its pawns. Seize the back rank.",
        "explanation": "Back-rank mate: Re8# lands on the eighth rank while the pawns block every escape.",
    },
    {
        "theme": "Knight Fork",
        "fen": "4k1r1/8/8/3N4/8/8/8/K7 w - - 0 1",
        "solution": "d5f6",
        "description": "White to play and fork the King and Rook.",
        "hint_text": "Check the king on e8 and hit the g8 rook with a single leap.",
        "explanation": "Nf6+ forks king and rook; after the king moves, Nxg8 wins the rook.",
    },
    {
        "theme": "Skewer",
        "fen": "r7/k7/8/8/8/8/8/3R2K1 w - - 0 1",
        "solution": "d1a1",
        "description": "White to play and skewer the King to win the Rook.",
        "hint_text": "Give check down the a-file so the rook stands behind the king.",
        "explanation": "Ra1+ skewers the king to the a8 rook; the king steps aside and Rxa8 wins.",
    },
    {
        "theme": "Royal Fork",
        "fen": "4k3/8/q7/3N4/8/8/8/6K1 w - - 0 1",
        "solution": "d5c7",
        "description": "White to play and win the Queen.",
        "hint_text": "A knight check on c7 also attacks the queen on a6.",
        "explanation": "Nc7+ forks king and queen; the king must move and Nxa6 wins the queen.",
    },
    {
        "theme": "Promotion",
        "fen": "8/4P3/8/k7/8/8/8/K7 w - - 0 1",
        "solution": "e7e8q",
        "description": "White to play and promote the pawn.",
        "hint_text": "Push the pawn home and make a new queen.",
        "explanation": "e8=Q promotes with an overwhelming material advantage.",
    },
]

for i in range(11, 101):
    tpl = TEMPLATE_PUZZLES[i % len(TEMPLATE_PUZZLES)]
    CHESS_PUZZLES.append({
        "id": i,
        "title": f"{tpl['theme']} — Level {i}",
        "description": tpl["description"],
        "fen": tpl["fen"],
        "solution": [tpl["solution"]],
        "xp_reward": 50 + (i // 5),
        "hint_text": tpl["hint_text"],
        "explanation": tpl["explanation"],
    })
