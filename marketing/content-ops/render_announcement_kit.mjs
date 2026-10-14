import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const require = createRequire(path.join(repo, 'frontend/package.json'));
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
  const studioPath = path.resolve(repo, 'marketing/templates/studio.html');
  await page.goto('file://' + studioPath);
  await page.waitForFunction(() => window.W3Renderer && document.getElementById('render-status').textContent === 'Ready to export.');

  const campaign = {
    id: 'tempo',
    number: '05',
    name: 'Speed Chess & Crypto Gains',
    purpose: 'Community & Wagers',
    icon: 'clock',
    theme: 'canvas',
    art: 'clock',
    tag: 'Community & Crypto',
    headline: 'SPEED CHESS\nCRYPTO GAINS',
    body: 'Bullet, blitz, and USDT stakes · Join our community',
    cta: 'Join the community',
    note: 'USDT matches · 18+ where permitted · Telegram @chesshub_chat',
    proof: ['1+0 Bullet & 3+2 Blitz', 'Equal USDT stakes', 'Community @chesshub_chat']
  };

  const queueDir = path.resolve(repo, 'marketing/content-ops/queue/2026-10-14');
  fs.mkdirSync(queueDir, { recursive: true });

  for (const format of ['square', 'portrait', 'wide']) {
    const res = await page.evaluate(async ({ c, format }) => {
      const scene = W3Renderer.scene(c, format);
      const canvas = document.createElement('canvas');
      await W3Renderer.draw(scene, canvas);
      return { warnings: scene.warnings, png: canvas.toDataURL('image/png').split(',')[1] };
    }, { c: campaign, format });

    if (res.warnings.length) console.warn('Warnings for', format, res.warnings);
    const outPath = path.join(queueDir, 'web3_speed_chess_announcement_' + format + '.png');
    fs.writeFileSync(outPath, Buffer.from(res.png, 'base64'));
    console.log('Saved', outPath);
  }

  // Also update default target
  const squarePath = path.join(queueDir, 'web3_speed_chess_announcement_square.png');
  const targetPath = path.join(queueDir, 'web3_speed_chess_announcement_canvas.png');
  fs.copyFileSync(squarePath, targetPath);
  console.log('Updated', targetPath);

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
