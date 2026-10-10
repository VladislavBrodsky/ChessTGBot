// Cover: blog article cover, 1200x630. `tag` = category chip, `headline` = article title,
// optional `fen` draws a small board; otherwise the brand sculpture is used.
import { boardHtml } from '../lib/board.mjs';
import { loadAssets } from '../lib/assets.mjs';
import { parseFen } from '../lib/chess.mjs';
import { h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'cover',
  defaults: { theme: 'ink', tag: 'Journal' },
  sizes: ['cover'],
  defaultSize: 'cover',

  validate(spec) {
    if (spec.fen) parseFen(spec.fen);
  },

  build(spec, { size }) {
    const hero = spec.fen
      ? boardHtml({ fen: spec.fen, orientation: spec.orientation || 'white', highlight: spec.highlight || [], arrows: spec.arrow ? [spec.arrow] : [] })
      : `<div class="cglow" data-bleed></div><img class="csculpt" data-safe alt="" src="${loadAssets().sculpture}">`;
    return {
      lead: `${h1(spec.headline, size, { lines: 4, max: size.h1Max, fitH: 330 })}${subhead(spec.subhead, size, { lines: 2 })}`,
      hero,
      css: `.lead .sub{margin-top:14px}
.cglow{position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(209,255,202,.30),rgba(209,255,202,0))}
.theme-paper .cglow,.theme-mint .cglow{background:radial-gradient(closest-side,rgba(255,255,255,.9),rgba(255,255,255,0))}
.csculpt{position:relative;height:100%;width:auto;max-width:100%;object-fit:contain;filter:drop-shadow(0 24px 22px rgba(0,0,0,.5))}`,
    };
  },
};
