import type { IconName } from "@/icons";

export type CanvasFormat = "square" | "portrait" | "wide" | "story";

export type CanvasTheme = "canvas" | "paper" | "ink";

export type CanvasArtType =
  | "sculpture"
  | "clock"
  | "academy"
  | "stakes"
  | "fair-play"
  | "board";

export interface FormatSpec {
  id: CanvasFormat;
  label: string;
  width: number;
  height: number;
  aspect: string;
  use: string;
  safe: { x: number; y: number; width: number; height: number };
}

export interface CanvasTemplate {
  id: string;
  number: string;
  name: string;
  category: "Awareness" | "Tactics" | "Openings" | "Education" | "Speed" | "Wagers" | "Culture" | "Product" | "Arena" | "Manifesto";
  purpose: string;
  icon: IconName;
  art: CanvasArtType;
  tag: string;
  headline: string;
  alternate: string;
  body: string;
  cta: string;
  note: string;
  proof: [string, string, string];
  proofIcons: [IconName, IconName, IconName];
  theme: CanvasTheme;
  fen?: string;
  solution?: string[];
  revealText?: string;
  caption: string;
  destination: string;
  botCommand?: string;
}

export const CANVAS_FORMATS: Record<CanvasFormat, FormatSpec> = {
  square: {
    id: "square",
    label: "1:1 (Square)",
    width: 1080,
    height: 1080,
    aspect: "1/1",
    use: "Square feed posts & carousel cards",
    safe: { x: 64, y: 64, width: 952, height: 952 },
  },
  portrait: {
    id: "portrait",
    label: "4:5 (Portrait)",
    width: 1080,
    height: 1350,
    aspect: "4/5",
    use: "Portrait mobile feed & high-dwell posts",
    safe: { x: 64, y: 64, width: 952, height: 1222 },
  },
  wide: {
    id: "wide",
    label: "16:9 (Wide)",
    width: 1920,
    height: 1080,
    aspect: "16/9",
    use: "Landscape banners, X cards & YouTube thumbnails",
    safe: { x: 96, y: 72, width: 1728, height: 936 },
  },
  story: {
    id: "story",
    label: "9:16 (Story)",
    width: 1080,
    height: 1920,
    aspect: "9/16",
    use: "Telegram stories, Reels & vertical video covers",
    safe: { x: 72, y: 250, width: 936, height: 1320 },
  },
};
