// Canvas sizes, themes, base CSS and the shared frame (header / main / CTA strip).
import { loadAssets } from './assets.mjs';
import { esc, ICON } from './ui.mjs';

export const SITE_URL = 'web3chess.online'; // the only link ever shown on an image
export const SAFE_MARGIN = 56;

/**
 * Size presets. `mode: stack` = lead text, then hero (board/visual), then extras, top to bottom.
 * `mode: split` = text column on the left, hero on the right (hero is a square, full inner height).
 */
export const SIZES = {
  portrait: { id: 'portrait', w: 1080, h: 1350, mode: 'stack', minText: 22, headerH: 56, footerH: 92, gap: 26, ring: 32, coord: 24, chip: 24, chipH: 52, logoH: 46, cta: 34, url: 26, sub: 34, subMin: 26, h1Max: 168, h1Min: 66 },
  square: { id: 'square', w: 1080, h: 1080, mode: 'stack', minText: 22, headerH: 52, footerH: 80, gap: 20, ring: 28, coord: 22, chip: 22, chipH: 48, logoH: 42, cta: 30, url: 24, sub: 30, subMin: 24, h1Max: 140, h1Min: 56 },
  wide: { id: 'wide', w: 1280, h: 720, mode: 'split', minText: 20, headerH: 52, footerH: 72, gap: 20, ring: 26, coord: 20, chip: 20, chipH: 44, logoH: 38, cta: 27, url: 22, sub: 28, subMin: 22, h1Max: 120, h1Min: 48, heroW: 516, colGap: 48 },
  cover: { id: 'cover', w: 1200, h: 630, mode: 'split', minText: 17, headerH: 44, footerH: 60, gap: 16, ring: 22, coord: 17, chip: 17, chipH: 38, logoH: 32, cta: 22, url: 19, sub: 24, subMin: 20, h1Max: 100, h1Min: 44, heroW: 442, colGap: 48 },
};
export const PUBLIC_SIZES = ['portrait', 'square', 'wide']; // spec.size values; 'cover' only via the cover template

export const THEMES = {
  ink: {
    bg: '#000000', fg: '#ffffff', muted: '#c6c6c6', panel: '#121212', panel2: '#1b1b1b',
    line: 'rgba(255,255,255,.16)', edge: 'rgba(255,255,255,.22)', accent: '#d1ffca',
    chipBg: '#d1ffca', chipFg: '#000000', stripBg: '#d1ffca', stripFg: '#000000', urlBg: '#000000', urlFg: '#d1ffca',
    hlFg: '#d1ffca', hlBg: 'transparent', logo: 'ink', shadow: 'rgba(0,0,0,.8)', inkOnPanel: '#ffffff',
  },
  paper: {
    bg: '#e5e5e5', fg: '#000000', muted: '#444444', panel: '#ffffff', panel2: '#f3f3f3',
    line: 'rgba(0,0,0,.16)', edge: 'rgba(255,255,255,.9)', accent: '#000000',
    chipBg: '#d1ffca', chipFg: '#000000', stripBg: '#000000', stripFg: '#ffffff', urlBg: '#d1ffca', urlFg: '#000000',
    hlFg: '#000000', hlBg: '#fff100', logo: 'light', shadow: 'rgba(0,0,0,.45)', inkOnPanel: '#000000',
  },
  mint: {
    bg: '#d1ffca', fg: '#000000', muted: '#2f2f2f', panel: '#ffffff', panel2: '#f3f3f3',
    line: 'rgba(0,0,0,.2)', edge: 'rgba(255,255,255,.9)', accent: '#000000',
    chipBg: '#000000', chipFg: '#d1ffca', stripBg: '#000000', stripFg: '#ffffff', urlBg: '#d1ffca', urlFg: '#000000',
    hlFg: '#d1ffca', hlBg: '#000000', logo: 'light', shadow: 'rgba(0,0,0,.4)', inkOnPanel: '#000000',
  },
};

