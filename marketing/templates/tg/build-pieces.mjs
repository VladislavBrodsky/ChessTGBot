#!/usr/bin/env node
/**
 * Renders the chess piece artwork used by the game (react-chessboard's
 * `defaultPieces`) to plain SVG strings -> pieces.json.
 *
 *   node build-pieces.mjs
 *
 * The game imports the same `defaultPieces` map, so Telegram/blog images show
 * exactly the pieces players see in the Mini App. Each key (wP, wN, ... bK)
 * maps to a self-contained <svg viewBox="0 0 45 45"> string.
 *
 * Resolution: react, react-dom and react-chessboard are resolved from
 * frontend/node_modules (nothing is installed by this script). Override the
 * location with W3_FRONTEND_NODE_MODULES if the repo layout differs.
 */
import { createRequire } from 'node:module';
import { writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const nodeModules =
  process.env.W3_FRONTEND_NODE_MODULES ||
  path.resolve(here, '../../../frontend/node_modules');
if (!existsSync(path.join(nodeModules, 'react-chessboard'))) {
  throw new Error(`react-chessboard not found in ${nodeModules}. Set W3_FRONTEND_NODE_MODULES.`);
}
const req = createRequire(path.join(nodeModules, 'noop.js'));

const React = req('react');
const { renderToStaticMarkup } = req('react-dom/server');
// react-chessboard is "type": "module"; load its ESM build explicitly.
const { defaultPieces } = await import(
  pathToFileURL(path.join(nodeModules, 'react-chessboard/dist/index.esm.js')).href
);

const KEYS = ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'];
const out = {};
for (const key of KEYS) {
  const Piece = defaultPieces[key];
  if (typeof Piece !== 'function') throw new Error(`defaultPieces.${key} is missing`);
  // The components accept { fill, svgStyle }; defaults match what the game shows.
  const svg = renderToStaticMarkup(React.createElement(Piece, {}));
  if (!svg.startsWith('<svg') || !svg.includes('viewBox="0 0 45 45"')) {
    throw new Error(`Unexpected markup for ${key}: ${svg.slice(0, 80)}`);
  }
  out[key] = svg;
}

const dest = path.join(here, 'pieces.json');
writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
console.log(`pieces.json written: ${KEYS.length} pieces, ${(JSON.stringify(out).length / 1024).toFixed(1)} KB`);
