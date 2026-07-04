import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// PST tables favouring center control and development, matching game_engine.py exactly
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    // If it's White's turn, it means Black delivered checkmate (favor Black, negative score)
    return chess.turn() === "w" ? -99999 : 99999;
  }
  if (chess.isDraw()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      const isWhite = piece.color === "w";
      
      // Material evaluation
      if (isWhite) {
        score += val;
      } else {
        score -= val;
      }

      // Positional evaluation using mirrors for White to align PST orientation
      const sq = (7 - r) * 8 + c;
      if (piece.type === "p") {
        if (isWhite) {
          score += PAWN_PST[sq ^ 56];
        } else {
          score -= PAWN_PST[sq];
        }
      } else if (piece.type === "n") {
        if (isWhite) {
          score += KNIGHT_PST[sq ^ 56];
        } else {
          score -= KNIGHT_PST[sq];
        }
      } else if (piece.type === "b") {
        if (isWhite) {
          score += BISHOP_PST[sq ^ 56];
        } else {
          score -= BISHOP_PST[sq];
        }
      }
    }
  }

  // Small random offset to prevent predictable play
  score += Math.floor(Math.random() * 11) - 5;
  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): [number, { from: string; to: string; promotion?: string } | null] {
  if (depth === 0 || chess.isGameOver()) {
    return [evaluateBoard(chess), null];
  }

  const verboseMoves = chess.moves({ verbose: true });
  
  // Optimization: Sort captures first to maximize alpha-beta pruning efficiency
  verboseMoves.sort((a, b) => {
    const aCap = a.captured ? 1 : 0;
    const bCap = b.captured ? 1 : 0;
    return bCap - aCap;
  });

  let bestMove: { from: string; to: string; promotion?: string } | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of verboseMoves) {
      const moveObj = { from: move.from, to: move.to, promotion: move.promotion };
      chess.move(moveObj);
      const [evalVal] = minimax(depth - 1, alpha, beta, false);
      chess.undo();
      
      if (evalVal > maxEval) {
        maxEval = evalVal;
        bestMove = moveObj;
      }
      alpha = Math.max(alpha, evalVal);
      if (beta <= alpha) {
        break;
      }
    }
    return [maxEval, bestMove];
  } else {
    let minEval = Infinity;
    for (const move of verboseMoves) {
      const moveObj = { from: move.from, to: move.to, promotion: move.promotion };
      chess.move(moveObj);
      const [evalVal] = minimax(depth - 1, alpha, beta, true);
      chess.undo();
      
      if (evalVal < minEval) {
        minEval = evalVal;
        bestMove = moveObj;
      }
      beta = Math.min(beta, evalVal);
      if (beta <= alpha) {
        break;
      }
    }
    return [minEval, bestMove];
  }
}

/**
 * Calculates the best bot move locally on the client.
 * Easy Mode (depth 2 + 25% blunder rate)
 * Medium Mode (depth 3)
 * Hard Mode (depth 4)
 */
export function computeClientBotMove(fen: string, difficulty: string = "medium"): string | null {
  const chess = new Chess(fen);
  if (chess.isGameOver()) {
    return null;
  }

  // 1. Easy Mode Blunder Check
  if (difficulty === "easy" && Math.random() < 0.25) {
    const moves = chess.moves({ verbose: true });
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      return randomMove.from + randomMove.to + (randomMove.promotion || "");
    }
    return null;
  }

  // 2. Determine minimax depth (Easy=2, Medium=3, Hard=4)
  const depth = difficulty === "easy" ? 2 : (difficulty === "hard" ? 4 : 3);
  
  // 3. Compute optimal move. The bot plays Black (minimizing player).
  const [, bestMove] = minimax(chess, depth, -Infinity, Infinity, false);
  
  if (bestMove) {
    return bestMove.from + bestMove.to + (bestMove.promotion || "");
  }

  // Fallback to first available legal move
  const moves = chess.moves({ verbose: true });
  if (moves.length > 0) {
    const firstMove = moves[0];
    return firstMove.from + firstMove.to + (firstMove.promotion || "");
  }
  
  return null;
}
