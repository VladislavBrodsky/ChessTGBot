// Trap: "avoid this" headline, the critical position as hero, and the move sequence as chips.
// `moves` are the SAN moves shown (annotations like ?? / + / # are kept). If `start_fen` is
// supplied the line is replayed from it and must end exactly on `fen` (QA for chess content).
import { boardHtml } from '../lib/board.mjs';
import { parseFen, replay, looksLikeSan, requireFromFrontend } from '../lib/chess.mjs';

const { Chess } = requireFromFrontend('chess.js');
import { esc, h1, subhead } from '../lib/ui.mjs';

const placement = (fen) => fen.split(' ')[0];

export default {
  id: 'trap',
  defaults: { theme: 'ink', tag: 'Trap' },
  required: ['fen', 'moves'],
  extraFields: ['start_fen', 'move_number', 'first', 'trap_index'],

  validate(spec) {
    if (!Array.isArray(spec.moves) || spec.moves.length < 2 || spec.moves.length > 12) throw new Error('trap `moves` must be 2-12 SAN moves');
    for (const m of spec.moves) if (!looksLikeSan(m)) throw new Error(`trap move "${m}" does not look like SAN`);
    if (spec.start_fen) {
      const clean = spec.moves.map((m) => m.replace(/[!?]+$/, ''));
      replay(spec.start_fen, clean); // throws with the offending move if one is illegal
      const g = new Chess(spec.start_fen);
      for (const m of clean) g.move(m);
      if (placement(g.fen()) !== placement(spec.fen)) {
        throw new Error(`trap moves do not lead to the given fen.\n  replayed: ${placement(g.fen())}\n  fen:      ${placement(spec.fen)}`);
      }
    }
  },

  build(spec, { size }) {
    parseFen(spec.fen);
    const first = spec.first || (spec.start_fen ? (parseFen(spec.start_fen).turn === 'w' ? 'white' : 'black') : 'white');
    let n = spec.move_number || (spec.start_fen ? +spec.start_fen.split(' ')[5] || 1 : 1);
    let white = first === 'white';
    const trapIdx = spec.trap_index ?? spec.moves.length - 1;
    const chips = spec.moves
      .map((san, i) => {
        const num = white ? `<span class="mv-n">${n}.</span>` : i === 0 ? `<span class="mv-n">${n}...</span>` : '';
        if (!white) n += 1;
        white = !white;
        return `${num}<span class="mv${i === trapIdx ? ' mv-trap' : ''}" data-nowrap>${esc(san)}</span>`;
      })
      .join('');

    return {
      lead: `<div class="hazard" data-safe aria-hidden="true"></div>${h1(spec.headline, size, { lines: 2, max: size.h1Max * 0.7 })}${subhead(spec.subhead, size, { lines: 2 })}`,
      hero: boardHtml({ fen: spec.fen, orientation: spec.orientation || 'white', highlight: spec.highlight || [], arrows: spec.arrow ? [spec.arrow] : [] }),
      after: `<div class="moves" data-qa="moves" data-max-rows="${size.mode === 'split' ? 4 : 2}">${chips}</div>`,
      css: CSS(size),
    };
  },
};

const CSS = (s) => `
.hazard{height:${Math.round(s.chipH * 0.3)}px;border-radius:99px;margin-bottom:${Math.round(s.gap * 0.7)}px;
  background:repeating-linear-gradient(-45deg,var(--volt) 0 ${Math.round(s.chipH * 0.42)}px,#000 0 ${Math.round(s.chipH * 0.84)}px);box-shadow:0 0 0 1px rgba(0,0,0,.4)}
.lead .sub{margin-top:${Math.round(s.gap * 0.6)}px}
.moves{display:flex;flex-wrap:wrap;align-items:center;gap:${Math.round(s.sub * 0.28)}px ${Math.round(s.sub * 0.3)}px;line-height:1}
.mv-n{font:700 ${Math.round(s.sub * 0.8)}px/1 var(--body);color:var(--muted);font-variant-numeric:tabular-nums;margin-right:-${Math.round(s.sub * 0.1)}px}
.mv{height:${Math.round(s.sub * 1.45)}px;padding:0 ${Math.round(s.sub * 0.42)}px;border-radius:${Math.round(s.sub * 0.4)}px;display:inline-flex;align-items:center;
  background:var(--panel);color:var(--fg);font:700 ${Math.round(s.sub * 0.94)}px/1 var(--body);letter-spacing:-.01em;box-shadow:inset 0 0 0 2px var(--line),inset 0 1px 0 var(--edge)}
.mv-trap{background:var(--volt);color:#000;box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -2px 0 rgba(0,0,0,.14)}
`;