const NOISE = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .9 0"/></filter><rect width="240" height="240" filter="url(#n)"/></svg>`,
);

export function baseCss(size, themeName) {
  const t = THEMES[themeName];
  const s = size;
  const dark = themeName === 'ink';
  const colW = s.mode === 'split' ? s.w - 2 * SAFE_MARGIN - s.heroW - s.colGap : s.w - 2 * SAFE_MARGIN;
  return `
${loadAssets().fontCss}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${s.w}px;height:${s.h}px;overflow:hidden;background:${t.bg}}
:root{
  --bg:${t.bg};--fg:${t.fg};--muted:${t.muted};--panel:${t.panel};--panel2:${t.panel2};--line:${t.line};--edge:${t.edge};
  --accent:${t.accent};--chip-bg:${t.chipBg};--chip-fg:${t.chipFg};--strip-bg:${t.stripBg};--strip-fg:${t.stripFg};
  --url-bg:${t.urlBg};--url-fg:${t.urlFg};--hl-fg:${t.hlFg};--hl-bg:${t.hlBg};--shadow:${t.shadow};
  --mint:#d1ffca;--volt:#fff100;--seg-win:${themeName === 'ink' ? '#d1ffca' : '#000000'};--seg-plat:${themeName === 'ink' ? '#ffffff' : '#979797'};--ring:${s.ring}px;--gap:${s.gap}px;--colw:${colW}px;
  --display:"Barlow Condensed","Arial Narrow",sans-serif;--body:"Onest",system-ui,sans-serif;
}
#canvas{position:relative;width:${s.w}px;height:${s.h}px;overflow:hidden;background:${t.bg};color:var(--fg);font-family:var(--body);font-weight:500;font-synthesis:none;text-rendering:geometricPrecision}

/* ---- backdrop: gradients, board motif, grain, vignette (decorative; exempt from margin QA) ---- */
.bg{position:absolute;inset:0;pointer-events:none}
.bg-grad{background:${dark
    ? 'radial-gradient(85% 55% at 0% 0%,rgba(255,255,255,.13),transparent 62%),radial-gradient(70% 50% at 100% 100%,rgba(209,255,202,.12),transparent 68%),linear-gradient(180deg,#0b0b0b,#000 60%)'
    : themeName === 'mint'
      ? 'radial-gradient(80% 55% at 0% 0%,rgba(255,255,255,.55),transparent 62%),radial-gradient(70% 50% at 100% 100%,rgba(0,0,0,.10),transparent 68%)'
      : 'radial-gradient(85% 55% at 0% 0%,rgba(255,255,255,.75),transparent 62%),radial-gradient(70% 50% at 100% 100%,rgba(0,0,0,.10),transparent 68%)'}}
.bg-checks{position:absolute;right:-120px;top:-120px;width:${Math.round(s.w * 0.8)}px;height:${Math.round(s.w * 0.8)}px;
  background:repeating-conic-gradient(${dark ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.055)'} 0 25%,transparent 0 50%) 0 0/${Math.round(s.w / 6)}px ${Math.round(s.w / 6)}px;
  -webkit-mask-image:radial-gradient(closest-side,#000 10%,transparent 100%);mask-image:radial-gradient(closest-side,#000 10%,transparent 100%)}
.bg-noise{background:url("data:image/svg+xml,${NOISE}");background-size:240px 240px;opacity:${dark ? '.16' : '.10'};mix-blend-mode:${dark ? 'overlay' : 'multiply'}}
.bg-vig{background:radial-gradient(120% 90% at 50% 40%,transparent 55%,${dark ? 'rgba(0,0,0,.55)' : 'rgba(0,0,0,.16)'} 100%)}

/* ---- frame ---- */
.frame{position:absolute;left:${SAFE_MARGIN}px;top:${SAFE_MARGIN}px;right:${SAFE_MARGIN}px;bottom:${SAFE_MARGIN}px;
  ${s.mode === 'split'
    ? `display:grid;grid-template-columns:minmax(0,1fr) ${s.heroW}px;grid-template-rows:${s.headerH}px minmax(0,1fr) ${s.footerH}px;column-gap:${s.colGap}px;row-gap:${s.gap}px`
    : `display:flex;flex-direction:column;gap:${s.gap}px`}}
.head{height:${s.headerH}px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;${s.mode === 'split' ? 'grid-area:1/1;' : ''}min-width:0}
.head-r{display:flex;align-items:center;gap:14px;min-width:0}
.logo{display:block;height:${s.logoH}px;flex:none}
.logo-svg{display:block;height:${s.logoH}px;width:auto}
.chip{height:${s.chipH}px;padding:0 ${Math.round(s.chipH * 0.42)}px;border-radius:999px;background:var(--chip-bg);color:var(--chip-fg);
  display:inline-flex;align-items:center;gap:10px;font:700 ${s.chip}px/1 var(--body);letter-spacing:.07em;text-transform:uppercase;white-space:nowrap;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(0,0,0,.12)}
.chip i{width:${Math.round(s.chip * 0.42)}px;height:${Math.round(s.chip * 0.42)}px;border-radius:50%;background:#000;flex:none}
.main{flex:1;min-height:0;display:flex;flex-direction:column;gap:var(--gap);${s.mode === 'split' ? 'grid-area:2/1;' : ''}min-width:0}
.lead{flex:none;min-width:0}
.hero{position:relative;min-height:0;min-width:0;display:flex;align-items:center;justify-content:center;
  ${s.mode === 'split' ? 'grid-area:1/2/3/3;' : 'flex:1;'}}
.after{flex:none;min-width:0}
.foot-note{flex:none;font:500 ${Math.round(s.sub * 0.72)}px/1.25 var(--body);color:var(--muted)}

/* ---- type ---- */
.h1{font-family:var(--display);font-weight:700;text-transform:uppercase;line-height:.9;letter-spacing:-.004em;color:var(--fg);text-wrap:balance;font-size:${s.h1Max}px}
.h1 .hl{color:var(--hl-fg);background:linear-gradient(to bottom,transparent .21em,var(--hl-bg) .21em,var(--hl-bg) .99em,transparent .99em);padding:0 .09em 0 0;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.keep{text-transform:none}
.sub{font:500 ${s.sub}px/1.26 var(--body);color:var(--muted);text-wrap:pretty;letter-spacing:-.005em}
.sub b{color:var(--fg);font-weight:700}
.eyebrow{font:700 ${Math.max(s.minText, Math.round(s.sub * 0.7))}px/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}

/* ---- CTA strip ---- */
.strip{${s.mode === 'split' ? 'grid-area:3/1/4/3;' : ''}flex:none;height:${s.footerH}px;border-radius:${Math.round(s.footerH * 0.26)}px;background:var(--strip-bg);color:var(--strip-fg);
  display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 ${Math.round(s.footerH * 0.13)}px 0 ${Math.round(s.footerH * 0.36)}px;position:relative;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(0,0,0,.14),0 22px 44px -20px var(--shadow)}
.strip .cta{font:700 ${s.cta}px/1 var(--body);letter-spacing:-.012em;white-space:nowrap;min-width:0;flex:1}
.strip .url{height:${s.footerH - Math.round(s.footerH * 0.26)}px;padding:0 ${Math.round(s.footerH * 0.26)}px;border-radius:${Math.round(s.footerH * 0.17)}px;background:var(--url-bg);color:var(--url-fg);
  display:inline-flex;align-items:center;gap:10px;font:700 ${s.url}px/1 var(--body);letter-spacing:-.005em;white-space:nowrap;flex:none}
.ico{width:1.05em;height:1.05em;flex:none}

/* soft spotlight behind a board hero (decorative) */
.hero:has(> .board)::before{content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse 62% 58% at 50% 50%,${dark ? 'rgba(209,255,202,.17)' : 'rgba(255,255,255,.75)'},transparent 100%)}
/* ---- board ---- */
.board{--sq:0px;display:grid;grid-template-columns:var(--ring) calc(8*var(--sq)) var(--ring);grid-template-rows:var(--ring) calc(8*var(--sq)) var(--ring);
  background:linear-gradient(155deg,#2a2a2a 0%,#0a0a0a 38%,#000 100%);border-radius:${Math.round(s.ring * 0.9)}px;flex:none;
  box-shadow:0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.28),0 44px 70px -30px var(--shadow)${dark ? ',0 0 140px -30px rgba(209,255,202,.30)' : ''}}
.board .b-grid{grid-column:2;grid-row:2;width:calc(8*var(--sq));height:calc(8*var(--sq));display:block;border-radius:3px}
.board .b-ranks{grid-column:1;grid-row:2;display:grid;grid-template-rows:repeat(8,var(--sq));align-items:center;justify-items:center}
.board .b-files{grid-column:2;grid-row:3;display:grid;grid-template-columns:repeat(8,var(--sq));align-items:center;justify-items:center}
.board.no-coords .b-ranks,.board.no-coords .b-files{display:none}
.board .b-ranks span,.board .b-files span{font:700 ${s.coord}px/1 var(--body);color:#c6c6c6;letter-spacing:.02em}
.board .pieces{filter:drop-shadow(0 5px 4px rgba(0,0,0,.38))}
.board .pieces:not(.shadowed){filter:none}
.board .arrow{filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}
.board .marker{filter:drop-shadow(0 4px 4px rgba(0,0,0,.4))}
`;
}

