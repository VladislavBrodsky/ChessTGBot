import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRenderer } from '../templates/tg/render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const assets = path.join(here, 'assets');
fs.mkdirSync(assets, { recursive: true });
const renderer = await createRenderer();
const results = [];
try {
  for (const name of fs.readdirSync(path.join(here, 'posts')).filter(n => n.endsWith('.json'))) {
    const file = path.join(here, 'posts', name);
    const post = JSON.parse(fs.readFileSync(file, 'utf8'));
    const sizes = name === 'epic-launch.json' ? ['portrait', 'square', 'wide'] : [post.creative.size];
    for (const size of sizes) {
      const spec = { ...post.creative, size };
      const stem = `${path.basename(name, '.json')}-${size}`;
      const png = path.join(assets, `${stem}.png`);
      await renderer.render(spec, png);
      fs.writeFileSync(path.join(assets, `${stem}.spec.json`), JSON.stringify(spec, null, 2) + '\n');
      results.push({ file: path.relative(root, png), qa: 'passed', size });
      console.log(`Rendered ${stem}`);
      if (size === post.creative.size) {
        post.image = path.relative(root, png);
        post.render = { ok: true, template: post.creative.template };
        fs.writeFileSync(file, JSON.stringify(post, null, 2) + '\n');
      }
    }
  }
} finally {
  await renderer.close();
  fs.writeFileSync(path.join(assets, 'manifest.json'), JSON.stringify({ images: results }, null, 2) + '\n');
}
