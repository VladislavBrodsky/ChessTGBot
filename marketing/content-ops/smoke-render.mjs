#!/usr/bin/env node
/** Smoke-test the same /CREATIVES renderer used by social and blog-share exports. */
import assert from 'node:assert/strict';
import { createStudioRenderer } from './studio-render.mjs';

const project = {
  version: 1,
  name: 'CI renderer check',
  format: 'square',
  width: 1080,
  height: 1080,
  theme: 'canvas',
  tag: 'Editorial QA',
  title: 'ONE CLEAR CHESS IDEA',
  subtitle: 'A lesson that fits the frame',
  proofs: ['Read the position', 'Choose a move', 'Review the answer'],
  proofIcons: ['target', 'strategy', 'book-open-text'],
  cta: 'Open the lesson',
  urlLabel: 'web3chess.online',
  note: 'Web3Chess editorial',
  layers: [{ id: 'art-1', kind: 'academy', x: 0.75, y: 0.56, size: 0.43, rotation: 0 }],
};

const renderer = await createStudioRenderer();
try {
  const result = await renderer.render(project);
  assert.equal(result.width, 1080);
  assert.equal(result.height, 1080);
  assert.ok(result.png.length > 10_000, 'renderer returned a real PNG');
  console.log(`Creatives renderer smoke passed (${result.width} × ${result.height}, ${result.png.length} bytes)`);
} finally {
  await renderer.close();
}