/** Strip is identical on every template: the CTA label + the one real URL. */
export function stripHtml(spec, size) {
  return `<div class="strip" data-safe><span class="cta" data-qa="cta" data-fit data-fit-max="${size.cta}" data-fit-min="${Math.round(size.cta * 0.74)}" data-fit-lines="1">${esc(spec.cta_label)}</span><span class="url" data-nowrap>${esc(SITE_URL)}${ICON.arrowUpRight}</span></div>`;
}

export function headerHtml(spec, size, themeName, extra = '') {
  const a = loadAssets();
  const logo = a.logo[THEMES[themeName].logo];
  const right = `${extra}${spec.tag ? `<span class="chip" data-nowrap>${esc(spec.tag)}</span>` : ''}`;
  return `<div class="head"><span class="logo" data-safe>${logo}</span><span class="head-r">${right}</span></div>`;
}

/**
 * Assemble a full page. `parts` come from a template: { lead, hero, after, css, canvasClass }.
 */
export function pageHtml({ spec, size, themeName, parts }) {
  const t = THEMES[themeName];
  const split = size.mode === 'split';
  const heroAttr = parts.hero && parts.hero.includes('class="board') ? '' : '';
  const note = spec.footer ? `<p class="foot-note" data-max-lines="1" data-nowrap>${esc(spec.footer)}</p>` : '';
  const main = `<div class="main">${parts.lead || ''}${split ? '' : parts.hero ? `<div class="hero">${parts.hero}</div>` : ''}${parts.after || ''}${note}</div>`;
  const hero = split && parts.hero ? `<div class="hero">${parts.hero}</div>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(spec.headline)}</title>
<style>${baseCss(size, themeName)}${parts.css || ''}</style></head>
<body><div id="canvas" class="size-${size.id} theme-${themeName} tpl-${spec.template} ${parts.canvasClass || ''}" data-bg="${t.bg}">
<div class="bg bg-grad" data-bleed></div><div class="bg bg-checks" data-bleed></div><div class="bg bg-noise" data-bleed></div><div class="bg bg-vig" data-bleed></div>
${parts.bgExtra || ''}
<div class="frame">${headerHtml(spec, size, themeName, parts.headExtra || '')}${main}${hero}${stripHtml(spec, size)}</div>
</div></body></html>`;
}
