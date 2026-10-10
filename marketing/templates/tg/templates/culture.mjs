// Culture: meme-style typographic two-panel ("ME:" / "THE CLOCK:") with big piece art.
// `panels: [{label, text, piece}]` - piece is a type letter (K Q R B N P) or a full key (wK, bP).
import { loadAssets } from '../lib/assets.mjs';
import { esc, h1, pieceSvg } from '../lib/ui.mjs';

const TYPES = 'KQRBNP';

export default {
  id: 'culture',
  defaults: { theme: 'ink', tag: 'Chess life' },
  extraFields: ['panels'],

  validate(spec) {
    const p = spec.panels;
    if (!Array.isArray(p) || p.length !== 2) throw new Error('culture needs `panels`: exactly two { label, text, piece } objects');
    for (const x of p) {
      if (!x.label || !x.text) throw new Error('each culture panel needs `label` and `text`');
      if (x.piece && !(TYPES.includes(x.piece) && x.piece.length === 1) && !/^[wb][KQRBNP]$/.test(x.piece)) throw new Error(`panel piece "${x.piece}" must be K/Q/R/B/N/P or a key like wN`);
      if (x.text.length > 70) throw new Error(`panel text is ${x.text.length} chars; keep it under 70 so the meme stays punchy`);
    }
  },

  build(spec, { size, themeName }) {
    const { pieces } = loadAssets();
    const split = size.mode === 'split';
    // Panel 1 is always white; panel 2 is mint on ink and black elsewhere. Piece colour contrasts the panel.
    const dark2 = themeName !== 'ink';
    const panelHtml = spec.panels
      .map((p, i) => {
        const darkPanel = i === 1 && dark2;
        const key = p.piece && p.piece.length === 2 ? p.piece : `${darkPanel ? 'w' : 'b'}${p.piece || (i === 0 ? 'K' : 'P')}`;
        return `<div class="cpanel c${i}${darkPanel ? ' cdark' : ''}" data-bg="${darkPanel ? '#000000' : i === 1 ? '#d1ffca' : '#ffffff'}" data-safe>
  <div class="ctext"><span class="clabel" data-nowrap>${esc(p.label)}</span><p class="cline" data-qa="panel-text" data-fit data-fit-fill data-fit-max="${Math.round(size.h1Max * 1.05)}" data-fit-min="${Math.round(size.h1Min * 0.55)}" data-fit-lines="${split ? 3 : 3}">${esc(p.text)}</p></div>
  <div class="cpiece">${pieceSvg(pieces, key)}</div>
</div>`;
      })
      .join('');
    return {
      lead: h1(spec.headline, size, { lines: 2, max: Math.round(size.h1Max * 0.62), min: Math.round(size.h1Min * 0.7) }),
      hero: `<div class="cpanels">${panelHtml}</div>`,
      css: CSS(size),
    };
  },
};

const CSS = (s) => `
.lead .h1{margin-bottom:2px}
.tpl-culture .hero{align-items:stretch}
.cpanels{display:flex;flex-direction:column;gap:${Math.round(s.gap * 0.7)}px;width:100%;height:100%}
.cpanel{flex:1;min-height:0;position:relative;border-radius:${Math.round(s.footerH * 0.42)}px;overflow:hidden;color:#000;background:#fff;display:flex;align-items:center;justify-content:space-between;
  padding:${Math.round(s.gap * 1.0)}px ${Math.round(s.gap * 1.4)}px;gap:${Math.round(s.gap)}px;box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -3px 0 rgba(0,0,0,.10),0 30px 50px -28px var(--shadow)}
.cpanel.c1{background:var(--mint)}
.cpanel.cdark{background:#000;color:#fff;box-shadow:inset 0 0 0 2px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.3),0 30px 50px -28px var(--shadow)}
.ctext{flex:1;min-width:0;align-self:stretch;display:flex;flex-direction:column;justify-content:space-between;gap:${Math.round(s.gap * 0.4)}px}
.clabel{font:700 ${Math.round(s.sub * 0.95)}px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;opacity:1}
.cline{flex:1;min-height:0;font-family:var(--display);font-weight:700;text-transform:uppercase;line-height:.92;text-wrap:balance;display:flex;align-items:flex-end}
.cpiece{flex:none;height:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center}
.piece-art{height:100%;width:100%;display:block;filter:drop-shadow(0 8px 6px rgba(0,0,0,.28))}
.cdark .piece-art{filter:drop-shadow(0 8px 6px rgba(0,0,0,.6))}
.cpiece{max-height:${s.mode === 'split' ? '100%' : '100%'}}
`;
