/**
 * Web3Chess website — Fog Board tokens for TypeScript (motion, board, layout).
 * Mirrors tokens.json. CSS values live in theme.css; import this only where JS
 * needs a value (framer-motion, canvas/SVG drawing, react-chessboard, tests).
 * Spec: design-system/website/DESIGN.md
 */

export const color = {
  ink: '#20294C',
  royal: '#0A2D67',
  steel: '#375390',
  hyacinth: '#788DBA',
  dusk: '#676B89',
  smoke: '#979DB5',
  silver: '#C7CBDB',
  mist: '#DDDFE9',
  fog: '#F0F1F5',
  paper: '#FAFAFA',
  white: '#FFFFFF',
  abyss: '#042939',
  night: '#071A22',
  nightRaised: '#103645',
  signal: '#459AF8',
  signalInk: '#1A63BF',
  signalSoft: '#7DB8FA',
  voltage: '#FFFF00',
  king: '#FFD700',
  win: '#047857',
  winFill: '#10B981',
  winSoft: '#34D399',
  loss: '#BE123C',
  lossFill: '#E11D48',
  lossSoft: '#FB7185',
  premium: '#6D28D9',
  premiumSoft: '#A78BFA',
  caution: '#92400E',
  cautionSoft: '#FBBF24',
} as const;

/** Values for `data-surface`. Each page: ≤1 ink, ≤1 night, ≤1 voltage, ≤1 signal. */
export const surfaces = ['canvas', 'ink', 'night', 'voltage', 'signal'] as const;
export type Surface = (typeof surfaces)[number];

/** Fog Board — chessboard theme for website widgets. */
export const board = {
  squareLight: color.mist,
  squareDark: color.hyacinth,
  coordinateOnLight: color.royal,
  coordinateOnDark: color.white,
  lastMove: 'rgba(255, 255, 0, 0.45)',
  selected: 'rgba(69, 154, 248, 0.35)',
  moveHint: 'rgba(32, 41, 76, 0.22)',
  check: 'radial-gradient(circle, rgba(225, 29, 72, 0.6) 0%, rgba(225, 29, 72, 0) 70%)',
  pieceWhite: { fill: color.white, stroke: color.ink },
  pieceBlack: { fill: color.ink, stroke: color.fog },
  frameRadiusPx: 12,
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
