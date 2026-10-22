import type { IconName } from "@/icons/generated";

export type CreativeFormat = "square" | "portrait" | "story" | "wide" | "custom";
export type CreativeTheme = "canvas" | "paper" | "ink";
export type ArtKind = "sculpture" | "academy" | "clock" | "stakes" | "fair-play" | "castling";

export interface ArtLayer {
  id: string;
  kind: ArtKind;
  /** Centre position and size as fractions of the canvas width/height. */
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface CreativeProject {
  version: 1;
  name: string;
  format: CreativeFormat;
  width: number;
  height: number;
  theme: CreativeTheme;
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  urlLabel: string;
  note: string;
  proofs: [string, string, string];
  proofIcons: [IconName, IconName, IconName];
  layers: ArtLayer[];
}

export const PROOF_ICONS: { id: IconName; label: string }[] = [
  { id: "target", label: "Target" },
  { id: "strategy", label: "Strategy" },
  { id: "book-open-text", label: "Book" },
  { id: "graduation-cap", label: "Academy" },
  { id: "lightning", label: "Speed" },
  { id: "clock", label: "Time" },
  { id: "coins", label: "Coins" },
  { id: "telegram-logo", label: "Telegram" },
  { id: "shield-check", label: "Fair play" },
  { id: "trophy", label: "Trophy" },
  { id: "users-three", label: "Community" },
];

export const FORMATS = [
  { id: "square", label: "Square", detail: "1:1", width: 1080, height: 1080 },
  { id: "portrait", label: "Portrait", detail: "4:5", width: 1080, height: 1350 },
  { id: "story", label: "Story", detail: "9:16", width: 1080, height: 1920 },
  { id: "wide", label: "Wide", detail: "16:9", width: 1920, height: 1080 },
] as const;

export const ART_LIBRARY: { kind: ArtKind; label: string; src: string }[] = [
  { kind: "sculpture", label: "Chess pieces", src: "/illustrations/chess-sculpture.webp" },
  { kind: "academy", label: "Academy book", src: "/illustrations/chess-academy.webp" },
  { kind: "clock", label: "Chess clock", src: "/illustrations/chess-clock.webp" },
  { kind: "stakes", label: "Balance scale", src: "/illustrations/chess-stakes.webp" },
  { kind: "fair-play", label: "Fair-play kings", src: "/illustrations/chess-fair-play.webp" },
  { kind: "castling", label: "King and rook", src: "/illustrations/chess-castling.webp" },
];

const base: CreativeProject = {
  version: 1,
  name: "Three-game threat drill",
  format: "square",
  width: 1080,
  height: 1080,
  theme: "canvas",
  tag: "Free practice",
  title: "ONE THREAT\nTHREE GAMES",
  subtitle: "Notice it · Test a reply · Review the move",
  cta: "Explore the Academy",
  urlLabel: "web3chess.online",
  note: "Free Coach practice · No stake needed",
  proofs: ["Name the threat", "Test two replies", "Review one move"],
  proofIcons: ["target", "strategy", "book-open-text"],
  layers: [{ id: "art-1", kind: "academy", x: 0.75, y: 0.56, size: 0.43, rotation: 0 }],
};

export const PRESETS: { id: string; label: string; project: CreativeProject }[] = [
  { id: "threat", label: "Three-game threat drill", project: base },
  {
    id: "castling",
    label: "Castling lesson",
    project: {
      ...base,
      name: "Castling lesson",
      tag: "Academy",
      title: "CAN YOU CASTLE\nIF YOUR ROOK IS HIT?",
      subtitle: "Check the king's route before you move",
      cta: "Read the lesson",
      note: "Chess rules · An original lesson",
      proofs: ["Check the king", "Check the route", "Check your rights"],
      proofIcons: ["target", "strategy", "shield-check"],
      layers: [{ id: "art-1", kind: "castling", x: 0.75, y: 0.56, size: 0.43, rotation: 0 }],
    },
  },
  {
    id: "telegram",
    label: "Play inside Telegram",
    project: {
      ...base,
      name: "Play inside Telegram",
      tag: "Your next move",
      title: "YOUR CHAT\nYOUR CHESS",
      subtitle: "Open the board from Telegram",
      cta: "See how it works",
      note: "No download needed",
      proofs: ["Open the Mini App", "Choose how to play", "Make your first move"],
      proofIcons: ["telegram-logo", "strategy", "lightning"],
      layers: [{ id: "art-1", kind: "sculpture", x: 0.75, y: 0.56, size: 0.43, rotation: 0 }],
    },
  },
];

export function copyProject(project: CreativeProject): CreativeProject {
  return {
    ...project,
    proofs: [...project.proofs] as CreativeProject["proofs"],
    proofIcons: [...project.proofIcons] as CreativeProject["proofIcons"],
    layers: project.layers.map((layer) => ({ ...layer })),
  };
}

export function parseProject(value: unknown): CreativeProject | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const formats: CreativeFormat[] = ["square", "portrait", "story", "wide", "custom"];
  const themes: CreativeTheme[] = ["canvas", "paper", "ink"];
  const kinds = ART_LIBRARY.map((item) => item.kind);
  const field = (key: string, max = 140) =>
    typeof raw[key] === "string" ? String(raw[key]).slice(0, max) : null;
  if (raw.version !== 1 || !formats.includes(raw.format as CreativeFormat) ||
      !themes.includes(raw.theme as CreativeTheme)) return null;
  const width = Number(raw.width);
  const height = Number(raw.height);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 ||
      height < 320 || width > 4096 || height > 4096 || width * height > 16_000_000) return null;
  const fixedFormat = FORMATS.find((item) => item.id === raw.format);
  if (fixedFormat && (fixedFormat.width !== width || fixedFormat.height !== height)) return null;
  if (!Array.isArray(raw.proofs) || raw.proofs.length !== 3 ||
      !raw.proofs.every((item) => typeof item === "string")) return null;
  const proofIcons = raw.proofIcons === undefined ? base.proofIcons : raw.proofIcons;
  if (!Array.isArray(proofIcons) || proofIcons.length !== 3 ||
      !proofIcons.every((item) => PROOF_ICONS.some((icon) => icon.id === item))) return null;
  if (!Array.isArray(raw.layers) || raw.layers.length > 8) return null;
  const layers: ArtLayer[] = [];
  const ids = new Set<string>();
  for (const item of raw.layers) {
    if (!item || typeof item !== "object") return null;
    const layer = item as Record<string, unknown>;
    if (typeof layer.id !== "string" || !layer.id || ids.has(layer.id) || !kinds.includes(layer.kind as ArtKind)) return null;
    ids.add(layer.id);
    const x = Number(layer.x), y = Number(layer.y), size = Number(layer.size), rotation = Number(layer.rotation);
    if (![x, y, size, rotation].every(Number.isFinite) || size < 0.08 || size > 0.8 ||
        x < 0 || x > 1 || y < 0 || y > 1 || rotation < -180 || rotation > 180) return null;
    layers.push({ id: layer.id.slice(0, 80), kind: layer.kind as ArtKind, x, y, size, rotation });
  }
  const name = field("name", 80), tag = field("tag", 50), title = field("title", 140);
  const subtitle = field("subtitle", 180), cta = field("cta", 70);
  const urlLabel = field("urlLabel", 60), note = field("note", 140);
  if ([name, tag, title, subtitle, cta, urlLabel, note].some((item) => item === null)) return null;
  return {
    version: 1,
    name: name!, format: raw.format as CreativeFormat, width, height,
    theme: raw.theme as CreativeTheme, tag: tag!, title: title!, subtitle: subtitle!,
    cta: cta!, urlLabel: urlLabel!, note: note!,
    proofs: raw.proofs.map((item: string) => item.slice(0, 80)) as CreativeProject["proofs"],
    proofIcons: proofIcons as CreativeProject["proofIcons"],
    layers,
  };
}
