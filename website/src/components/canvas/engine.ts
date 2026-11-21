import { ICON_PATHS } from "@/icons/generated";
import type { IconName } from "@/icons";
import { CANVAS_FORMATS, type CanvasFormat, type CanvasTemplate } from "./types";

const COLORS = {
  canvas: "#E5E5E5",
  paper: "#FFFFFF",
  ink: "#0A0A0A",
  mint: "#D1FFCA",
  voltage: "#FFF100",
  muted: "#525252",
  mutedDark: "#A3A3A3",
  line: "#D4D4D4",
  lineDark: "#262626",
  frameDark: "#171717",
};

const PIECE_PATHS: Record<string, string> = {
  p: "M50 12a14 14 0 1 1 0 28a14 14 0 0 1 0-28Z M36 46h28l-7 9 12 25H31l12-25Z M25 84h50v8H25Z",
  r: "M22 15h14v12h9V15h12v12h9V15h13v27H22Z M32 45h36v34H32Z M24 83h52v9H24Z",
  n: "M30 18q14-8 30-4t22 18q6 14 2 28l-12 16h16v10H28q-2-12 2-24l10-14q-8-6-10-16t0-14Zm18 10a4 4 0 1 0 8 0a4 4 0 1 0-8 0ZM24 86h52v8H24Z",
  b: "M50 14a10 10 0 1 1 0 20a10 10 0 0 1 0-20ZM36 42h28l-4 12h-20l-4-12ZM32 60h36l-4 18H36l-4-18ZM25 84h50v8H25Z",
  q: "M44 14a6 6 0 1 1 12 0a6 6 0 1 1-12 0Zm-24 16a6 6 0 1 1 12 0a6 6 0 1 1-12 0Zm48 0a6 6 0 1 1 12 0a6 6 0 1 1-12 0ZM28 42l10 14h24l10-14l6 24H22l6-24Zm8 28h28l6 14H30l6-14ZM24 86h52v8H24Z",
  k: "M45 5h10v12h12v10H55v10H45V27H33V17h12Z M25 40l8 16h34l8-16-13 4-12-7-12 7Z M36 60h28l7 20H29Z M23 84h54v8H23Z",
};

// Image caching
const imageCache = new Map<string, HTMLImageElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

function cleanHeading(str: string): string {
  return str
    .split("\n")
    .map((l) => l.trim().replace(/\.+$/, ""))
    .join("\n");
}

