// Poll: board with 2-3 lettered option markers on their target squares + "Which move?" headline.
import { boardHtml } from '../lib/board.mjs';
import { parseFen, isSquare } from '../lib/chess.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

const LETTERS = ['A', 'B', 'C'];

export default {
  id: 'poll',
  defaults: { theme: 'ink', tag: 'Poll' },
  required: ['fen', 'options'],

  validate(spec) {
    if (!Array.isArray(spec.options) || spec.options.length < 2 || spec.options.length > 3) throw new Error('poll `options` needs 2 or 3 entries');
    const seen = new Set();
    for (const o of spec.options) {
      if (!o || typeof o.label !== 'string' || !o.label.trim()) throw new Error('every poll option needs a `label`');
      if (o.label.length > 24) throw new Error(`poll option label "${o.label}" is longer than 24 characters`);
      if (!isSquare(o.square)) throw new Error(`poll option "${o.label}" needs a valid target \`square\` (a1-h8)`);
      if (seen.has(o.square)) throw new Error(`two poll options point at ${o.square}; markers would overlap`);
      seen.add(o.square);
    }
  },

  build(spec, { size }) {
    const pos = parseFen(spec.fen);
    const orientation = spec.orientation || (pos.turn === 'w' ? 'white' : 'black');
    const markers = spec.options.map((o, i) => ({ letter: LETTERS[i], square: o.square }));
    const legend = spec.options
      .map((o, i) => `<span class="opt"><b class="opt-l" data-nowrap>${LETTERS[i]}</b><span class="opt-t" data-nowrap>${esc(o.label)}</span></span>`)
      .join('');
    return {
      lead: `${h1(spec.headline, size, { lines: 2, max: size.h1Max * 0.78 })}${subhead(spec.subhead, size, { lines: 2 })}`,
      hero: boardHtml({ fen: spec.fen, orientation, highlight: spec.highlight || [], markers }),
      after: `<div class="opts" data-qa="options">${legend}</div>`,
      css: CSS(size),
    };
  },
};

const CSS = (s) => `
.lead .sub{margin-top:${Math.round(s.gap * 0.6)}px}
.opts{display:flex;gap:${Math.round(s.sub * 0.5)}px;flex-wrap:wrap}
.opt{flex:1 1 0;min-width:0;height:${Math.round(s.sub * 2)}px;border-radius:${Math.round(s.sub * 0.6)}px;background:var(--panel);display:flex;align-items:center;gap:${Math.round(s.sub * 0.45)}px;padding:0 ${Math.round(s.sub * 0.5)}px 0 ${Math.round(s.sub * 0.3)}px;
  box-shadow:inset 0 0 0 2px var(--line),inset 0 1px 0 var(--edge)}
.opt-l{width:${Math.round(s.sub * 1.4)}px;height:${Math.round(s.sub * 1.4)}px;border-radius:50%;background:#000;color:var(--mint);display:inline-flex;align-items:center;justify-content:center;flex:none;
  font:700 ${Math.round(s.sub * 0.95)}px/1 var(--body);box-shadow:0 0 0 3px #fff}
.opt-t{font:700 ${Math.round(s.sub * 1.0)}px/1 var(--body);letter-spacing:-.01em;color:var(--fg);white-space:nowrap;min-width:0}
${s.mode === 'split' ? '.opts{flex-direction:column}.opt{flex:none}' : ''}
`;
