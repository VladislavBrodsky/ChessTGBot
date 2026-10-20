#!/usr/bin/env node
/** Offline exporter for the exact renderer used by /CREATIVES.
 *
 * The website's TypeScript modules are transpiled in memory and served to a
 * private, intercepted Chromium origin. No production site or network request
 * is involved. The editor JSON remains the editable source of every PNG.
 */
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const publicRoot = resolve(root, 'website/public');
const components = resolve(root, 'website/src/components/creatives');
const require = createRequire(import.meta.url);
const ts = require(resolve(root, 'website/node_modules/typescript'));
const { chromium } = require(resolve(process.env.W3_FRONTEND_NODE_MODULES || resolve(root, 'frontend/node_modules'), 'playwright'));
const origin = 'http://studio.localhost';
const compilerOptions = { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 };

async function transpile(path) {
  return ts.transpileModule(await readFile(path, 'utf8'), { compilerOptions }).outputText;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Onest;src:url(/fonts/onest-variable.woff2) format('woff2');font-weight:400 700}
@font-face{font-family:'Barlow Condensed';src:url(/fonts/barlow-condensed-bold.woff2) format('woff2');font-weight:700}
html,body{margin:0}
</style></head><body><script type="module">
import {parseProject} from '/model.js';
import {renderProject} from '/render.js';
window.W3Studio = {parseProject, renderProject};
</script></body></html>`;

export async function createStudioRenderer() {
  const modules = new Map([
    ['/icons.js', await transpile(resolve(root, 'website/src/icons/generated.ts'))],
    ['/model.js', await transpile(resolve(components, 'model.ts'))],
    ['/render.js', (await transpile(resolve(components, 'render.ts')))
      .replace('from "@/icons/generated"', 'from "/icons.js"')
      .replace('from "./model"', 'from "/model.js"')],
  ]);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const blocked = [];
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    const parsed = new URL(url);
    if (parsed.origin !== origin) {
      blocked.push(url);
      return route.abort();
    }
    if (parsed.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
    if (modules.has(parsed.pathname)) return route.fulfill({ status: 200, contentType: 'text/javascript', body: modules.get(parsed.pathname) });
    if (!/^\/(?:fonts\/(?:onest-variable|barlow-condensed-bold)\.woff2|brand\/w3chess-logo\.svg|illustrations\/chess-(?:sculpture|academy|clock|stakes|fair-play|castling)\.webp)$/.test(parsed.pathname)) {
      blocked.push(url);
      return route.abort();
    }
    const file = resolve(publicRoot, parsed.pathname.slice(1));
    const ext = extname(file);
    const contentType = ext === '.woff2' ? 'font/woff2' : ext === '.svg' ? 'image/svg+xml' : 'image/webp';
    return route.fulfill({ status: 200, contentType, body: await readFile(file) });
  });
  try {
    await page.goto(`${origin}/`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean(window.W3Studio));
    await page.evaluate(async () => {
      await Promise.all([
        document.fonts.load('700 100px "Barlow Condensed"'),
        document.fonts.load('500 20px "Onest"'),
        document.fonts.load('700 20px "Onest"'),
      ]);
    });
  } catch (error) {
    await browser.close();
    throw error;
  }

  async function render(input, outPath) {
    errors.length = 0;
    blocked.length = 0;
    const result = await page.evaluate(async (raw) => {
      const project = window.W3Studio.parseProject(raw);
      if (!project) throw new Error('Invalid Creatives Studio project');
      const { canvas, warnings } = await window.W3Studio.renderProject(project);
      return { width: canvas.width, height: canvas.height, warnings,
        png: canvas.toDataURL('image/png').split(',')[1] };
    }, input);
    if (errors.length || blocked.length || result.warnings.length) {
      throw new Error([...errors, ...blocked.map((url) => `Blocked request: ${url}`), ...result.warnings].join('; '));
    }
    const png = Buffer.from(result.png, 'base64');
    if (outPath) {
      await mkdir(dirname(resolve(outPath)), { recursive: true });
      await writeFile(outPath, png);
    }
    return { png, width: result.width, height: result.height };
  }
  async function proofSheet(items, title, outPath) {
    if (items.length !== 4) throw new Error('Proof sheet requires square, portrait, story, and wide PNGs');
    const data = items.map((item) => ({ ...item, png: item.png.toString('base64') }));
    const base64 = await page.evaluate(async ({ items, title }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1400; canvas.height = 1600;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#E5E5E5'; ctx.fillRect(0, 0, 1400, 1600);
      ctx.fillStyle = '#0A0A0A'; ctx.font = '700 62px "Barlow Condensed"';
      ctx.fillText(title.toUpperCase(), 48, 83, 1300);
      ctx.font = '500 20px "Onest"';
      ctx.fillText('WEB3CHESS / CREATIVE STUDIO / FOUR SOCIAL LAYOUTS', 48, 119);
      const boxes = [[44, 178, 620, 620], [730, 178, 496, 620],
        [175, 864, 349, 620], [730, 970, 620, 349]];
      for (let i = 0; i < items.length; i++) {
        const [x, y, w, h] = boxes[i];
        const image = new Image();
        image.src = `data:image/png;base64,${items[i].png}`;
        await image.decode();
        ctx.drawImage(image, x, y, w, h);
        ctx.fillStyle = '#0A0A0A'; ctx.font = '500 18px "Onest"';
        ctx.fillText(`${items[i].format.toUpperCase()} / ${items[i].width} × ${items[i].height}`, x, y + h + 30);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    }, { items: data, title });
    const png = Buffer.from(base64, 'base64');
    await mkdir(dirname(resolve(outPath)), { recursive: true });
    await writeFile(outPath, png);
    return png;
  }
  return { render, proofSheet, close: () => browser.close() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [projectFile, outFile] = process.argv.slice(2);
  if (!projectFile || !outFile) {
    console.error('Usage: node studio-render.mjs <project.json> <output.png>');
    process.exit(2);
  }
  const renderer = await createStudioRenderer();
  try {
    const project = JSON.parse(await readFile(projectFile, 'utf8'));
    const result = await renderer.render(project, outFile);
    console.log(`Rendered ${result.width} × ${result.height} PNG from the /CREATIVES source`);
  } finally { await renderer.close(); }
}
