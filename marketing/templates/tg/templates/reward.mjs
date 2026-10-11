// Earned virtual reward campaign. Uses the game's actual chess chest artwork.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { REPO } from '../lib/assets.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'reward',
  defaults: { theme: 'ink', tag: 'Free quest' },
  required: ['steps'],
  extraFields: ['reward_note'],
  validate(spec) {
    if (spec.theme && spec.theme !== 'ink') throw new Error('reward uses the ink theme for its dark chest artwork');
    if (!Array.isArray(spec.steps) || spec.steps.length !== 3 || spec.steps.some(s => typeof s !== 'string' || !s.trim() || s.length > 40)) throw new Error('reward requires 3 steps, each 1–40 characters');
    if (!spec.reward_note || spec.reward_note.length > 120) throw new Error('reward_note is required, at most 120 characters');
  },
  build(spec, { size }) {
    const split = size.mode === 'split';
    const art = 'data:image/jpeg;base64,' + readFileSync(path.join(REPO, 'frontend/public/boxes/epic-chess.jpg')).toString('base64');
    const rows = `<ol class="reward-steps">${spec.steps.map((s, i) => `<li data-safe><span class="reward-num" data-nowrap>${i + 1}</span><span class="reward-step" data-fit data-fit-max="${size.sub}" data-fit-min="${size.subMin}" data-fit-lines="2">${esc(s)}</span></li>`).join('')}</ol>`;
    const note = `<p class="reward-note" data-safe data-fit data-fit-max="${size.subMin}" data-fit-min="${size.minText}" data-fit-lines="3">${esc(spec.reward_note)}</p>`;
    return {
      lead: h1(spec.headline, size, { lines: split ? 2 : 3, max: size.h1Max * (split ? .6 : .9) }) + subhead(spec.subhead, size, { lines: 2 }),
      hero: `<img class="reward-art" data-safe alt="Gold chess treasure chest" src="${art}">`,
      after: rows + note,
      css: `.lead .sub{margin-top:${size.gap / 2}px}.reward-art{width:100%;height:100%;object-fit:contain;border-radius:20px}
      .reward-steps{display:flex;gap:${size.gap / 2}px;list-style:none}
      .reward-steps li{flex:1;min-width:0;display:flex;align-items:center;gap:12px;background:var(--panel);padding:14px;border-radius:14px}
      .reward-num{flex:none;color:var(--mint);font:700 ${size.sub * 1.4}px/1 var(--display)}
      .reward-step{font:700 ${size.sub}px/1.12 var(--body)}.reward-note{margin-top:${size.gap / 2}px;font:500 ${size.subMin}px/1.3 var(--body);color:var(--muted)}`,
    };
  },
};
