// Rules: a worked match example. stake -> pot (2x) -> winner receives 95%
// (3% platform fee + 2% referral fee). Numbers come from website/src/lib/config.ts SETTLEMENT
// (winnerPercent 95, platformFeePercent 3, referralFeePercent 2; backend/app/services/settlement.py).
// The adult / risk disclosure is rendered on every rules image and cannot be turned off.
import { esc, h1, subhead } from '../lib/ui.mjs';

export const SETTLEMENT = { winnerPercent: 95, platformFeePercent: 3, referralFeePercent: 2 };
export const DISCLOSURE = 'USDT matches are for adults (18+) where permitted. You can lose your stake.';

const money = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const exactCents = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;

export function settle(stake) {
  const pot = stake * 2;
  const winner = (pot * SETTLEMENT.winnerPercent) / 100;
  const platform = (pot * SETTLEMENT.platformFeePercent) / 100;
  const referral = (pot * SETTLEMENT.referralFeePercent) / 100;
  return { pot, winner, platform, referral, net: winner - stake };
}

export default {
  id: 'rules',
  defaults: { theme: 'ink', tag: 'How it works' },
  required: ['stake'],

  validate(spec) {
    if (typeof spec.stake !== 'number' || !Number.isFinite(spec.stake) || spec.stake <= 0 || spec.stake > 100000) throw new Error('rules `stake` must be a number between 0 and 100000');
    const r = settle(spec.stake);
    for (const [k, v] of Object.entries(r)) if (!exactCents(v)) throw new Error(`stake ${spec.stake} gives ${k} = ${v}, which is not a whole number of cents; pick a stake such as 5, 10, 25 or 12.5`);
    if (Math.abs(r.winner + r.platform + r.referral - r.pot) > 1e-9) throw new Error('settlement split does not add up to the pot');
  },

  build(spec, { size }) {
    const stake = spec.stake;
    const r = settle(stake);
    const split = size.mode === 'split';
    const compact = size.id === 'square';
    // Figures share one size so the three cards read as a set: the longest string decides it.
    const longest = Math.max(...[stake, r.pot, r.winner].map((v) => money(v).length));
    const numPx = split ? Math.round(size.sub * 2.1) : Math.max(40, Math.min(Math.round(size.sub * (compact ? 3.0 : 3.2)), Math.floor(206 / (0.5 * longest))));
    const card = (cls, label, value) => `<div class="rcard ${cls}" data-safe><span class="rlabel" data-nowrap>${label}</span><span class="rval" data-nowrap style="font-size:${numPx}px">${money(value)}</span><span class="runit" data-nowrap>USDT</span></div>`;
    const flow = `<div class="rflow" data-qa="flow">
      ${card('r1', 'Each player stakes', stake)}
      <span class="rop" aria-hidden="true" data-nowrap>&times;2</span>
      ${card('r2', 'Pot', r.pot)}
      <span class="rop" aria-hidden="true" data-nowrap>${SETTLEMENT.winnerPercent}%</span>
      ${card('r3', 'Winner receives', r.winner)}
    </div>`;
    const bar = `<div class="rbar" data-qa="split">
      <div class="rtrack" aria-hidden="true"><i class="s-win" style="flex:${SETTLEMENT.winnerPercent}"></i><i class="s-plat" style="flex:${SETTLEMENT.platformFeePercent}"></i><i class="s-ref" style="flex:${SETTLEMENT.referralFeePercent}"></i></div>
      <div class="rlegend">
        <div class="lg"><i class="sw s-win"></i><b data-nowrap>${SETTLEMENT.winnerPercent}%</b><span data-nowrap>Winner</span></div>
        <div class="lg"><i class="sw s-plat"></i><b data-nowrap>${SETTLEMENT.platformFeePercent}%</b><span data-nowrap>Platform fee &middot; ${money(r.platform)}</span></div>
        <div class="lg"><i class="sw s-ref"></i><b data-nowrap>${SETTLEMENT.referralFeePercent}%</b><span data-nowrap>Referral fee &middot; ${money(r.referral)}</span></div>
      </div>
    </div>`;
    const net = `<div class="rnet" data-qa="net"><span class="nw" data-nowrap>Win: <b>+${money(r.net)} USDT</b> net</span><span class="nl" data-nowrap>Lose: <b>&minus;${money(stake)} USDT</b></span></div>`;
    const lead = `${h1(spec.headline, size, { lines: 2, max: size.h1Max * (split ? 0.7 : 0.8) })}${subhead(spec.subhead, size, { lines: split ? 1 : 2 })}`;
    // Split layouts move the win/lose line under the headline so the right column holds only the maths.
    return {
      lead: split ? `${lead}${net}` : lead,
      hero: `<div class="rwrap"><p class="eyebrow" data-nowrap>Worked example &middot; no transaction</p>${flow}${bar}${split ? '' : net}</div>`,
      after: `<p class="disclosure" data-qa="disclosure" data-safe><span class="d18" data-nowrap>18+</span><span class="dtext">${esc(DISCLOSURE)}</span></p>`,
      css: CSS(size),
    };
  },
};

