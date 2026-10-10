// Chessboard renderer. Output is HTML: a CSS-grid frame (coordinates live in the frame ring)
// around one SVG grid. The SVG uses 100 units per square; the page script sets --sq (an
// INTEGER pixel size) so every square edge lands on a whole pixel (crisp, no seams).
import { loadAssets } from './assets.mjs';
import { parseFen, isSquare, isKnightMove, START_FEN } from './chess.mjs';
import { esc } from './ui.mjs';

export const BOARD = {
  light: '#f3f3f3', // tokens.json board.squareLight (mist)
  dark: '#979797', //  tokens.json board.squareDark (smoke)
  highlight: '#fff100', // voltage yellow
  frame: '#000000',
};
const PIECE_SCALE = 1.1; // react-chessboard pieces leave a margin inside the 45 box; fill the square a bit more

function coords(sq, orientation) {
  const file = sq.charCodeAt(0) - 97;
  const rank = +sq[1] - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  return { cx: col * 100 + 50, cy: row * 100 + 50, x: col * 100, y: row * 100 };
}

/** Arrow path in board units. Knight moves use an L-shaped arrow like most chess UIs. */
function arrowSvg(from, to, orientation, { fill = BOARD.highlight, outline = '#000' } = {}) {
  const a = coords(from, orientation);
  const b = coords(to, orientation);
  let pts;
  if (isKnightMove(from, to)) {
    const dx = Math.abs(b.cx - a.cx);
    // move along the long axis first, then the short one
    pts = dx > 150 ? [[a.cx, a.cy], [b.cx, a.cy], [b.cx, b.cy]] : [[a.cx, a.cy], [a.cx, b.cy], [b.cx, b.cy]];
  } else {
    pts = [[a.cx, a.cy], [b.cx, b.cy]];
  }
  // Start a little off the piece centre, and end the shaft where the head begins.
  const headLen = 56;
  const halfW = 38;
  const trim = (from, to, d) => {
    const L = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return [from[0] + ((to[0] - from[0]) / L) * d, from[1] + ((to[1] - from[1]) / L) * d];
  };
  pts[0] = trim(pts[0], pts[1], 26);
  const [lx, ly] = pts[pts.length - 1];
  const [px, py] = pts[pts.length - 2];
  const len = Math.hypot(lx - px, ly - py);
  const ux = (lx - px) / len;
  const uy = (ly - py) / len;
  const bx = lx - ux * headLen;
  const by = ly - uy * headLen;
  const body = pts.slice(0, -1).concat([[bx + ux * 6, by + uy * 6]]).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const nx = -uy;
  const ny = ux;
  const tri = `${lx.toFixed(1)},${ly.toFixed(1)} ${(bx + nx * halfW).toFixed(1)},${(by + ny * halfW).toFixed(1)} ${(bx - nx * halfW).toFixed(1)},${(by - ny * halfW).toFixed(1)}`;
  return `<g class="arrow" stroke-linejoin="round" stroke-linecap="butt">
    <polyline points="${body}" fill="none" stroke="${outline}" stroke-width="26"/>
    <polygon points="${tri}" fill="${outline}" stroke="${outline}" stroke-width="12"/>
    <polyline points="${body}" fill="none" stroke="${fill}" stroke-width="14"/>
    <polygon points="${tri}" fill="${fill}"/>
  </g>`;
}

function markerSvg(letter, square, orientation, occupied) {
  const c = coords(square, orientation);
  // Empty target: big centred disc. Occupied target: corner badge so the piece stays readable.
  const r = occupied ? 30 : 38;
  const cx = occupied ? c.x + 100 - r - 2 : c.cx;
  const cy = occupied ? c.y + r + 2 : c.cy;
  return `<g class="marker"><circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="#fff"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#000"/><text x="${cx}" y="${cy + r * 0.38}" text-anchor="middle" font-family="Onest" font-weight="700" font-size="${r * 1.15}" fill="#d1ffca">${esc(letter)}</text></g>`;
}

/**
 * @param {object} o
 * @param {string} o.fen
 * @param {'white'|'black'} [o.orientation]
 * @param {string[]} [o.highlight]  squares to tint voltage yellow
 * @param {{from,to}[]} [o.arrows]
 * @param {{letter,square}[]} [o.markers]
 * @param {string} [o.cls] extra class (e.g. 'board-sm')
 */
