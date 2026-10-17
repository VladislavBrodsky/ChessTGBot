// Intel: high-density visual intelligence bento card for tactical, motivational, and treasury dispatches.
import { esc, h1, subhead } from '../lib/ui.mjs';

export default {
  id: 'intel',
  defaults: { theme: 'ink', tag: 'Intel' },
  required: ['headline', 'category', 'score', 'metrics', 'blueprint'],
  extraFields: ['tracker', 'telemetry', 'category', 'score', 'title', 'metrics', 'blueprint', 'command'],

  validate(spec) {
    if (!Array.isArray(spec.metrics) || spec.metrics.length < 2 || spec.metrics.length > 4) {
      throw new Error('intel `metrics` requires an array of 2 to 4 metric items');
    }
    for (const m of spec.metrics) {
      if (!m || typeof m !== 'object') throw new Error('each intel metric must be an object with val and label');
      if (typeof m.val !== 'string' && typeof m.val !== 'number') throw new Error(`intel metric val must be string or number: ${m.val}`);
      if (!m.label || typeof m.label !== 'string' || m.label.length > 32) throw new Error(`intel metric label must be 1-32 chars: "${m.label}"`);
    }
    if (typeof spec.category !== 'string' || !spec.category.trim() || spec.category.length > 70) {
      throw new Error('intel `category` is required (1-70 characters)');
    }
    if (typeof spec.score !== 'string' || !spec.score.trim() || spec.score.length > 45) {
      throw new Error('intel `score` is required (1-45 characters)');
    }
    if (typeof spec.blueprint !== 'string' || !spec.blueprint.trim() || spec.blueprint.length > 180) {
      throw new Error('intel `blueprint` is required (1-180 characters)');
    }
    if (spec.title && (typeof spec.title !== 'string' || spec.title.length > 70)) {
      throw new Error('intel `title` must be at most 70 characters');
    }
  },

  build(spec, { size, themeName }) {
    const split = size.mode === 'split';
    const tracker = spec.tracker
      ? `<div class="eyebrow intel-tracker" data-safe data-nowrap>${esc(spec.tracker)}</div>`
      : `<div class="eyebrow intel-tracker" data-safe data-nowrap>✦ INTEL DISPATCH</div>`;

    const headExtra = spec.telemetry
      ? `<span class="intel-telemetry" data-safe data-nowrap>${esc(spec.telemetry)}</span>`
      : '';

    const cmd = spec.command
      ? `<div class="intel-cmd" data-safe data-nowrap><span class="intel-prompt" data-nowrap>&gt;_</span> <span class="intel-cmd-txt" data-nowrap>${esc(spec.command)}</span></div>`
      : '';

    const metricsHtml = spec.metrics
      .map(
        (m) => `<div class="intel-cell ${m.accent ? 'accent' : ''}" data-safe>
          <span class="intel-val" data-nowrap>${esc(String(m.val))}</span>
          <span class="intel-lbl" data-nowrap>${esc(m.label)}</span>
        </div>`,
      )
      .join('');

    const titleHtml = spec.title
      ? `<div class="intel-card-title" data-safe data-nowrap>${esc(spec.title)}</div>`
      : '';

    const bentoCard = `<div class="intel-bento" data-safe data-bg="#141414">
      <div class="intel-top-row">
        <span class="intel-cat" data-safe data-nowrap>${esc(spec.category)}</span>
        <span class="intel-score" data-safe data-nowrap>${esc(spec.score)}</span>
      </div>
      ${titleHtml}
      <div class="intel-grid cols-${spec.metrics.length}">${metricsHtml}</div>
      <div class="intel-bp" data-safe>
        <span class="intel-bp-tag" data-nowrap>BLUEPRINT:</span>
        <span class="intel-bp-text" data-fit data-fit-max="${Math.round(size.sub * 0.95)}" data-fit-min="${size.minText}" data-fit-lines="${split ? 3 : 2}">${esc(spec.blueprint)}</span>
      </div>
    </div>`;

    const leadHeadline = `${tracker}${h1(spec.headline, size, { lines: split ? 3 : 2, max: size.h1Max * (split ? 0.72 : 0.76) })}${subhead(spec.subhead, size, { lines: split ? 2 : 1 })}`;

    if (split) {
      return {
        headExtra,
        lead: `<div class="intel-lead-col">${leadHeadline}${cmd}</div>`,
        hero: bentoCard,
        css: CSS(size),
      };
    }

    return {
      headExtra,
      lead: leadHeadline,
      hero: bentoCard,
      after: cmd ? `<div class="intel-after-bar">${cmd}</div>` : '',
      css: CSS(size),
    };
  },
};

