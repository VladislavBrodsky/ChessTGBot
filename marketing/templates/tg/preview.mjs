#!/usr/bin/env node
/**
 * node preview.mjs            render every samples/*.json -> out/<name>.png + out/contact-sheet.png
 * node preview.mjs --matrix   render every template at every allowed size (QA matrix) -> out/matrix/
 * node preview.mjs --edge     run samples/edge/*.json; each has "_expect": "ok" | "fail" (+ "_match" text)
 * node preview.mjs --all      all of the above
 */
import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer, QaError } from './render.mjs';
import { TEMPLATES } from './templates/index.mjs';
import { SIZES, PUBLIC_SIZES } from './lib/frame.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'out');
const args = new Set(process.argv.slice(2));
const all = args.has('--all');
const doSamples = all || !(args.has('--matrix') || args.has('--edge'));

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const listJson = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : []);
const ORDER = ['puzzle', 'puzzle-reveal', 'trap', 'poll', 'news', 'culture', 'tip', 'rules', 'product', 'cover'];

mkdirSync(OUT, { recursive: true });
const r = await createRenderer();
let failures = 0;

async function tryRender(label, spec, outPath) {
  const t0 = Date.now();
  try {
    await r.render(spec, outPath);
    console.log(`  ok    ${label}  (${Date.now() - t0} ms)`);
    return true;
  } catch (e) {
    failures++;
    console.log(`  FAIL  ${label}\n${String(e.message).split('\n').map((l) => '        ' + l).join('\n')}`);
    return false;
  }
}

if (doSamples) {
  console.log('Samples');
  const names = listJson(path.join(here, 'samples')).map((f) => f.replace('.json', ''));
  names.sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99));
  const done = [];
  for (const n of names) {
    const spec = readJson(path.join(here, 'samples', `${n}.json`));
    if (await tryRender(n, spec, path.join(OUT, `${n}.png`))) done.push({ n, spec });
  }
  await contactSheet(done);
}

if (args.has('--matrix') || all) {
  console.log('Matrix (every template x allowed size)');
  const mdir = path.join(OUT, 'matrix');
  rmSync(mdir, { recursive: true, force: true });
  const rendered = [];
  for (const f of listJson(path.join(here, 'samples'))) {
    const id = f.replace('.json', '');
    const base = readJson(path.join(here, 'samples', f));
    for (const size of TEMPLATES[base.template].sizes || PUBLIC_SIZES) {
      const file = path.join(mdir, `${id}-${size}.png`);
      if (await tryRender(`${id}/${size}`, { ...base, size }, file)) rendered.push({ n: `${id}-${size}`, file, spec: { ...base, size } });
    }
  }
  await contactSheet(rendered, 'matrix-sheet.png', { cell: 300, cols: 6 });
}

if (args.has('--edge') || all) {
  console.log('Edge cases');
  const edir = path.join(here, 'samples', 'edge');
  for (const f of listJson(edir)) {
    const spec = readJson(path.join(edir, f));
    const expect = spec._expect || 'ok';
    const needle = spec._match;
    try {
      await r.render(spec, path.join(OUT, 'edge', f.replace('.json', '.png')));
      if (expect === 'ok') console.log(`  ok    ${f}`);
      else { failures++; console.log(`  FAIL  ${f}: expected a QA failure but it rendered`); }
    } catch (e) {
      const msg = String(e.message);
      if (expect === 'fail' && (!needle || msg.includes(needle))) console.log(`  ok    ${f}  (failed loudly as expected: ${msg.split('\n').slice(0, 2).join(' ').slice(0, 150)})`);
      else { failures++; console.log(`  FAIL  ${f}: ${expect === 'ok' ? 'unexpected error' : 'wrong error'}\n        ${msg.split('\n').join('\n        ')}`); }
    }
  }
}

await r.close();
console.log(failures ? `\n${failures} failure(s)` : '\nall good');
process.exit(failures ? 1 : 0);

/** Contact sheet: every rendered sample on one page, built with the same Chromium (offline, file: images). */
async function contactSheet(items, name = 'contact-sheet.png', { cell = 360, cols = 5 } = {}) {
  if (!items.length) return;
  const { createRequire } = await import('node:module');
  const { NODE_MODULES } = await import('./lib/chess.mjs');
  const { chromium } = createRequire(path.join(NODE_MODULES, 'noop.js'))('playwright');
  const gap = 24;
  const tiles = items
    .map(({ n, spec, file }) => {
      const sz = SIZES[spec.size || TEMPLATES[spec.template].defaultSize || 'portrait'];
      const w = cell;
      const h = Math.round((cell * sz.h) / sz.w);
      const b64 = readFileSync(file || path.join(OUT, `${n}.png`)).toString('base64');
      return `<figure style="width:${w}px"><img src="data:image/png;base64,${b64}" width="${w}" height="${h}"><figcaption>${n} <i>${sz.w}x${sz.h}</i></figcaption></figure>`;
    })
    .join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
  body{margin:0;background:#1a1a1a;font:600 15px system-ui,sans-serif;color:#c6c6c6;padding:${gap}px}
  .g{display:flex;flex-wrap:wrap;gap:${gap}px;width:${cols * cell + (cols - 1) * gap}px;align-items:flex-start}
  figure{margin:0}img{display:block;border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
  figcaption{margin-top:8px}i{font-weight:400;color:#979797;margin-left:6px}
  h1{margin:0 0 ${gap}px;font:700 22px system-ui;color:#fff}</style>
  <h1>Web3Chess Telegram templates</h1><div class="g">${tiles}</div>`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: cols * cell + (cols + 1) * gap, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: path.join(OUT, name), fullPage: true });
  await browser.close();
  console.log(`  contact sheet -> ${path.join(OUT, name)}`);
}