let uid = 0;
export function boardHtml({ fen = START_FEN, orientation = 'white', highlight = [], arrows = [], markers = [], cls = '', pieceFilter = true, coords: showCoords = true, ring = null, max = null }) {
  const gid = `sheen${++uid}`;
  const { board } = parseFen(fen);
  const { pieces } = loadAssets();
  if (!['white', 'black'].includes(orientation)) throw new Error(`orientation must be 'white' or 'black', got "${orientation}"`);
  for (const s of highlight) if (!isSquare(s)) throw new Error(`highlight: "${s}" is not a square (a1-h8)`);
  const hs = new Set(highlight);

  let squares = '';
  let hl = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      squares += `<rect x="${col * 100}" y="${row * 100}" width="100" height="100" fill="${(row + col) % 2 === 0 ? BOARD.light : BOARD.dark}"/>`;
    }
  }
  for (const s of hs) {
    const { x, y } = coords(s, orientation);
    hl += `<rect x="${x}" y="${y}" width="100" height="100" fill="${BOARD.highlight}" fill-opacity=".78"/>`;
  }
  let pcs = '';
  const k = (100 / 45) * PIECE_SCALE;
  const off = (100 - 45 * k) / 2;
  for (const [sq, key] of board) {
    const { x, y } = coords(sq, orientation);
    pcs += `<g transform="translate(${(x + off).toFixed(2)} ${(y + off).toFixed(2)}) scale(${k.toFixed(4)})">${pieces[key]}</g>`;
  }
  const arr = arrows.map((a) => {
    if (!isSquare(a.from) || !isSquare(a.to)) throw new Error(`arrow: invalid squares ${JSON.stringify(a)}`);
    return arrowSvg(a.from, a.to, orientation);
  }).join('');
  const mk = markers.map((m) => {
    if (!isSquare(m.square)) throw new Error(`marker: "${m.square}" is not a square`);
    return markerSvg(m.letter, m.square, orientation, board.has(m.square));
  }).join('');

  const files = 'abcdefgh'.split('');
  const ranks = '87654321'.split('');
  const fl = (orientation === 'white' ? files : [...files].reverse()).map((f) => `<span>${f}</span>`).join('');
  const rk = (orientation === 'white' ? ranks : [...ranks].reverse()).map((r) => `<span>${r}</span>`).join('');

  const style = ring != null ? ` style="--ring:${ring}px"` : '';
  return `<div class="board ${showCoords ? '' : 'no-coords '}${cls}" data-board data-safe data-bg="#000000"${max ? ` data-board-max="${max}"` : ''}${style}>
  <div class="b-ranks" aria-hidden="true">${showCoords ? rk : ''}</div>
  <svg class="b-grid" viewBox="0 0 800 800" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
    ${squares}${hl}
    <g class="pieces${pieceFilter ? ' shadowed' : ''}" shape-rendering="geometricPrecision">${pcs}</g>
    <g shape-rendering="geometricPrecision">${arr}${mk}</g>
    <rect width="800" height="800" fill="url(#${gid})" pointer-events="none"/>
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient></defs>
  </svg>
  <div class="b-files" aria-hidden="true">${showCoords ? fl : ''}</div>
</div>`;
}

/**
 * Decorative board for backgrounds (no frame, no coordinates): translucent squares + pieces.
 * Used as texture; callers place and fade it with CSS.
 */
export function motifSvg({ fen = START_FEN, orientation = 'white', light = 'rgba(255,255,255,.10)', dark = 'rgba(255,255,255,0)', pieceOpacity = 0.9, pieceTone = 'light' }) {
  const { board } = parseFen(fen);
  const { pieces } = loadAssets();
  let sq = '';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    sq += `<rect x="${col * 100}" y="${row * 100}" width="100" height="100" fill="${(row + col) % 2 === 0 ? light : dark}"/>`;
  }
  let pcs = '';
  const k = (100 / 45) * PIECE_SCALE;
  const off = (100 - 45 * k) / 2;
  for (const [s, key] of board) {
    const { x, y } = coords(s, orientation);
    pcs += `<g transform="translate(${(x + off).toFixed(2)} ${(y + off).toFixed(2)}) scale(${k.toFixed(4)})">${pieces[key]}</g>`;
  }
  return `<svg class="motif" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${sq}<g opacity="${pieceOpacity}" style="filter:${pieceTone === 'light' ? 'brightness(0) invert(1)' : 'brightness(0)'}">${pcs}</g></svg>`;
}
