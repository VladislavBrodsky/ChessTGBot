// Small HTML helpers shared by the templates.

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Headline markup: `*word*` marks an accent run (mint on ink, voltage marker on paper),
 * `{Ra8#}` keeps its letter case (headlines are uppercase; chess notation must not be),
 * "\n" is a forced line break. Everything else is escaped.
 */
export function rich(text) {
  const parts = String(text ?? '').split('*');
  return parts
    .map((p, i) => {
      const h = esc(p).replace(/\n/g, '<br>').replace(/\{([^}]*)\}/g, '<span class="keep">$1</span>');
      return i % 2 === 1 ? `<span class="hl" data-bgvar="--hl-bg">${h}</span>` : h;
    })
    .join('');
}

/** Plain text of a rich string (accent markers and newlines removed) for length checks. */
export function plain(text) {
  return String(text ?? '').replace(/[*{}]/g, '').replace(/\n/g, ' ');
}

export const ICON = {
  arrowUpRight: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  arrowRight: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"/></svg>',
  x: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  check: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
};

/** Pieces as standalone <svg> for big decorative use (culture panels, news texture). */
export function pieceSvg(pieces, key, cls = 'piece-art') {
  return `<svg class="${cls}" viewBox="0 0 45 45" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${pieces[key]}</svg>`;
}

/** Display headline. The page script shrinks it (max -> min) until it fits `lines`. */
export function h1(text, size, { lines = 2, max, min, fitH } = {}) {
  return `<h1 class="h1" data-qa="headline" data-fit data-fit-max="${Math.round(max ?? size.h1Max)}" data-fit-min="${Math.round(min ?? size.h1Min)}" data-fit-lines="${lines}"${fitH ? ` data-fit-h="${fitH}"` : ''}>${rich(text)}</h1>`;
}

export function subhead(text, size, { lines = 2, cls = '', max, min } = {}) {
  if (!text) return '';
  return `<p class="sub ${cls}" data-qa="subhead" data-fit data-fit-max="${Math.round(max ?? size.sub)}" data-fit-min="${Math.round(min ?? size.subMin)}" data-fit-lines="${lines}">${rich(text)}</p>`;
}