const CSS = (s) => {
  const split = s.mode === 'split';
  return `
.intel-telemetry{height:${s.chipH}px;padding:0 ${Math.round(s.chipH * 0.4)}px;border-radius:999px;background:var(--panel2);color:var(--muted);
  display:inline-flex;align-items:center;font:700 ${s.minText}px/1 var(--body);letter-spacing:.05em;border:1px solid var(--line)}
.intel-tracker{margin-bottom:${Math.round(s.gap * 0.4)}px;color:var(--muted)}
.intel-lead-col{display:flex;flex-direction:column;gap:${Math.round(s.gap * 0.5)}px;height:100%;justify-content:center}
.intel-lead-col .sub{margin-top:${Math.round(s.gap * 0.4)}px}
.intel-cmd{display:inline-flex;align-items:center;gap:10px;background:var(--panel2);border:1px solid var(--line);border-radius:10px;padding:8px 16px;width:fit-content}
.intel-prompt{color:var(--mint);font:700 ${s.minText}px/1 var(--body)}
.intel-cmd-txt{color:var(--fg);font:700 ${s.minText}px/1 var(--body);letter-spacing:.03em}
.intel-after-bar{display:flex;align-items:center}

.intel-bento{width:100%;background:#141414;border:1px solid rgba(255,255,255,.14);border-radius:${Math.round(s.footerH * 0.35)}px;
  padding:${Math.round(s.gap * (split ? 0.8 : 1.1))}px ${Math.round(s.gap * (split ? 0.9 : 1.2))}px;
  display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 30px 60px -25px var(--shadow)}
.intel-top-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.intel-cat{font:700 ${s.minText}px/1 var(--body);letter-spacing:.08em;color:var(--muted);text-transform:uppercase}
.intel-score{padding:5px 12px;border-radius:999px;background:var(--mint);color:#000000;font:700 ${s.minText}px/1 var(--body);letter-spacing:.04em;text-transform:uppercase}

.intel-card-title{font:700 ${Math.round(s.sub * 1.05)}px/1.2 var(--body);letter-spacing:-.01em;color:#ffffff;text-transform:uppercase;margin-top:${Math.round(s.gap * 0.5)}px}

.intel-grid{display:grid;gap:${Math.round(s.gap * (split ? 0.4 : 0.6))}px;margin-top:${Math.round(s.gap * 0.6)}px;margin-bottom:${Math.round(s.gap * 0.6)}px}
.intel-grid.cols-2{grid-template-columns:repeat(2,1fr)}
.intel-grid.cols-3{grid-template-columns:repeat(3,1fr)}
.intel-grid.cols-4{${split ? 'grid-template-columns:repeat(2,1fr);' : 'grid-template-columns:repeat(4,1fr);'}}

.intel-cell{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:${Math.round(s.footerH * 0.2)}px;
  padding:${Math.round(s.gap * (split ? 0.5 : 0.7))}px ${Math.round(s.gap * 0.6)}px;display:flex;flex-direction:column;justify-content:center;gap:6px}
.intel-cell.accent{background:rgba(209,255,202,.08);border-color:rgba(209,255,202,.28)}
.intel-cell.accent .intel-val{color:var(--mint)}
.intel-val{font:700 ${Math.round(s.sub * (split ? 1.4 : 1.55))}px/1 var(--body);color:#ffffff;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.intel-lbl{font:700 ${s.minText}px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}

.intel-bp{border-top:1px solid rgba(255,255,255,.10);padding-top:${Math.round(s.gap * 0.6)}px;display:flex;align-items:flex-start;gap:10px}
.intel-bp-tag{color:var(--mint);font:700 ${s.minText}px/1.25 var(--body);letter-spacing:.06em;flex:none}
.intel-bp-text{color:#e6e6e6;font:500 ${Math.round(s.sub * 0.95)}px/1.26 var(--body);flex:1;min-width:0}
`;
};
