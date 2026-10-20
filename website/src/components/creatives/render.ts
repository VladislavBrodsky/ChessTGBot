import { ICON_PATHS, type IconName } from "@/icons/generated";
import { ART_LIBRARY, type ArtLayer, type CreativeProject } from "./model";

const palette = {
  canvas: "#E5E5E5",
  paper: "#FFFFFF",
  ink: "#0A0A0A",
  mint: "#D1FFCA",
  muted: "#444444",
  mutedOnInk: "#C6C6C6",
  line: "#C9C9C9",
};

const imageCache = new Map<string, Promise<HTMLImageElement>>();

function image(src: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(src);
  if (cached) return cached;
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error(`Could not load ${src}`));
    element.src = src;
  });
  imageCache.set(src, promise);
  promise.catch(() => imageCache.delete(src));
  return promise;
}

function iconImage(name: IconName, color: string): Promise<HTMLImageElement> {
  const path = ICON_PATHS[name];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="${color}">${path}</svg>`;
  return image(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
}

function cleanLabel(value: string): string {
  return value.trim().replace(/[.\s]+$/, "");
}

function fitSingleLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, initial: number, min: number, family: string, weight = 500) {
  let size = initial;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  } while (size >= min);
  return min;
}

function wrapTitle(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, initialSize: number, minSize: number) {
  const source = cleanLabel(text).split("\n").flatMap((line) => line.trim() ? [line.trim()] : []);
  for (let fontSize = initialSize; fontSize >= minSize; fontSize -= 2) {
    ctx.font = `700 ${fontSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
    const lines: string[] = [];
    for (const sourceLine of source) {
      let current = "";
      for (const word of sourceLine.split(/\s+/)) {
        const next = current ? `${current} ${word}` : word;
        if (current && ctx.measureText(next).width > maxWidth) {
          lines.push(current);
          current = word;
        } else current = next;
      }
      if (current) lines.push(current);
    }
    if (lines.length <= 3 && lines.every((line) => ctx.measureText(line).width <= maxWidth)) {
      return { lines, fontSize, overflow: false };
    }
  }
  ctx.font = `700 ${minSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  const lines = source.slice(0, 3);
  return { lines, fontSize: minSize, overflow: true };
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function artBounds(project: CreativeProject, layer: ArtLayer) {
  const size = layer.size * project.width;
  return { x: layer.x * project.width - size / 2, y: layer.y * project.height - size / 2, size };
}

export interface RenderResult {
  canvas: HTMLCanvasElement;
  warnings: string[];
}

/** Renders one exact-size output. Preview decorations are opt-in and never exported. */
export async function renderProject(project: CreativeProject, options: { guides?: boolean; selectedId?: string } = {}): Promise<RenderResult> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = project.width;
  canvas.height = project.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser");
  const { width: w, height: h } = project;
  const unit = Math.min(w / 1080, h / 1080);
  const isWide = w / h > 1.35;
  const isStory = h / w > 1.5;
  const ink = project.theme === "ink";
  const fg = ink ? palette.paper : palette.ink;
  const muted = ink ? palette.mutedOnInk : palette.muted;
  const bg = palette[project.theme];
  const padX = w * (isWide ? 0.055 : 0.07);
  const padTop = h * (isStory ? 0.13 : isWide ? 0.085 : 0.065);
  const padBottom = h * (isStory ? 0.12 : 0.07);
  const safeWidth = w - 2 * padX;
  const warnings: string[] = [];

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Use the shipped vector wordmark rather than recreating the letterforms.
  try {
    const logo = await image("/brand/w3chess-logo.svg");
    ctx.save();
    if (ink) ctx.filter = "invert(1)";
    ctx.drawImage(logo, padX, padTop, 150 * unit, 78 * unit);
    ctx.restore();
  } catch {
    warnings.push("Brand mark could not load");
  }

  const tag = cleanLabel(project.tag);
  if (tag) {
    const tagSize = fitSingleLine(ctx, tag, safeWidth * 0.34 - 34 * unit, 22 * unit, 14 * unit, '"Onest", sans-serif', 600);
    const tagWidth = Math.min(safeWidth * 0.38, ctx.measureText(tag).width + 40 * unit);
    const tagX = padX + safeWidth - tagWidth;
    roundRect(ctx, tagX, padTop + 7 * unit, tagWidth, 43 * unit, 10 * unit, palette.mint);
    ctx.fillStyle = palette.ink;
    ctx.textBaseline = "middle";
    ctx.font = `600 ${tagSize}px "Onest", sans-serif`;
    ctx.fillText(tag, tagX + 19 * unit, padTop + 29 * unit, tagWidth - 35 * unit);
  }

  const titleWidth = isWide ? safeWidth * 0.57 : safeWidth;
  const titleY = padTop + 120 * unit;
  const title = wrapTitle(ctx, project.title.toUpperCase(), titleWidth, (isStory ? 124 : 112) * unit, 56 * unit);
  if (title.overflow) warnings.push("Headline is too long for this size. Shorten it before export.");
  ctx.fillStyle = fg;
  ctx.font = `700 ${title.fontSize}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  ctx.textBaseline = "top";
  const lineHeight = title.fontSize * 0.91;
  title.lines.forEach((line, index) => ctx.fillText(line, padX, titleY + index * lineHeight, titleWidth));

  const subtitleY = titleY + title.lines.length * lineHeight + 22 * unit;
  const subtitle = cleanLabel(project.subtitle);
  const subtitleSize = fitSingleLine(ctx, subtitle, titleWidth, 30 * unit, 19 * unit, '"Onest", sans-serif', 500);
  ctx.fillStyle = muted;
  ctx.font = `500 ${subtitleSize}px "Onest", sans-serif`;
  ctx.fillText(subtitle, padX, subtitleY, titleWidth);
  if (ctx.measureText(subtitle).width > titleWidth) warnings.push("Subtitle is too long for this size. Shorten it before export.");

  // Draw artwork after text so selected objects remain tactile in the editor.
  for (const layer of project.layers) {
    const asset = ART_LIBRARY.find((item) => item.kind === layer.kind);
    if (!asset) continue;
    try {
      const art = await image(asset.src);
      const { size } = artBounds(project, layer);
      ctx.save();
      ctx.translate(layer.x * w, layer.y * h);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.drawImage(art, -size / 2, -size / 2, size, size);
      if (options.selectedId === layer.id) {
        ctx.setLineDash([10 * unit, 8 * unit]);
        ctx.strokeStyle = ink ? palette.mint : palette.ink;
        ctx.lineWidth = 2 * unit;
        ctx.strokeRect(-size / 2, -size / 2, size, size);
      }
      ctx.restore();
    } catch {
      warnings.push(`${asset.label} artwork could not load`);
    }
  }

  const proofY = isWide ? h * 0.58 : isStory ? h * 0.67 : h * 0.61;
  const proofWidth = isWide ? safeWidth * 0.52 : safeWidth * 0.47;
  const proofStep = (isStory ? 58 : 52) * unit;
  for (let index = 0; index < 3; index++) {
    const line = cleanLabel(project.proofs[index]);
    if (!line) continue;
    const rowY = proofY + index * proofStep;
    try {
      const icon = await iconImage(project.proofIcons[index], fg);
      ctx.drawImage(icon, padX, rowY + 3 * unit, 27 * unit, 27 * unit);
    } catch { /* The text remains readable if an icon fails. */ }
    const available = proofWidth - 43 * unit;
    const size = fitSingleLine(ctx, line, available, 23 * unit, 15 * unit, '"Onest", sans-serif', 600);
    ctx.fillStyle = fg;
    ctx.textBaseline = "top";
    ctx.font = `600 ${size}px "Onest", sans-serif`;
    ctx.fillText(line, padX + 42 * unit, rowY, available);
    if (ctx.measureText(line).width > available) warnings.push(`Proof ${index + 1} is too long for this size.`);
    if (index < 2) {
      ctx.fillStyle = ink ? palette.muted : palette.line;
      ctx.fillRect(padX, rowY + proofStep - 8 * unit, proofWidth, unit);
    }
  }

  const actionHeight = 78 * unit;
  const actionY = h - padBottom - 118 * unit;
  const actionWidth = isWide ? safeWidth * 0.58 : safeWidth;
  roundRect(ctx, padX, actionY, actionWidth, actionHeight, 14 * unit, ink ? palette.mint : palette.ink);
  const pillWidth = Math.min(actionWidth * 0.37, 270 * unit);
  const pillX = padX + actionWidth - pillWidth - 10 * unit;
  roundRect(ctx, pillX, actionY + 9 * unit, pillWidth, actionHeight - 18 * unit, 9 * unit, ink ? palette.paper : palette.mint);
  const cta = cleanLabel(project.cta);
  const ctaSize = fitSingleLine(ctx, cta, actionWidth - pillWidth - 47 * unit, 29 * unit, 17 * unit, '"Onest", sans-serif', 600);
  ctx.fillStyle = ink ? palette.ink : palette.paper;
  ctx.textBaseline = "middle";
  ctx.font = `600 ${ctaSize}px "Onest", sans-serif`;
  ctx.fillText(cta, padX + 23 * unit, actionY + actionHeight / 2, actionWidth - pillWidth - 47 * unit);
  if (ctx.measureText(cta).width > actionWidth - pillWidth - 47 * unit) warnings.push("Action label is too long for this size.");
  const url = cleanLabel(project.urlLabel);
  const urlWidth = pillWidth - 49 * unit;
  const urlSize = fitSingleLine(ctx, url, urlWidth, 20 * unit, 13 * unit, '"Onest", sans-serif', 600);
  ctx.fillStyle = palette.ink;
  ctx.font = `600 ${urlSize}px "Onest", sans-serif`;
  ctx.fillText(url, pillX + 12 * unit, actionY + actionHeight / 2, urlWidth);
  if (ctx.measureText(url).width > urlWidth) warnings.push("URL label is too long for this size.");
  try {
    const arrow = await iconImage("arrow-up-right", palette.ink);
    ctx.drawImage(arrow, pillX + pillWidth - 34 * unit, actionY + 25 * unit, 25 * unit, 25 * unit);
  } catch { /* The URL remains visible if the icon cannot load. */ }

  const note = cleanLabel(project.note);
  const noteSize = fitSingleLine(ctx, note, actionWidth, 18 * unit, 13 * unit, '"Onest", sans-serif', 500);
  ctx.fillStyle = muted;
  ctx.font = `500 ${noteSize}px "Onest", sans-serif`;
  ctx.fillText(note, padX, actionY + actionHeight + 19 * unit, actionWidth);
  if (ctx.measureText(note).width > actionWidth) warnings.push("Footer note is too long for this size.");

  if (options.guides) {
    ctx.save();
    ctx.strokeStyle = ink ? palette.mint : palette.ink;
    ctx.lineWidth = 2 * unit;
    ctx.setLineDash([10 * unit, 8 * unit]);
    ctx.strokeRect(padX, padTop, safeWidth, h - padTop - padBottom);
    ctx.restore();
  }
  return { canvas, warnings };
}

export async function downloadPng(project: CreativeProject) {
  const result = await renderProject(project);
  if (result.warnings.length) throw new Error(result.warnings[0]);
  const blob = await new Promise<Blob | null>((resolve) => result.canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  downloadBlob(blob, `${fileStem(project)}-${project.width}x${project.height}.png`);
}

export function fileStem(project: CreativeProject) {
  return (project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "web3chess-creative").slice(0, 48);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
