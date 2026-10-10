// Tip: numbered checklist card (2-4 steps, 3 is the house style) with a small board.
import { boardHtml } from '../lib/board.mjs';
import { parseFen } from '../lib/chess.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'tip',
  defaults: { theme: 'ink', tag: 'Tip' },
  required: ['steps'],

  validate(spec) {
    if (!Array.isArray(spec.steps) || spec.steps.length < 2 || spec.steps.length > 4) throw new Error('tip `steps` needs 2-4 short strings');
    for (const st of spec.steps) if (typeof st !== 'string' || !st.trim() || st.length > 90) throw new Error(`tip step must be 1-90 characters: "${st}"`);
    if (spec.fen) parseFen(spec.fen);
  },

  build(spec, { size }) {
    const split = size.mode === 'split';
    const rows = spec.steps
      .map(
        (st, i) => `<li class="tstep"><span class="tnum" data-nowrap>${i + 1}</span><p class="ttext" data-qa="step" data-fit data-fit-fill data-fit-max="${Math.round(size.sub * 1.3)}" data-fit-min="${size.subMin}" data-fit-lines="3">${esc(st)}</p></li>`,
      )
      .join('');
    const mini = spec.fen && !split // split layouts have no room for the board; fen is ignored there
      ? `<div class="tmini">${boardHtml({ fen: spec.fen, orientation: spec.orientation || 'white', highlight: spec.highlight || [], arrows: spec.arrow ? [spec.arrow] : [], coords: false, ring: Math.round(size.ring * 0.4), cls: 'board-mini' })}</div>`
      : '';
    const card = `<ol class="tcard" data-safe data-bg="#ffffff">${rows}</ol>`;
    const text = `${h1(spec.headline, size, { lines: split ? 3 : 3, max: size.h1Max * (split ? 0.8 : 0.72) })}${subhead(spec.subhead, size, { lines: 2 })}`;
    if (split) return { lead: `<div class="ttext-col">${text}</div>`, hero: card, css: CSS(size) };
    // Stack: headline + small board share the top row, the checklist card fills the rest.
    return { lead: `<div class="thead"><div class="ttext-col">${text}</div>${mini}</div>`, hero: card, css: CSS(size) };
  },
};

const CSS = (s) => {
  const mini = s.mode === 'split' ? (s.id === 'cover' ? 170 : 200) : Math.round(s.w * 0.27);
  return `
.thead{display:flex;gap:${s.gap}px;align-items:flex-start;justify-content:space-between}
.ttext-col{flex:1;min-width:0}
.ttext-col .sub{margin-top:${Math.round(s.gap * 0.5)}px}
.tmini{flex:none;width:${mini}px;height:${mini}px;display:flex;align-items:center;justify-content:center}
.tpl-tip .hero{align-items:stretch}
.tcard{list-style:none;width:100%;background:#fff;color:#000;border-radius:${Math.round(s.footerH * 0.42)}px;display:flex;flex-direction:column;padding:${Math.round(s.gap * 0.3)}px ${Math.round(s.gap * 1.1)}px;
  box-shadow:inset 0 1px 0 #fff,inset 0 -3px 0 rgba(0,0,0,.08),0 34px 56px -30px var(--shadow)}
.tstep{flex:1;min-height:0;display:flex;align-items:center;gap:${Math.round(s.sub * 0.8)}px;border-top:2px solid rgba(0,0,0,.12)}
.tstep:first-child{border-top:0}
.tnum{width:${Math.round(s.sub * 2.1)}px;height:${Math.round(s.sub * 2.1)}px;border-radius:50%;background:#000;color:var(--mint);display:inline-flex;align-items:center;justify-content:center;flex:none;
  font:700 ${Math.round(s.sub * 1.7)}px/1 var(--display);padding-top:2px}
.ttext{flex:1;min-width:0;align-self:stretch;display:flex;align-items:center;font:700 ${Math.round(s.sub * 1.1)}px/1.14 var(--body);letter-spacing:-.015em;color:#000;text-wrap:balance}
`;
};
