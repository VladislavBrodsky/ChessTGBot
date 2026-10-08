/**
 * Web3Chess website — Fog Board tokens for TypeScript (motion, board, layout).
 * Mirrors tokens.json. CSS values live in theme.css; import this only where JS
 * needs a value (framer-motion, canvas/SVG drawing, react-chessboard, tests).
 * Spec: design-system/website/DESIGN.md
 */

export const color = {
  carbonBlack: '#000000',
  paperWhite: '#ffffff',
  warmCanvas: '#e5e5e5',
  mistGray: '#f3f3f3',
  ash: '#c6c6c6',
  smoke: '#979797',
  slate: '#444444',
  graphite: '#2f2f2f',
  mintChip: '#d1ffca',
  voltageYellow: '#fff100',
  brandTile: '#211330',
  brandCrown: '#d6b6ff',
  brandInk: '#654599',

  // Semantic aliases
  ink: '#000000',
  royal: '#000000',
  steel: '#444444',
  hyacinth: '#c6c6c6',
  dusk: '#444444',
  silver: '#c6c6c6',
  mist: '#f3f3f3',
  fog: '#e5e5e5',
  paper: '#ffffff',
  white: '#ffffff',
  abyss: '#000000',
  night: '#000000',
  nightRaised: '#181818',
  signal: '#d1ffca',
  signalInk: '#000000',
  signalSoft: '#d1ffca',
  voltage: '#fff100',
  king: '#fff100',
  win: '#047857',
  winFill: '#10b981',
  winSoft: '#34d399',
  loss: '#be123c',
  lossFill: '#e11d48',
  lossSoft: '#fb7185',
  premium: '#6d28d9',
  premiumSoft: '#a78bfa',
  caution: '#92400e',
  cautionSoft: '#fbbf24',
} as const;

/** Values for `data-surface`. Each page: ≤1 ink, ≤1 night, ≤1 voltage, ≤1 signal. */
export const surfaces = ['canvas', 'ink', 'night', 'voltage', 'signal'] as const;
export type Surface = (typeof surfaces)[number];

/** Fog Board — chessboard theme for website widgets (Dayos brutalist monochrome palette). */
export const board = {
  squareLight: '#f3f3f3',
  squareDark: '#979797',
  coordinateOnLight: '#444444',
  coordinateOnDark: '#000000',
  lastMove: 'rgba(255, 241, 0, 0.75)',
  selected: 'rgba(209, 255, 202, 0.7)',
  moveHint: 'rgba(0, 0, 0, 0.25)',
  check: 'radial-gradient(circle, rgba(225, 29, 72, 0.6) 0%, rgba(225, 29, 72, 0) 70%)',
  pieceWhite: { fill: '#ffffff', stroke: '#000000' },
  pieceBlack: { fill: '#000000', stroke: '#2f2f2f' },
  frameRadiusPx: 32,
} as const;

type Bezier = [number, number, number, number];

export const motion = {
  duration: { instant: 0.075, fast: 0.1, base: 0.15, medium: 0.2, slow: 0.5, reveal: 0.64 },
  ease: {
    standard: [0.4, 0, 0.2, 1] as Bezier,
    pop: [0.06, 0.94, 0.67, 1.01] as Bezier,
    enter: [0.2, 0, 0, 1] as Bezier,
    exit: [0.4, 0, 1, 1] as Bezier,
  },
  spring: {
    /** Same physics as the Mini App (damping 25, stiffness 350) — toggles, segmented control thumb. */
    snappy: { type: 'spring', stiffness: 350, damping: 25 },
    /** Sheets, device mockups settling. */
    soft: { type: 'spring', stiffness: 170, damping: 26 },
  },
  reveal: { y: 16, stagger: 0.06 },
  /** Hover lift for interactive cards; never on static content. */
  lift: { y: -2 },
  /** Pawn Tittle: pop on load, tilt on hover. */
  tittle: { tilt: -12, hoverScale: 1.15 },
  /** Parallax ceiling for hero objects. */
  parallaxMaxPx: 12,
} as const;

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 } as const;

export const container = { prose: 640, content: 928, main: 1024, wide: 1200 } as const;

/** Shipped semantic type roles; mirrors theme.css and tokens.json. */
export const typography = {
  body: { fontSize: 16, lineHeight: 1.5 },
  bodySmall: { fontSize: 16, lineHeight: 1.45 },
  caption: { fontSize: 14, lineHeight: 1.45 },
  label: { fontSize: 14, lineHeight: 1.3 },
} as const;

export const z = {
  base: 0,
  raised: 10,
  sticky: 40,
  dock: 50,
  dropdown: 60,
  overlay: 100,
  modal: 110,
  toast: 140,
} as const;

/** Same locale set as the Mini App (frontend/src/app/page.tsx). */
export const locales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'] as const;
export type Locale = (typeof locales)[number];
export const rtlLocales: readonly Locale[] = ['ar'];
/** Scripts with no i/j tittle — Pawn Tittle falls back to the trailing pawn. */
export const tittleFallbackLocales: readonly Locale[] = ['ru', 'zh', 'hi', 'ar', 'ja'];

/** Sticky nav pill appears after this much scroll (hero height on desktop is ~560px). */
export const stickyNavThresholdPx = 480;
