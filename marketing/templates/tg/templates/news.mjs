// News: poster-style headline card for our own take on a chess story. Board-motif texture sits
// behind the text. `source` is the outlet's name ("Source: <name>"); the summary is `subhead`.
import { motifSvg } from '../lib/board.mjs';
import { parseFen } from '../lib/chess.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

// A recognisable, legal middlegame used for texture when no fen is given.
const DEFAULT_MOTIF = 'r1bq1rk1/pp2bppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1NBPPP/R2QK2R w KQ - 0 1';

export default {
  id: 'news',
  defaults: { theme: 'ink', tag: 'News' },
  required: ['subhead'],
  extraFields: ['source'],

  validate(spec) {
    if (spec.source !== undefined && (typeof spec.source !== 'string' || !spec.source.trim())) throw new Error('news `source` must be a non-empty name');
    if (!spec.source && !spec.footer) throw new Error('news needs `source` (outlet name) so the card can credit it');
    if (spec.fen) parseFen(spec.fen);
  },

  build(spec, { size, themeName }) {
    const dark = themeName === 'ink';
    const motif = motifSvg({
      fen: spec.fen || DEFAULT_MOTIF,
      orientation: spec.orientation || 'white',
      light: dark ? 'rgba(255,255,255,.075)' : 'rgba(0,0,0,.07)',
      dark: 'rgba(0,0,0,0)',
      pieceOpacity: dark ? 0.085 : 0.09,
      pieceTone: dark ? 'light' : 'dark',
    });
    const credit = spec.source ? `Source: ${spec.source}` : spec.footer;
    const split = size.mode === 'split';
    return {
      bgExtra: `<div class="news-motif" data-bleed>${motif}</div>`,
      lead: `${h1(spec.headline, size, { lines: split ? 5 : 5, max: size.h1Max * 1.06, fitH: Math.round(size.h1Max * 0.9 * (split ? 4 : 5.2)) })}`,
      after: `<div class="news-sum"><span class="news-rule" aria-hidden="true"></span>${subhead(spec.subhead, size, { lines: split ? 4 : 4, cls: 'news-text', max: Math.round(size.sub * 1.08) })}<p class="news-src" data-nowrap data-qa="source">${esc(credit)}</p></div>`,
      css: CSS(size, dark),
    };
  },
};

const CSS = (s, dark) => `
.news-motif{position:absolute;pointer-events:none;width:${Math.round(s.w * 1.25)}px;height:${Math.round(s.w * 1.25)}px;right:${-Math.round(s.w * 0.36)}px;bottom:${-Math.round(s.w * 0.4)}px;transform:rotate(-9deg);
  -webkit-mask-image:radial-gradient(70% 70% at 40% 40%,#000 25%,transparent 78%);mask-image:radial-gradient(70% 70% at 40% 40%,#000 25%,transparent 78%)}
.news-motif .motif{width:100%;height:100%;display:block}
.tpl-news .main{justify-content:space-between}
.tpl-news .lead{flex:1;min-height:0;display:flex;align-items:flex-start}
.tpl-news .h1{width:100%}
.news-sum{position:relative;padding-left:${Math.round(s.sub * 0.9)}px;display:flex;flex-direction:column;gap:${Math.round(s.gap * 0.6)}px}
.news-rule{position:absolute;left:0;top:4px;bottom:4px;width:${Math.max(6, Math.round(s.sub * 0.2))}px;border-radius:9px;background:${dark ? 'var(--mint)' : '#000'}}
.news-text{color:var(--fg)}
.news-src{font:700 ${Math.round(s.sub * 0.78)}px/1.2 var(--body);letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
${s.mode === 'split' ? '.tpl-news .frame{grid-template-columns:minmax(0,1fr)}.tpl-news .strip{grid-area:3/1/4/2}' : ''}
`;
