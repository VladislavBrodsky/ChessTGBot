#!/usr/bin/env node
/** Export one reviewed brief through the exact /CREATIVES renderer, offline. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStudioRenderer } from './studio-render.mjs';
import { fromEditorialCreative } from './studio-projects.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const folder = resolve(process.argv[2] || resolve(here, 'drafts/2026-10-20'));
const brief = JSON.parse(await readFile(resolve(folder, 'creative.json'), 'utf8'));
const out = resolve(folder, 'creative');
await mkdir(out, { recursive: true });
const renderer = await createStudioRenderer();
try {
  const manifest = { generatedAt: new Date().toISOString(), status: 'draft-for-review',
    renderer: '/CREATIVES', briefId: brief.id, outputs: [] };
  const proofs = [];
  for (const format of ['square', 'portrait', 'story', 'wide', 'blog']) {
    const project = fromEditorialCreative(brief, format);
    const projectFile = `${format}.project.json`;
    await writeFile(resolve(out, projectFile), JSON.stringify(project, null, 2) + '\n');
    const { png, width, height } = await renderer.render(project, resolve(out, `${format}.png`));
    manifest.outputs.push({ format, width, height, png: `${format}.png`, editableProject: projectFile, layoutWarnings: [] });
    if (format !== 'blog') proofs.push({ format, width, height, png });
  }
  await renderer.proofSheet(proofs, brief.name, resolve(out, 'preview.png'));
  await writeFile(resolve(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Rendered five PNGs, editable projects, and a proof sheet in ${out}`);
} finally { await renderer.close(); }