const CSS = (s) => {
  const split = s.mode === 'split';
  const compact = s.id === 'square';
  const u = s.sub; // type unit
  return `
.lead .sub{margin-top:${Math.round(s.gap * 0.6)}px}
.tpl-rules .hero{align-items:stretch}
.rwrap{display:flex;flex-direction:column;justify-content:${split ? 'center' : 'space-between'};gap:${Math.round(s.gap * (split ? 0.6 : compact ? 0.5 : 0.9))}px;width:100%;height:100%;padding:${split ? 0 : Math.round(s.gap * (compact ? 0.2 : 0.6))}px 0}
.rflow{display:${split ? 'flex' : 'grid'};${split ? 'flex-direction:column;' : 'grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr);align-items:stretch;'}gap:${Math.round(s.gap * 0.5)}px;position:relative}
.rcard{background:var(--panel);border-radius:${Math.round(s.footerH * 0.3)}px;padding:${Math.round(s.gap * (split ? 0.45 : compact ? 0.7 : 1.0))}px ${Math.round(s.gap * 0.8)}px;display:flex;flex-direction:${split ? 'row' : 'column'};${split ? 'align-items:baseline;justify-content:space-between;gap:12px;' : 'gap:6px;'}
  box-shadow:inset 0 0 0 2px var(--line),inset 0 1px 0 var(--edge);min-width:0}
.rlabel{font:700 ${Math.max(s.minText, Math.round(u * (split ? 0.62 : 0.66)))}px/1.1 var(--body);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.rval{font-family:var(--display);font-weight:700;line-height:.95;color:var(--fg);letter-spacing:-.005em;white-space:nowrap;font-variant-numeric:tabular-nums}
.runit{font:700 ${Math.round(u * 0.72)}px/1 var(--body);letter-spacing:.1em;color:var(--muted)}
${split ? '.rcard .runit{display:none}.rcard .rval::after{content:" USDT";font:700 ' + Math.round(u * 0.7) + 'px/1 var(--body);letter-spacing:.08em;color:var(--muted)}.rcard.r3 .rval::after{color:#000}' : ''}
.rcard.r3{background:var(--volt);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 -3px 0 rgba(0,0,0,.14)}
.rcard.r3 .rlabel,.rcard.r3 .rval,.rcard.r3 .runit{color:#000}
.rop{align-self:center;font:700 ${Math.round(u * 2.0)}px/1 var(--display);color:var(--fg);text-align:center;${split ? 'display:none' : ''}}
.rbar{display:flex;flex-direction:column;gap:${Math.round(u * 0.5)}px}
.rtrack{display:flex;height:${Math.round(u * 0.8)}px;gap:4px;border-radius:99px;overflow:hidden}
.rtrack i{display:block;height:100%}
.s-win{background:var(--seg-win)}.s-plat{background:var(--seg-plat)}.s-ref{background:var(--volt);box-shadow:inset 0 0 0 2px rgba(0,0,0,.35)}
.rlegend{display:${split ? 'flex;flex-direction:column;gap:6px' : 'grid;grid-template-columns:1fr 1.1fr 1.1fr;gap:12px'}}
.lg{display:grid;grid-template-columns:auto auto 1fr;grid-template-rows:auto;column-gap:${Math.round(u * 0.35)}px;align-items:center;min-width:0}
.lg .sw{width:${Math.round(u * 0.5)}px;height:${Math.round(u * (split ? 0.9 : 1.6))}px;border-radius:6px;margin:0}
.lg b{font:700 ${Math.round(u * (split ? 1.2 : compact ? 1.6 : 1.9))}px/1 var(--display);color:var(--fg);letter-spacing:-.005em}
.lg span{font:600 ${Math.round(u * (split ? 0.74 : 0.74))}px/1.15 var(--body);color:var(--muted)}
${split ? '' : '.lg{grid-template-columns:auto 1fr;grid-template-rows:auto auto}.lg .sw{grid-row:1/3}.lg span{grid-column:2}'}
.rnet{display:flex;justify-content:space-between;gap:16px;font:600 ${Math.round(u * (split ? 0.86 : 0.92))}px/1.2 var(--body);color:var(--muted);${split ? 'flex-direction:column;gap:4px;margin-top:' + Math.round(s.gap * 0.6) + 'px' : 'border-top:2px solid var(--line);padding-top:' + Math.round(u * 0.6) + 'px'}}
.rnet b{color:var(--fg);font-weight:700}
.disclosure{display:flex;align-items:center;gap:${Math.round(u * 0.6)}px;border-radius:${Math.round(s.footerH * 0.26)}px;padding:${Math.round(u * 0.5)}px ${Math.round(u * 0.7)}px;background:var(--fg);color:var(--bg);font:600 ${Math.round(u * 0.8)}px/1.22 var(--body)}
.d18{flex:none;height:${Math.round(u * 1.5)}px;min-width:${Math.round(u * 1.5)}px;padding:0 ${Math.round(u * 0.4)}px;border-radius:99px;background:var(--bg);color:var(--fg);display:inline-flex;align-items:center;justify-content:center;font:700 ${Math.round(u * 0.8)}px/1 var(--body)}
.dtext{min-width:0}
`;
};