function iconDataUrl(name: IconName, color: string): string {
  const innerPath = ICON_PATHS[name] || ICON_PATHS.strategy;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="${color}">${innerPath}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface RenderOptions {
  showGuides?: boolean;
  flipped?: boolean;
}

/**
 * Draws the high-res marketing canvas onto the HTML5 canvas element.
 */
export async function renderCanvas(
  canvas: HTMLCanvasElement,
  template: CanvasTemplate,
  format: CanvasFormat = "square",
  options: RenderOptions = {}
): Promise<void> {
  const f = CANVAS_FORMATS[format] || CANVAS_FORMATS.square;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = f.width;
  canvas.height = f.height;

  const isInk = template.theme === "ink";
  const bg = isInk ? COLORS.ink : template.theme === "paper" ? COLORS.paper : COLORS.canvas;
  const fg = isInk ? COLORS.paper : COLORS.ink;
  const muted = isInk ? COLORS.mutedDark : COLORS.muted;
  const lineCol = isInk ? COLORS.lineDark : COLORS.line;

  // 1. Background fill
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, f.width, f.height);

  const safe = f.safe;
  const inset = 24;
  const x = safe.x + inset;
  const w = safe.width - 2 * inset;
  const top = safe.y + inset;
  const bottom = safe.y + safe.height - inset;

  // Geometry spec by format
  const isWide = format === "wide";
  const isPortrait = format === "portrait";
  const isStory = format === "story";

  const spec = isWide
    ? { brand: 84, head: 120, body: 32, headGap: 36, bodyGap: 20, cta: 84, ctaText: 32 }
    : isPortrait
    ? { brand: 88, head: 144, body: 36, headGap: 48, bodyGap: 24, cta: 92, ctaText: 36 }
    : isStory
    ? { brand: 96, head: 140, body: 36, headGap: 52, bodyGap: 26, cta: 96, ctaText: 38 }
    : { brand: 72, head: 114, body: 32, headGap: 40, bodyGap: 22, cta: 80, ctaText: 32 };

  // 2. Draw Logo Lockup
  try {
    const logoSrc = isInk ? "/brand/w3chess-logo-inverse.svg" : "/brand/w3chess-logo.svg";
    const logoImg = await loadImage(logoSrc);
    const logoAspect = 86.503 / 45;
    const logoW = spec.brand * logoAspect;
    ctx.drawImage(logoImg, x, top, logoW, spec.brand);
  } catch {
    // Fallback vector text brand
    ctx.font = `700 ${Math.round(spec.brand * 0.48)}px "Barlow Condensed", sans-serif`;
    ctx.fillStyle = fg;
    ctx.fillText("CHESS", x, top + spec.brand * 0.5);
    ctx.font = `500 ${Math.round(spec.brand * 0.22)}px "Onest", sans-serif`;
    ctx.fillText("Play-to-Earn", x, top + spec.brand * 0.85);
  }

  // 3. Draw Category / Tag Pill
  const tagText = cleanHeading(template.tag);
  ctx.font = '600 24px "Onest", sans-serif';
  const tagTextMetrics = ctx.measureText(tagText);
  const pillW = Math.min(w * 0.5, tagTextMetrics.width + 72);
  const pillH = 46;
  const pillX = x + w - pillW;
  const pillY = top + (spec.brand - pillH) / 2;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 10);
  ctx.fillStyle = COLORS.mint;
  ctx.fill();

  // Tag Icon
  try {
    const iconImg = await loadImage(iconDataUrl(template.icon, COLORS.ink));
    ctx.drawImage(iconImg, pillX + 14, pillY + (pillH - 24) / 2, 24, 24);
  } catch {
    // Ignored
  }

  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 22px "Onest", sans-serif';
  ctx.textBaseline = "middle";
  ctx.fillText(tagText, pillX + 46, pillY + pillH / 2 + 1);

  // 4. Headline (Barlow Condensed Bold)
  const headlineY = top + spec.brand + spec.headGap;
  const headLines = cleanHeading(template.headline).split("\n").slice(0, 2);
  const headFontSize = isWide ? spec.head : Math.min(spec.head, Math.floor(w / 7.5));
  ctx.font = `700 ${headFontSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.fillStyle = fg;
  ctx.textBaseline = "top";

  let curY = headlineY;
  const headStep = Math.round(headFontSize * 0.92);
  for (const line of headLines) {
    ctx.fillText(line, x, curY);
    curY += headStep;
  }

  // 5. Body / Subtitle (Onest)
  const bodyText = cleanHeading(template.body);
  ctx.font = `500 ${spec.body}px "Onest", sans-serif`;
  ctx.fillStyle = muted;
  curY += spec.bodyGap;
  ctx.fillText(bodyText, x, curY);
  curY += Math.round(spec.body * 1.3);

  // 6. Action Bar & Note (Bottom)
  const noteText = cleanHeading(template.note);
  const noteH = 24;
  const noteY = bottom - noteH;

  ctx.font = '500 20px "Onest", sans-serif';
  ctx.fillStyle = muted;
  ctx.textBaseline = "middle";
  ctx.fillText(noteText, x, noteY + noteH / 2);

  const actionH = spec.cta;
  const actionW = isWide ? Math.min(w * 0.55, 780) : w;
  const actionY = noteY - 18 - actionH;

  // Dual Action Panel Background
  ctx.beginPath();
  ctx.roundRect(x, actionY, actionW, actionH, 14);
  ctx.fillStyle = isInk ? COLORS.mint : COLORS.ink;
  ctx.fill();

  // Action Text
  ctx.fillStyle = isInk ? COLORS.ink : COLORS.paper;
  ctx.font = `600 ${spec.ctaText}px "Onest", sans-serif`;
  ctx.textBaseline = "middle";
  const ctaLabel = cleanHeading(template.cta);
  ctx.fillText(ctaLabel, x + 28, actionY + actionH / 2);

  // Action Mint Pill on the right
  const btnPillW = Math.min(270, Math.round(actionW * 0.36));
  const btnPillH = actionH - 20;
  const btnPillX = x + actionW - btnPillW - 10;
  const btnPillY = actionY + 10;

  ctx.beginPath();
  ctx.roundRect(btnPillX, btnPillY, btnPillW, btnPillH, 10);
  ctx.fillStyle = isInk ? COLORS.paper : COLORS.mint;
  ctx.fill();

  ctx.fillStyle = COLORS.ink;
  ctx.font = '600 22px "Onest", sans-serif';
  ctx.fillText("web3chess.online", btnPillX + 18, btnPillY + btnPillH / 2);

  // Arrow up-right
  try {
    const arrowImg = await loadImage(iconDataUrl("arrow-up-right", COLORS.ink));
    ctx.drawImage(arrowImg, btnPillX + btnPillW - 36, btnPillY + (btnPillH - 22) / 2, 22, 22);
  } catch {
    ctx.fillText("↗", btnPillX + btnPillW - 32, btnPillY + btnPillH / 2);
  }

  // 7. Middle Center Area (Visual & Proof)
  const visualTop = curY + 28;
  const visualBottom = actionY - 24;
  const visualH = Math.max(100, visualBottom - visualTop);

  if (isWide) {
    // Landscape composition
    const rx = x + Math.round(w * 0.58);
    const rw = w - Math.round(w * 0.58);

    if (template.art === "board") {
      const boardSize = Math.min(visualH + 80, rw);
      drawChessBoard(ctx, rx + (rw - boardSize) / 2, top + 10, boardSize, template.fen, options.flipped);
    } else {
      const artSize = Math.min(visualH + 120, rw);
      try {
        const artImg = await loadImage(`/illustrations/chess-${template.art}.webp`);
        ctx.drawImage(artImg, rx + (rw - artSize) / 2, top + 20, artSize, artSize);
      } catch {
        // Fallback
      }
    }

    // Proof list on left
    drawProofList(ctx, x, visualTop + 10, Math.round(w * 0.52), visualH, template, fg, lineCol);
  } else {
    // Vertical / Square / Story
    if (template.art === "board") {
      const boardSize = Math.min(visualH, Math.round(w * (isStory ? 0.6 : 0.48)));
      drawChessBoard(ctx, x, visualTop + (visualH - boardSize) / 2, boardSize, template.fen, options.flipped);

      const proofX = x + boardSize + 28;
      const proofW = w - boardSize - 28;
      drawProofList(ctx, proofX, visualTop + (visualH - boardSize) / 2, proofW, boardSize, template, fg, lineCol);
    } else {
      const artSize = Math.min(visualH, Math.round(w * (isStory ? 0.5 : 0.46)));
      const artX = x + w - artSize;
      const artY = visualTop + (visualH - artSize) / 2;

      try {
        const artImg = await loadImage(`/illustrations/chess-${template.art}.webp`);
        ctx.drawImage(artImg, artX, artY, artSize, artSize);
      } catch {
        // Ignored
      }

      const proofW = w - artSize - 24;
      drawProofList(ctx, x, visualTop + (visualH - Math.min(visualH, 300)) / 2, proofW, Math.min(visualH, 300), template, fg, lineCol);
    }
  }

  // 8. Safe Guides (Optional overlay)
  if (options.showGuides) {
    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
    ctx.strokeRect(safe.x, safe.y, safe.width, safe.height);
    ctx.font = '600 16px "Onest", sans-serif';
    ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
    ctx.fillText("SAFE AREA BOUNDARY", safe.x + 12, safe.y + 22);
    ctx.restore();
  }
}

/**
 * Draws the 3 single-line proof points with context-connected Phosphor icons.
 */
function drawProofList(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  template: CanvasTemplate,
  fg: string,
  lineCol: string
) {
  const count = template.proof.length;
  if (!count) return;

  const rowH = ph / count;
  const padding = 12;

  ctx.textBaseline = "middle";

  template.proof.forEach((rawText, i) => {
    const textStr = cleanHeading(rawText);
    const rowY = py + i * rowH;
    const iconName = template.proofIcons?.[i] || template.icon || "check";

    // Draw Icon
    loadImage(iconDataUrl(iconName, fg))
      .then((img) => {
        ctx.drawImage(img, px + padding, rowY + (rowH - 32) / 2, 32, 32);
      })
      .catch(() => {});

    // Draw Text
    ctx.font = '600 24px "Onest", sans-serif';
    ctx.fillStyle = fg;
    ctx.fillText(textStr, px + padding + 44, rowY + rowH / 2);

    // Separator line
    if (i < count - 1) {
      ctx.beginPath();
      ctx.moveTo(px + padding, rowY + rowH);
      ctx.lineTo(px + pw - padding, rowY + rowH);
      ctx.strokeStyle = lineCol;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

/**
 * Draws an authentic 8x8 chessboard with coordinates and pieces.
 */
function drawChessBoard(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  size: number,
  fen?: string,
  flipped: boolean = false
) {
  const pad = size * 0.075;
  const cell = (size - 2 * pad) / 8;

  // Board Frame
  ctx.beginPath();
  ctx.roundRect(bx, by, size, size, 20);
  ctx.fillStyle = COLORS.frameDark;
  ctx.fill();

  // Squares
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isDark = (r + c) % 2 === 1;
      ctx.fillStyle = isDark ? "#8A8A8A" : COLORS.paper;
      ctx.fillRect(bx + pad + c * cell, by + pad + r * cell, cell, cell);
    }
  }

  // Coordinates
  ctx.fillStyle = COLORS.paper;
  ctx.font = `600 ${Math.max(14, Math.round(size * 0.035))}px "Onest", monospace`;
  ctx.textBaseline = "middle";
  for (let i = 0; i < 8; i++) {
    const fileChar = flipped ? "hgfedcba"[i] : "abcdefgh"[i];
    const rankNum = flipped ? String(1 + i) : String(8 - i);
    ctx.fillText(fileChar, bx + pad + i * cell + cell * 0.38, by + size - pad * 0.45);
    ctx.fillText(rankNum, bx + pad * 0.28, by + pad + i * cell + cell * 0.5);
  }

  // Draw Pieces from FEN or default
  const defaultPieces: [string, string, boolean][] = [
    ["g8", "k", false],
    ["f7", "p", false],
    ["g7", "p", false],
    ["h7", "p", false],
    ["f2", "p", true],
    ["g2", "p", true],
    ["h2", "p", true],
    ["a1", "r", true],
    ["g1", "k", true],
  ];

  const pieceList = fen ? parseFenPieces(fen) : defaultPieces;

  for (const [sq, type, isWhite] of pieceList) {
    let file = sq.charCodeAt(0) - 97;
    let rank = 8 - parseInt(sq[1], 10);
    if (flipped) {
      file = 7 - file;
      rank = 7 - rank;
    }
    const piecePath = PIECE_PATHS[type.toLowerCase()];
    if (!piecePath) continue;

    ctx.save();
    ctx.translate(bx + pad + file * cell + cell * 0.06, by + pad + rank * cell + cell * 0.04);
    ctx.scale((cell * 0.88) / 100, (cell * 0.88) / 100);

    const p2d = new Path2D(piecePath);
    ctx.fillStyle = isWhite ? COLORS.paper : COLORS.ink;
    ctx.fill(p2d);
    ctx.strokeStyle = isWhite ? COLORS.ink : COLORS.paper;
    ctx.lineWidth = 2.5;
    ctx.stroke(p2d);
    ctx.restore();
  }
}

function parseFenPieces(fen: string): [string, string, boolean][] {
  const parts = fen.split(" ")[0].split("/");
  const res: [string, string, boolean][] = [];

  for (let r = 0; r < 8; r++) {
    const row = parts[r];
    let file = 0;
    for (const char of row) {
      if (char >= "1" && char <= "8") {
        file += parseInt(char, 10);
      } else {
        const sq = String.fromCharCode(97 + file) + (8 - r);
        const isWhite = char === char.toUpperCase();
        res.push([sq, char.toLowerCase(), isWhite]);
        file++;
      }
    }
  }
  return res;
}

/**
 * Generates valid standalone SVG XML for the template.
 */
export function generateSvg(template: CanvasTemplate, format: CanvasFormat = "square"): string {
  const f = CANVAS_FORMATS[format] || CANVAS_FORMATS.square;
  const isInk = template.theme === "ink";
  const bg = isInk ? COLORS.ink : template.theme === "paper" ? COLORS.paper : COLORS.canvas;
  const fg = isInk ? COLORS.paper : COLORS.ink;
  const muted = isInk ? COLORS.mutedDark : COLORS.muted;

  const headLines = cleanHeading(template.headline).split("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f.width} ${f.height}" width="${f.width}" height="${f.height}">
  <title>${template.name}</title>
  <rect width="${f.width}" height="${f.height}" fill="${bg}"/>
  <g id="brand">
    <text x="88" y="140" font-family="'Barlow Condensed', sans-serif" font-weight="700" font-size="44" fill="${fg}">CHESS</text>
    <text x="88" y="172" font-family="'Onest', sans-serif" font-weight="500" font-size="20" fill="${muted}">Play-to-Earn</text>
  </g>
  <g id="tag">
    <rect x="${f.width - 340}" y="100" width="250" height="46" rx="10" fill="${COLORS.mint}"/>
    <text x="${f.width - 215}" y="130" font-family="'Onest', sans-serif" font-weight="600" font-size="22" fill="#000000" text-anchor="middle">${cleanHeading(template.tag)}</text>
  </g>
  <g id="headline">
    ${headLines.map((line, i) => `<text x="88" y="${280 + i * 110}" font-family="'Barlow Condensed', sans-serif" font-weight="700" font-size="110" fill="${fg}">${line}</text>`).join("\n    ")}
  </g>
  <g id="body">
    <text x="88" y="${320 + headLines.length * 110}" font-family="'Onest', sans-serif" font-weight="500" font-size="32" fill="${muted}">${cleanHeading(template.body)}</text>
  </g>
  <g id="proof">
    ${template.proof.map((p, i) => `<text x="88" y="${580 + i * 60}" font-family="'Onest', sans-serif" font-weight="600" font-size="24" fill="${fg}">• ${cleanHeading(p)}</text>`).join("\n    ")}
  </g>
  <g id="action">
    <rect x="88" y="${f.height - 180}" width="${f.width - 176}" height="84" rx="14" fill="${isInk ? COLORS.mint : COLORS.ink}"/>
    <text x="120" y="${f.height - 128}" font-family="'Onest', sans-serif" font-weight="600" font-size="32" fill="${isInk ? COLORS.ink : COLORS.paper}">${cleanHeading(template.cta)}</text>
    <rect x="${f.width - 360}" y="${f.height - 170}" width="260" height="64" rx="10" fill="${isInk ? COLORS.paper : COLORS.mint}"/>
    <text x="${f.width - 230}" y="${f.height - 130}" font-family="'Onest', sans-serif" font-weight="600" font-size="22" fill="#000000" text-anchor="middle">web3chess.online ↗</text>
  </g>
  <g id="note">
    <text x="88" y="${f.height - 64}" font-family="'Onest', sans-serif" font-weight="500" font-size="20" fill="${muted}">${cleanHeading(template.note)}</text>
  </g>
</svg>`;
}

/**
 * Exports current canvas as high-resolution PNG file.
 */
export function exportCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".png") ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

/**
 * Copies clean bot content command to clipboard.
 */
export function getBotCommand(template: CanvasTemplate): string {
  const hookClean = cleanHeading(template.headline).replace(/\n/g, " ");
  return `/post kind=telegram category=${template.category} hook="${hookClean}" cta=${template.cta.toLowerCase().includes("arena") ? "arena" : template.cta.toLowerCase().includes("duel") ? "duel_friend" : "play"}`;
}
