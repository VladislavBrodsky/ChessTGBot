// Position helpers. chess.js (installed in frontend/node_modules) validates that a FEN
// is a legal position and that SAN moves are legal - the QA gate for chess content.
import { createRequire } from 'node:module';
import path from 'node:path';
import { REPO } from './assets.mjs';

export const NODE_MODULES =
  process.env.W3_FRONTEND_NODE_MODULES || path.join(REPO, 'frontend/node_modules');
export const requireFromFrontend = createRequire(path.join(NODE_MODULES, 'noop.js'));
const { Chess } = requireFromFrontend('chess.js');

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const SQUARE_RE = /^[a-h][1-8]$/;

export function isSquare(s) {
  return typeof s === 'string' && SQUARE_RE.test(s);
}

/** Parse + validate a FEN. Returns { board: Map<square, 'wP'|...>, turn: 'w'|'b', fen }. */
export function parseFen(fen) {
  let game;
  try {
    game = new Chess(fen);
  } catch (e) {
    throw new Error(`Invalid FEN "${fen}": ${e.message}`);
  }
  const board = new Map();
  for (const row of game.board()) {
    for (const cell of row) {
      if (cell) board.set(cell.square, cell.color + cell.type.toUpperCase());
    }
  }
  return { board, turn: game.turn(), fen: game.fen(), game };
}

/** Replay SAN moves from a FEN. Returns [{san, from, to, piece, color}] or throws on an illegal move. */
export function replay(fen, moves) {
  const game = new Chess(fen);
  const out = [];
  for (const san of moves) {
    let m;
    try {
      m = game.move(san);
    } catch {
      m = null;
    }
    if (!m) throw new Error(`Illegal move "${san}" in position ${game.fen()} (line: ${moves.join(' ')})`);
    out.push({ san: m.san, from: m.from, to: m.to, piece: m.piece, color: m.color });
  }
  return out;
}

/** Is a SAN token plausible even if we can't replay it (trap lines shown without start FEN)? */
export function looksLikeSan(s) {
  return typeof s === 'string' && /^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?|[a-h]x?[a-h]?[1-8]?(=[QRBN])?)[+#]?[!?]{0,2}$/.test(s.trim());
}

export function isKnightMove(from, to) {
  const dx = Math.abs(from.charCodeAt(0) - to.charCodeAt(0));
  const dy = Math.abs(+from[1] - +to[1]);
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}
