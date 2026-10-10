// Puzzle: huge headline, the position as the hero, side-to-move pill. `reveal: true` adds the
// solution arrow + move text (a second image for the "answer" post).
import { boardHtml } from '../lib/board.mjs';
import { parseFen, replay } from '../lib/chess.mjs';
import { esc, h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'puzzle',
  defaults: { theme: 'ink', tag: 'Puzzle' },
  required: ['fen'],

  build(spec, { size }) {
    const pos = parseFen(spec.fen);
    const mover = pos.turn === 'w' ? 'White' : 'Black';
    const orientation = spec.orientation || (pos.turn === 'w' ? 'white' : 'black');

    const arrows = [];
    let line = [];
    if (spec.reveal) {
      if (spec.moves?.length) line = replay(spec.fen, spec.moves); // throws on an illegal solution
      if (spec.arrow) arrows.push(spec.arrow);
      else if (line[0]) arrows.push({ from: line[0].from, to: line[0].to });
      else throw new Error('puzzle reveal needs `arrow` or a legal `moves` solution');
    } else if (spec.arrow) {
      arrows.push(spec.arrow);
    }

    // Reveal: show the solution as numbered SAN. First move number follows the FEN.
    const fullmove = +spec.fen.split(' ')[5] || 1;
    let moveText = '';
    if (spec.reveal && line.length) {
      let n = fullmove;
      let white = pos.turn === 'w';
      moveText = line
        .map((m, i) => {
          const prefix = white ? `${n}. ` : i === 0 ? `${n}... ` : '';
          if (!white) n += 1;
          white = !white;
          return prefix + m.san;
        })
        .join('  ');
    }

    const pill = (cls = '') => `<span class="pill ${cls}" data-nowrap><i class="disc ${pos.turn === 'w' ? 'w' : 'b'}"></i>${mover} to move</span>`;
    const stack = size.mode === 'stack';
    // Stack layouts save a row by putting the side-to-move pill in the header; split layouts keep it in the text column.
    const headExtra = stack && !spec.reveal ? pill('pill-h') : '';
    const meta = spec.reveal
      ? `<div class="solution" data-overlap-ok><span class="solution-label" data-nowrap>Solution</span><span class="solution-move" data-nowrap>${esc(moveText)}</span></div>`
      : stack ? '' : pill();
    const sub = subhead(spec.subhead, size, { lines: 2, cls: 'meta-sub' });
    const metaRow = meta || sub ? `<div class="meta">${meta}${sub}</div>` : '';

    return {
      headExtra,
      lead: `${h1(spec.headline, size, { lines: 2, max: size.h1Max * 0.7 })}${metaRow}`,
      hero: boardHtml({ fen: spec.fen, orientation, highlight: spec.highlight || [], arrows }),
      css: CSS(size),
    };
  },
};

const CSS = (s) => `
.pill.pill-h{height:${s.chipH}px;padding:0 ${Math.round(s.chipH * 0.42)}px 0 ${Math.round(s.chipH * 0.3)}px;font-size:${s.chip}px;gap:10px;letter-spacing:.07em}
.pill.pill-h .disc{width:${Math.round(s.chipH * 0.42)}px;height:${Math.round(s.chipH * 0.42)}px;border-width:2px}
.meta{display:flex;align-items:center;gap:22px;margin-top:${Math.round(s.gap * 0.5)}px}
.meta-sub{flex:1;min-width:0}
.pill{height:${Math.round(s.chipH * 1.2)}px;padding:0 ${Math.round(s.chipH * 0.5)}px 0 ${Math.round(s.chipH * 0.36)}px;border-radius:999px;display:inline-flex;align-items:center;gap:14px;flex:none;
  font:700 ${Math.round(s.sub * 0.78)}px/1 var(--body);letter-spacing:.06em;text-transform:uppercase;color:var(--fg);
  background:var(--panel);box-shadow:inset 0 0 0 2px var(--line),inset 0 1px 0 var(--edge)}
.disc{width:${Math.round(s.chipH * 0.5)}px;height:${Math.round(s.chipH * 0.5)}px;border-radius:50%;border:3px solid #000;flex:none}
.disc.w{background:#fff;box-shadow:0 0 0 3px var(--fg)}
.disc.b{background:#000;box-shadow:0 0 0 3px var(--fg)}
.solution{display:inline-flex;align-items:center;gap:20px;background:var(--volt);color:#000;border-radius:${Math.round(s.chipH * 0.4)}px;padding:6px ${Math.round(s.chipH * 0.5)}px 6px ${Math.round(s.chipH * 0.5)}px;flex:none;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 0 rgba(0,0,0,.14)}
.solution-label{font:700 ${Math.max(s.minText, Math.round(s.sub * 0.6))}px/1 var(--body);letter-spacing:.14em;text-transform:uppercase}
.solution-move{font:700 ${Math.round(s.sub * 2)}px/1 var(--display);letter-spacing:0;white-space:nowrap}
${s.mode === 'split' ? '.meta{flex-direction:column;align-items:flex-start;gap:14px}.meta-sub{flex:none;width:100%}' : ''}
`;
