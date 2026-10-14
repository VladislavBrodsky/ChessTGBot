#!/usr/bin/env node
/**
 * Design-system rule checker (ratchet).
 *
 * Scans frontend/src for violations of the rules in BRAND_DESIGN_SYSTEM.md and compares each
 * rule's count against scripts/design-rules-baseline.json. A rule may only get BETTER:
 *   - count > baseline  -> CI fails (new violation introduced)
 *   - count < baseline  -> prints a reminder to lower the baseline (`--update`)
 *
 * Usage:
 *   node scripts/check-design-rules.mjs            # check
 *   node scripts/check-design-rules.mjs --update   # rewrite baseline to current counts (only ever lowers in review)
 *   node scripts/check-design-rules.mjs --list     # print every offending line
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const BASELINE = path.join(root, 'scripts', 'design-rules-baseline.json');
const args = new Set(process.argv.slice(2));

/** Files that legitimately define raw colour values. */
const RAW_COLOUR_ALLOW = [
  /src\/styles\//,
  /src\/app\/globals\.css$/,
  /src\/lib\/(boardThemes|pieceThemes|chessThemes)/,
  /src\/tests\//,
  /\.test\.tsx?$/,
  /src\/app\/\[locale\]\/admin\//, // internal tool, not part of the product surface
  /src\/app\/global-error\.tsx$/, // renders outside the theme provider
  /src\/components\/Marketplace\/boxConfig\.ts$/, // tier artwork palette
  /src\/components\/ui\/NoiseGradient\.tsx$/, // canvas gradient stops
  /src\/components\/ui\/Confetti\.tsx$/, // canvas confetti particle colors
];

const RULES = [
  {
    id: 'raw-palette-class',
    why: 'Use semantic brand tokens (text-brand-*, bg-brand-*), never raw slate/zinc/gray/neutral palette classes.',
    files: /\.tsx?$/,
    re: /\b(?:text|bg|border|ring|from|to|via|divide|placeholder)-(?:slate|zinc|gray|neutral|stone)-\d{2,3}\b/g,
  },
  {
    id: 'raw-hex-colour',
    why: 'Raw hex colours bypass theming. Use a token or `var(--…)`.',
    files: /\.tsx?$/,
    allow: RAW_COLOUR_ALLOW,
    re: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b(?![\w-])/g,
    // skip `#fragment` links and CSS ids: require the hex to sit inside a quote/paren/space-delimited colour context
    filter: (line, m) => !/href=|id=|url\(#|\bkey=|#[0-9a-f]{3,8}[a-z]/i.test(line.slice(m.index, m.index + 12)) && !/https?:\/\//.test(line),
  },
  {
    id: 'sub-12px-text',
    why: 'Minimum readable text size is 12px (text-xs / --font-size-caption).',
    files: /\.tsx?$/,
    re: /\btext-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/g,
  },
  {
    id: 'opacity-on-text',
    why: 'Opacity-dimmed text fails AA contrast. Use text-brand-muted instead of text-*/NN.',
    files: /\.tsx?$/,
    re: /\btext-(?:white|black|brand-(?:primary|muted|void|surface))\/\d{1,3}\b/g,
  },
  {
    id: 'arbitrary-tracking',
    why: 'Letter-spacing comes from type roles (ui-eyebrow, tracking-eyebrow). Avoid ad-hoc tracking-[…].',
    files: /\.tsx?$/,
    re: /\btracking-\[[^\]]+\]/g,
  },
  {
    id: 'hardcoded-bottom-inset',
    why: 'Fixed bottom elements must use var(--app-safe-bottom) (iOS Telegram fullscreen defines the TG inset as 0).',
    files: /\.(tsx?|css)$/,
    allow: [/src\/styles\/(tokens|themes)\.css$/, /src\/app\/globals\.css$/],
    re: /var\(--tg-content-safe-area-inset-bottom[^)]*\)|env\(safe-area-inset-bottom\)/g,
    allowLine: /--app-safe-bottom\s*:/,
  },
  {
    id: 'navbar-hide-has-selector',
    why: 'Never hide the bottom navbar with :has() rules (see CLAUDE.md). Overlays cover it with z-index >= 100.',
    files: /\.css$/,
    re: /:has\([^)]*\)[^{]*\{[^}]*(?:display\s*:\s*none|visibility\s*:\s*hidden)/g,
    multiline: true,
    onlyIfNear: /nav/i,
  },
  {
    id: 'unnamed-icon-button',
    why: 'Icon-only <button> needs an aria-label.',
    files: /\.tsx$/,
    re: /<button\b(?![^>]*\baria-label\b)(?![^>]*\baria-labelledby\b)[^>]*>\s*<(?:Fa|Lu|Hi|Io|Md|Ri|Bs|Fi|Tb|Pi)[A-Za-z0-9]+\s[^>]*\/>\s*<\/button>/g,
    multiline: true,
  },
  {
    id: 'uppercase-eyebrow-direct',
    why: 'Use the .ui-eyebrow role (it disables uppercase for ar/hi/ja/zh) instead of `uppercase` + tracking utilities.',
    files: /\.tsx$/,
    re: /className="[^"]*\buppercase\b[^"]*\btracking-(?:wide|wider|widest)\b[^"]*"/g,
  },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.next', 'messages'].includes(e.name)) continue;
      walk(p, out);
    } else if (/\.(tsx?|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const counts = Object.fromEntries(RULES.map(r => [r.id, 0]));
const hits = Object.fromEntries(RULES.map(r => [r.id, []]));

for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (const rule of RULES) {
    if (!rule.files.test(file)) continue;
    if (rule.allow?.some(a => a.test(rel))) continue;
    if (rule.multiline) {
      for (const m of text.matchAll(rule.re)) {
        if (rule.onlyIfNear && !rule.onlyIfNear.test(text.slice(Math.max(0, m.index - 200), m.index + 40))) continue;
        counts[rule.id]++;
        hits[rule.id].push(`${rel}:${text.slice(0, m.index).split('\n').length}`);
      }
      continue;
    }
    lines.forEach((line, i) => {
      if (rule.allowLine?.test(line)) return;
      for (const m of line.matchAll(rule.re)) {
        if (rule.filter && !rule.filter(line, m)) continue;
        counts[rule.id]++;
        hits[rule.id].push(`${rel}:${i + 1}  ${m[0]}`);
      }
    });
  }
}

if (args.has('--list')) {
  for (const r of RULES) {
    console.log(`\n# ${r.id} (${counts[r.id]}) — ${r.why}`);
    hits[r.id].forEach(h => console.log('  ' + h));
  }
  process.exit(0);
}

if (args.has('--update')) {
  fs.writeFileSync(BASELINE, JSON.stringify(counts, null, 2) + '\n');
  console.log('Baseline written:', counts);
  process.exit(0);
}

const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
let failed = false;
for (const r of RULES) {
  const base = baseline[r.id] ?? 0;
  const n = counts[r.id];
  if (n > base) {
    failed = true;
    console.error(`✘ ${r.id}: ${n} (baseline ${base}) — ${r.why}`);
    hits[r.id].slice(-(n - base) - 3).forEach(h => console.error('    ' + h));
  } else if (n < base) {
    console.log(`↓ ${r.id}: ${n} (baseline ${base}) — improved, run \`npm run check:design -- --update\` to lock it in`);
  } else {
    console.log(`✓ ${r.id}: ${n}`);
  }
}
if (failed) {
  console.error('\nDesign rule regression. See BRAND_DESIGN_SYSTEM.md → Governance.');
  process.exit(1);
}
