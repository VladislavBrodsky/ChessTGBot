// Product: brand hero (the website's 3D chess sculpture) + a 3-step "Play chess in Telegram" flow.
import { loadAssets } from '../lib/assets.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'product',
  defaults: { theme: 'ink', tag: 'Play' },
  required: ['steps'],

  validate(spec) {
    if (!Array.isArray(spec.steps) || spec.steps.length !== 3) throw new Error('product `steps` needs exactly 3 short step titles');
    for (const st of spec.steps) if (typeof st !== 'string' || !st.trim() || st.length > 40) throw new Error(`product step must be 1-40 characters: "${st}"`);
  },

  build(spec, { size }) {
    const { sculpture } = loadAssets();
    const split = size.mode === 'split';
    const steps = `<ol class="psteps" data-qa="steps">${spec.steps
      .map(
        (t, i) => `<li class="pstep" data-safe><span class="pnum" data-nowrap>${i + 1}</span><span class="ptitle" data-qa="step" data-fit data-fit-fill data-fit-max="${Math.round(size.sub * 1.15)}" data-fit-min="${size.subMin}" data-fit-lines="${split ? 1 : 3}">${esc(t)}</span></li>`,
      )
      .join('')}</ol>`;
    const art = `<div class="pglow" data-bleed></div><img class="sculpt" data-safe alt="" src="${sculpture}">`;
    const lead = split
      ? `${h1(spec.headline, size, { lines: 2, max: size.h1Max * 0.72 })}${subhead(spec.subhead, size, { lines: 1 })}`
      : `${h1(spec.headline, size, { lines: 3, max: size.h1Max * 0.86 })}${subhead(spec.subhead, size, { lines: 2 })}`;
    // Stack: art and steps sit side by side in the hero zone. Split: steps live under the headline.
    if (split) return { lead, hero: art, after: steps, css: CSS(size) };
    return { lead, hero: `<div class="pstack"><div class="part">${art}</div>${steps}</div>`, css: CSS(size) };
  },
};

const CSS = (s) => {
  const split = s.mode === 'split';
  return `
.lead .sub{margin-top:${Math.round(s.gap * 0.6)}px}
.pstack{display:flex;gap:${s.gap}px;align-items:stretch;width:100%;height:100%}
.part{position:relative;flex:1.05;min-width:0;display:flex;align-items:center;justify-content:center}
.pglow{position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(209,255,202,.34),rgba(209,255,202,0) 100%);pointer-events:none}
.theme-paper .pglow,.theme-mint .pglow{background:radial-gradient(closest-side,rgba(255,255,255,.9),rgba(255,255,255,0) 100%)}
.sculpt{position:relative;height:100%;max-height:100%;width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 30px 28px rgba(0,0,0,.55))}
.psteps{list-style:none;display:flex;flex-direction:column;gap:${Math.round(s.gap * (split ? 0.35 : 0.5))}px;${split ? '' : 'flex:1;min-width:0;justify-content:center'}}
.pstep{${split ? '' : 'flex:1;max-height:' + Math.round(s.sub * 4.6) + 'px;'}min-width:0;display:flex;align-items:center;gap:${Math.round(s.sub * 0.55)}px;background:var(--panel);border-radius:${Math.round(s.footerH * 0.3)}px;padding:${Math.round(s.gap * (split ? 0.3 : 0.5))}px ${Math.round(s.gap * 0.7)}px;
  box-shadow:inset 0 0 0 2px var(--line),inset 0 1px 0 var(--edge)}
.pnum{width:${Math.round(s.sub * (split ? 1.3 : 1.55))}px;height:${Math.round(s.sub * (split ? 1.3 : 1.55))}px;border-radius:50%;background:var(--volt);color:#000;display:inline-flex;align-items:center;justify-content:center;flex:none;font:700 ${Math.round(s.sub * 1.3)}px/1 var(--display);padding-top:2px}
.ptitle{flex:1;min-width:0;align-self:stretch;display:flex;align-items:center;font:700 ${Math.round(s.sub * 1.05)}px/1.12 var(--body);letter-spacing:-.015em;color:var(--fg)}
`;
};
