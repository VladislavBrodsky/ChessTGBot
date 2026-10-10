/* Runs INSIDE the render page (Chromium). Layout fitting + the QA gate.
 * window.__run({ W, H, margin }) -> { errors: string[], info: {...} }
 * Kept dependency-free and deterministic: only measures, never randomises.
 */
window.__run = function (cfg) {
  const errors = [];
  const info = { fits: [], boards: [] };
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const canvas = document.getElementById('canvas');

  const hasOwnText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
  const text1 = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
  const describe = (el) => {
    const name = el.getAttribute('data-qa') || el.className?.baseVal || el.className || el.tagName.toLowerCase();
    const t = text1(el);
    return `${String(name).trim().split(/\s+/)[0]}${t ? ` "${t.length > 48 ? t.slice(0, 45) + '...' : t}"` : ''}`;
  };
  const lineHeightPx = (el) => {
    const cs = getComputedStyle(el);
    const lh = parseFloat(cs.lineHeight);
    return Number.isFinite(lh) ? lh : parseFloat(cs.fontSize) * 1.2;
  };
  // Count rendered lines from the text's own client rects (works for stretched/flex boxes too).
  const countLines = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => (r.top + r.bottom) / 2)
      .sort((a, b) => a - b);
    const lh = lineHeightPx(el);
    let lines = tops.length ? 1 : 0;
    for (let i = 1; i < tops.length; i++) if (tops[i] - tops[i - 1] > lh * 0.5) lines++;
    return lines;
  };
  // Inline spans report their (taller) font box; layout checks use the enclosing block instead.
  const blockOf = (el) => {
    let n = el;
    while (n.parentElement && getComputedStyle(n).display === 'inline') n = n.parentElement;
    return n;
  };

  // Union of the element's text rects, trimmed vertically (font boxes are taller than the glyph ink).
  const inkRect = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rs = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    if (!rs.length) return null;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    const inset = fs * 0.1;
    return {
      left: Math.min(...rs.map((r) => r.left)),
      right: Math.max(...rs.map((r) => r.right)),
      top: Math.min(...rs.map((r) => r.top)) + inset,
      bottom: Math.max(...rs.map((r) => r.bottom)) - inset,
    };
  };

  // ---- 1. fit text: largest font-size that satisfies max lines / width / height ----
  for (const el of $$('[data-fit]')) {
    const max = +el.dataset.fitMax;
    const min = +el.dataset.fitMin;
    const maxLines = +(el.dataset.fitLines || 99);
    const maxH = el.dataset.fitH ? +el.dataset.fitH : Infinity;
    const fill = el.hasAttribute('data-fit-fill'); // must also fit the height the layout gave it
    let chosen = null;
    let lastLines = 0;
    for (let size = max; size >= min; size -= 1) {
      el.style.fontSize = size + 'px';
      const lines = countLines(el);
      lastLines = lines;
      const overflowX = el.scrollWidth > el.clientWidth + 1;
      const h = el.getBoundingClientRect().height;
      let overflowY = false;
      if (fill) {
        const ink = inkRect(el);
        const box = el.getBoundingClientRect();
        overflowY = !!ink && (ink.top < box.top - 0.06 * size || ink.bottom > box.bottom + 0.06 * size);
      }
      if (lines <= maxLines && !overflowX && !overflowY && h <= maxH + 0.5) {
        chosen = size;
        break;
      }
    }
    if (chosen === null) {
      el.style.fontSize = min + 'px';
      const why = [];
      if (countLines(el) > maxLines) why.push('too many lines');
      if (el.scrollWidth > el.clientWidth + 1) why.push(`wider than its ${el.clientWidth}px box (a long word?)`);
      if (fill) { const ink = inkRect(el); const box = el.getBoundingClientRect(); if (ink && (ink.top < box.top - 1 || ink.bottom > box.bottom + 1)) why.push(`taller than the ${Math.round(box.height)}px it is given`); }
      errors.push(
        `${el.dataset.qa || 'text'} does not fit (${why.join('; ') || 'height limit'}): ${countLines(el)} lines (max ${maxLines}) at the minimum size ${min}px` +
          (maxH < Infinity ? ` / height limit ${maxH}px` : '') +
          ` - shorten the copy. Text: "${text1(el).slice(0, 80)}"`,
      );
    } else {
      info.fits.push({ el: el.dataset.qa || el.className, size: chosen, lines: lastLines });
    }
  }

  // ---- 2. size boards to whole-pixel squares inside their container ----
  for (const b of $$('.board')) {
    const host = b.parentElement;
    const cs = getComputedStyle(host);
    const cw = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ch = host.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    const cap = b.dataset.boardMax ? +b.dataset.boardMax : Infinity;
    const ring = parseFloat(getComputedStyle(b).getPropertyValue('--ring')) || 28;
    const avail = Math.min(cw, ch, cap);
    const sq = Math.floor((avail - 2 * ring) / 8);
    b.style.setProperty('--sq', Math.max(sq, 0) + 'px');
    info.boards.push({ avail, sq });
    if (sq < 28) errors.push(`board is too small (${sq}px squares) - the headline/extras leave only ${Math.round(avail)}px for it`);
  }

  // ---- 3. QA gate ----
  const m = cfg.margin;
  const inBleed = (el) => !!el.closest('[data-bleed]');
  const textRaw = $$('#canvas *').filter((el) => hasOwnText(el) && !inBleed(el) && !el.closest('svg'));
  const textEls = Array.from(new Set(textRaw.map(blockOf)));
  const safeEls = $$('[data-safe]').filter((el) => !inBleed(el));

  // 3a. overflow: an element whose content is larger than its box
  for (const el of $$('#canvas *')) {
    if (inBleed(el) || el.closest('svg') || el.hasAttribute('data-overflow-ok')) continue; // data-overflow-ok: decorative glow only
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' || cs.display === 'contents') continue;
    // Horizontal overflow is exact. Vertical gets a tolerance: with tight line-heights a glyph's
    // em-box legitimately pokes past the line box (ink stays inside).
    const slack = 0.4 * Math.max(parseFloat(cs.fontSize), ...Array.from(el.querySelectorAll('*')).filter(hasOwnText).map((n) => parseFloat(getComputedStyle(n).fontSize)));
    if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + slack) {
      if (el.clientWidth === 0 && el.clientHeight === 0) continue;
      errors.push(
        `${describe(el)} overflows its box (content ${el.scrollWidth}x${el.scrollHeight}px in ${el.clientWidth}x${el.clientHeight}px)`,
      );
    }
  }

  // 3b. max-lines
  for (const el of $$('[data-max-lines]')) {
    const lines = countLines(el);
    if (lines > +el.dataset.maxLines) errors.push(`${describe(el)} wraps to ${lines} lines (max ${el.dataset.maxLines})`);
  }

  // 3b2. max rows for chip/flex-wrap containers (rows = clusters of child centres)
  for (const el of $$('[data-max-rows]')) {
    const centres = Array.from(el.children)
      .map((c) => { const r = c.getBoundingClientRect(); return (r.top + r.bottom) / 2; })
      .sort((a, b) => a - b);
    let rows = centres.length ? 1 : 0;
    for (let i = 1; i < centres.length; i++) if (centres[i] - centres[i - 1] > 14) rows++;
    if (rows > +el.dataset.maxRows) errors.push(`${describe(el)} needs ${rows} rows (max ${el.dataset.maxRows}) - too many items for this size`);
  }

  // 3c. nothing outside the safe margin
  const safeCheck = new Map();
  for (const el of [...textEls, ...safeEls]) safeCheck.set(el, el.getBoundingClientRect());
  for (const el of textRaw) { const ink = inkRect(el); if (ink) safeCheck.set(el, { left: ink.left, right: ink.right, top: ink.top, bottom: ink.bottom, width: 1, height: 1 }); }
  for (const [el, r] of safeCheck) {
    if (r.width === 0 && r.height === 0) continue;
    if (r.left < m - 0.5 || r.top < m - 0.5 || r.right > cfg.W - m + 0.5 || r.bottom > cfg.H - m + 0.5) {
      errors.push(
        `${describe(el)} is outside the ${m}px safe margin (box x ${Math.round(r.left)}-${Math.round(r.right)}, y ${Math.round(r.top)}-${Math.round(r.bottom)} on ${cfg.W}x${cfg.H})`,
      );
    }
  }

  // 3d. text boxes must not overlap each other
  const rects = textRaw
    .filter((el) => !el.closest('[data-overlap-ok]'))
    .map((el) => ({ el, r: inkRect(el) }))
    .filter((o) => o.r);
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (blockOf(a.el) === blockOf(b.el)) continue; // lines inside one block never overlap; the browser lays them out
      const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (w > 2 && h > 2) errors.push(`text overlap: ${describe(a.el)} and ${describe(b.el)} (${Math.round(w)}x${Math.round(h)}px)`);
    }
  }

  // 3e. WCAG AA contrast for every text element
  const parse = (c) => {
    c = (c || '').trim();
    let mm = c.match(/^#([0-9a-f]{6})$/i);
    if (mm) return [parseInt(mm[1].slice(0, 2), 16), parseInt(mm[1].slice(2, 4), 16), parseInt(mm[1].slice(4, 6), 16), 1];
    mm = c.match(/^rgba?\(([^)]+)\)$/);
    if (mm) {
      const p = mm[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    }
    return null;
  };
  const lum = ([r, g, b]) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const mix = (fg, bg, a) => [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a));
  const effectiveBg = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      if (n.dataset && n.dataset.bg) return parse(n.dataset.bg);
      if (n.dataset && n.dataset.bgvar) {
        const v = parse(getComputedStyle(n).getPropertyValue(n.dataset.bgvar));
        if (v && v[3] > 0.9) return v;
      }
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0.9) return c;
    }
    return parse(canvas.dataset.bg);
  };
  const chainOpacity = (el) => {
    let o = 1;
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity);
    return o;
  };
  for (const el of textRaw) {
    const cs = getComputedStyle(el);
    const fg = parse(cs.color);
    const bg = effectiveBg(el);
    if (!fg || !bg) continue;
    const a = fg[3] * chainOpacity(el);
    const eff = mix(fg, bg, a);
    const L1 = lum(eff);
    const L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (bold && size >= 18.66);
    const need = large ? 3 : 4.5;
    if (ratio < need) errors.push(`low contrast ${ratio.toFixed(2)}:1 (needs ${need}:1) for ${describe(el)} - ${cs.color} on rgb(${bg.slice(0, 3).map(Math.round)})`);
  }

  // 3f. minimum legible size at phone scale (Telegram shows ~1/3 scale)
  for (const el of textRaw) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < (cfg.minText || 16)) errors.push(`${describe(el)} is ${size.toFixed(1)}px - below the ${cfg.minText || 16}px minimum`);
  }

  info.textCount = textEls.length;
  return { errors: Array.from(new Set(errors)), info };
};
