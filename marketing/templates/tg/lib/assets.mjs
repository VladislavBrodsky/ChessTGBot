// Loads brand assets (fonts, logo lockups, 3D sculpture, pieces) once and exposes
// them as data: URIs / inline SVG so the render page needs no network or file access.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const TG_DIR = path.resolve(here, '..');
export const REPO = path.resolve(TG_DIR, '../../..');
const PUBLIC = path.join(REPO, 'website/public');

function must(p) {
  if (!existsSync(p)) throw new Error(`Brand asset missing: ${p}`);
  return p;
}
const b64 = (p) => readFileSync(must(p)).toString('base64');

let cache = null;

export function loadAssets() {
  if (cache) return cache;

  // Pieces: built by build-pieces.mjs from react-chessboard. Strip the outer <svg>
  // wrapper and any Inkscape ids so many pieces can live in one SVG document.
  const piecesPath = path.join(TG_DIR, 'pieces.json');
  if (!existsSync(piecesPath)) throw new Error('pieces.json missing - run: node build-pieces.mjs');
  const raw = JSON.parse(readFileSync(piecesPath, 'utf8'));
  const pieces = {};
  for (const [k, svg] of Object.entries(raw)) {
    pieces[k] = svg
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
      .replace(/ id="[^"]*"/g, '');
  }

  const logoSvg = (name) =>
    readFileSync(must(path.join(PUBLIC, 'brand', name)), 'utf8').replace(
      '<svg ',
      '<svg class="logo-svg" role="img" aria-label="Web3Chess" ',
    );

  cache = {
    pieces,
    // Barlow Condensed Bold: display headlines. Onest variable (400-700): everything else.
    fontCss: `
@font-face{font-family:"Barlow Condensed";font-weight:700;font-style:normal;src:url(data:font/woff2;base64,${b64(path.join(PUBLIC, 'fonts/barlow-condensed-bold.woff2'))}) format("woff2");}
@font-face{font-family:"Onest";font-weight:400 700;font-style:normal;src:url(data:font/woff2;base64,${b64(path.join(PUBLIC, 'fonts/onest-variable.woff2'))}) format("woff2");}`,
    logo: { ink: logoSvg('w3chess-logo-inverse.svg'), light: logoSvg('w3chess-logo.svg') },
    mark: {
      ink: readFileSync(path.join(PUBLIC, 'brand/w3chess-mark-inverse.svg'), 'utf8'),
      light: readFileSync(path.join(PUBLIC, 'brand/w3chess-mark.svg'), 'utf8'),
    },
    // Contextual 3D sculpture used on the website (knight / rook / pawn on a board).
    sculpture: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-sculpture.webp'))}`, // 1000px, alpha
    illustrations: {
      sculpture: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-sculpture.webp'))}`,
      clock: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-clock.webp'))}`,
      stakes: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-stakes.webp'))}`,
      fairPlay: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-fair-play.webp'))}`,
      academy: `data:image/webp;base64,${b64(path.join(PUBLIC, 'illustrations/chess-academy.webp'))}`,
    },
  };
  return cache;
}
