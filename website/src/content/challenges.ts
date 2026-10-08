export const CHALLENGES = [
  {
    id: "back-rank",
    name: "Back-rank mate",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    answer: "Ra8#",
    from: "a1",
    to: "a8",
    hint: "The rook can reach the eighth rank. The black king’s own pawns block its escape.",
    explanation:
      "1. Ra8# gives check along the back rank. The black king has no safe square.",
    label:
      "White: king g1, rook a1, pawns f2 g2 h2. Black: king g8, pawns f7 g7 h7. White to move, mate in one.",
  },
  {
    id: "queen",
    name: "Queen & king",
    fen: "7k/6pp/5KQ1/8/8/8/8/8 w - - 0 1",
    answer: "Qxg7#",
    from: "g6",
    to: "g7",
    hint: "Look for a queen capture protected by the white king.",
    explanation:
      "1. Qxg7# works because the white king protects the queen on g7. Black cannot capture or escape.",
    label:
      "White: king f6, queen g6. Black: king h8, pawns g7 h7. White to move, mate in one.",
  },
  {
    id: "smothered",
    name: "Smothered mate",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    answer: "Nf7#",
    from: "g5",
    to: "f7",
    hint: "A knight can jump over defenders. Find a square that attacks h8.",
    explanation:
      "1. Nf7# is smothered mate: the knight checks h8 while Black’s pieces occupy every escape square.",
    label:
      "White: king g1, knight g5. Black: king h8, rook g8, pawns g7 h7. White to move, mate in one.",
  },
] as const;
