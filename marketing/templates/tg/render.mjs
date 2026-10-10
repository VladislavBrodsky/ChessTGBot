#!/usr/bin/env node
/**
 * Web3Chess Telegram / blog image engine.
 *
 *   CLI:     node render.mjs <spec.json> <out.png>
 *   Import:  import { render, createRenderer } from './render.mjs'
 *            const png = await render(spec, 'out.png')            // one-shot
 *            const r = await createRenderer(); await r.render(spec1, 'a.png'); ...; await r.close()
 *
 * Pipeline: validate spec -> template builds HTML parts -> Chromium (offline, deterministic)
 * lays it out -> in-page script fits text, snaps the board to whole pixels and runs the QA
 * gate (overflow, safe margin, overlap, max lines, WCAG AA contrast, minimum text size) ->
 * PNG at deviceScaleFactor 1 at the exact pixel size. Any QA failure throws QaError.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { NODE_MODULES } from './lib/chess.mjs';
import { SIZES, PUBLIC_SIZES, THEMES, SAFE_MARGIN, pageHtml } from './lib/frame.mjs';
import { TEMPLATES } from './templates/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(NODE_MODULES, 'noop.js'))('playwright');
const PAGE_SCRIPT = readFileSync(path.join(here, 'lib/page.js'), 'utf8');

export class QaError extends Error {
  constructor(spec, problems) {
    super(`QA failed for template "${spec?.template}" (${problems.length} problem${problems.length === 1 ? '' : 's'}):\n  - ${problems.join('\n  - ')}`);
    this.name = 'QaError';
    this.problems = problems;
  }
}

const COMMON_FIELDS = new Set([
  'template', 'size', 'headline', 'subhead', 'tag', 'fen', 'orientation', 'highlight', 'arrow', 'moves', 'options', 'steps',
  'stake', 'cta_label', 'footer', 'reveal', 'theme',
]);

/** Validate + normalise a spec. Returns { spec, size, themeName, template }. */
export function prepare(input) {
  if (!input || typeof input !== 'object') throw new Error('spec must be a JSON object');
  const spec = { ...input };
  const template = TEMPLATES[spec.template];
  if (!template) throw new Error(`Unknown template "${spec.template}". Available: ${Object.keys(TEMPLATES).join(', ')}`);

  const allowed = new Set([...COMMON_FIELDS, ...(template.extraFields || [])]);
  for (const k of Object.keys(spec)) {
    if (!allowed.has(k) && !k.startsWith('_')) throw new Error(`Unknown field "${k}" for template "${spec.template}" (prefix with _ to keep a note)`);
  }
  for (const k of ['headline', 'cta_label', ...(template.required || [])]) {
    if (spec[k] === undefined || spec[k] === null || spec[k] === '') throw new Error(`Template "${spec.template}" requires "${k}"`);
  }
  if (typeof spec.headline !== 'string') throw new Error('"headline" must be a string');
  spec.tag = spec.tag ?? template.defaults.tag;

  const sizeName = spec.size ?? template.defaultSize ?? 'portrait';
  const allowedSizes = template.sizes || PUBLIC_SIZES;
  if (!allowedSizes.includes(sizeName)) throw new Error(`size "${sizeName}" is not valid for "${spec.template}". Use one of: ${allowedSizes.join(', ')}`);
  const size = SIZES[sizeName];

  const themeName = spec.theme ?? template.defaults.theme;
  if (!THEMES[themeName]) throw new Error(`theme must be one of ${Object.keys(THEMES).join(', ')}`);
  if (spec.orientation && !['white', 'black'].includes(spec.orientation)) throw new Error(`orientation must be 'white' or 'black'`);
  if (spec.highlight && !Array.isArray(spec.highlight)) throw new Error('"highlight" must be an array of squares');
  template.validate?.(spec);
  return { spec, size, themeName, template };
}

export async function createRenderer() {
  const browser = await chromium.launch({
    args: ['--disable-gpu', '--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb', '--hide-scrollbars'],
  });

  async function render(input, outPath) {
    const { spec, size, themeName, template } = prepare(input);
    const parts = template.build(spec, { size, themeName });
    const html = pageHtml({ spec, size, themeName, parts });

    const context = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const blocked = [];
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith('data:') || url.startsWith('file:') || url === 'about:blank') return route.continue();
      blocked.push(url);
      return route.abort();
    });
    try {
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('pageerror', (e) => consoleErrors.push(String(e)));
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(async () => {
        await Promise.all([
          document.fonts.load('700 100px "Barlow Condensed"'),
          document.fonts.load('500 20px "Onest"'),
          document.fonts.load('700 20px "Onest"'),
        ]);
        await document.fonts.ready;
      });
      const fontsOk = await page.evaluate(() => document.fonts.check('700 40px "Barlow Condensed"') && document.fonts.check('500 20px "Onest"'));
      if (!fontsOk) throw new Error('Brand fonts failed to load (Barlow Condensed / Onest)');

      await page.addScriptTag({ content: PAGE_SCRIPT });
      const result = await page.evaluate((cfg) => window.__run(cfg), { W: size.w, H: size.h, margin: SAFE_MARGIN, minText: size.minText });
      const problems = [...result.errors];
      if (blocked.length) problems.push(`network request blocked (renders must be offline): ${blocked.slice(0, 3).join(', ')}`);
      if (consoleErrors.length) problems.push(`page script error: ${consoleErrors[0]}`);
      if (problems.length) throw new QaError(spec, problems);

      const png = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: size.w, height: size.h }, animations: 'disabled', caret: 'hide' });
      if (outPath) {
        mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
        writeFileSync(outPath, png);
      }
      render.lastInfo = { size: size.id, width: size.w, height: size.h, ...result.info };
      return png;
    } finally {
      await context.close();
    }
  }

  return { render, close: () => browser.close() };
}

/** One-shot convenience: launches Chromium, renders, closes. */
export async function render(spec, outPath) {
  const r = await createRenderer();
  try {
    return await r.render(spec, outPath);
  } finally {
    await r.close();
  }
}

// ---- CLI ----
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const [specPath, outPath] = process.argv.slice(2);
  if (!specPath || !outPath) {
    console.error('Usage: node render.mjs <spec.json> <out.png>');
    process.exit(2);
  }
  try {
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));
    await render(spec, outPath);
    console.log(`wrote ${outPath}`);
  } catch (e) {
    console.error(e instanceof QaError ? e.message : `Error: ${e.message}`);
    process.exit(1);
  }
}
