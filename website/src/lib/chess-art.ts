/** Page-specific art and live captions; the render itself never contains text. */
export const chessArt = {
  home: {
    file: "chess-sculpture",
    alt: "An ivory knight, charcoal rook, and mint pawn on a sculpted chessboard",
    label: "Think ahead",
    notation: "01 / Your opening move",
    title: "A classic game. A new arena.",
    caption: "Your next opponent is a tap away.",
    icon: "strategy",
  },
  howItWorks: {
    file: "chess-clock",
    alt: "A twin-dial chess clock with mint buttons beside an ivory knight and charcoal pawn",
    label: "Find your rhythm",
    notation: "01 / Choose your pace",
    title: "Your clock. Your kind of game.",
    caption: "Bullet, blitz, or room to think.",
    icon: "clock",
  },
  academy: {
    file: "chess-academy",
    alt: "An open chess book with a mint pawn and an ivory knight raised on two steps",
    label: "Build your board vision",
    notation: "01 / Learn · Practise · Play",
    title: "Small lessons. Stronger ideas.",
    caption: "A little practice goes a long way.",
    icon: "graduation-cap",
  },
  wagers: {
    file: "chess-stakes",
    alt: "A level balance scale holding equal-size ivory and charcoal chess pawns",
    label: "Equal stakes",
    notation: "01 / Know the numbers",
    title: "Two players. The same stake.",
    caption: "Clear rules before the first move.",
    icon: "scales",
  },
  fairPlay: {
    file: "chess-fair-play",
    alt: "Equal-height ivory and charcoal chess kings in front of a pale mint shield",
    label: "Respect the board",
    notation: "01 / Shared rules",
    title: "Good chess starts with fair play.",
    caption: "Your moves must be your own.",
    icon: "shield-check",
  },
  journal: {
    file: "chess-academy",
    alt: "A sculpted open chess book supporting a mint pawn and an ivory knight",
    label: "Read the position",
    notation: "01 / A fresh perspective",
    title: "A good idea stays with you.",
    caption: "Read it here. Try it on the board.",
    icon: "book-open-text",
  },
} as const;

export type ChessArtVariant = keyof typeof chessArt;

export function articleArt(slug: string, category: string): ChessArtVariant {
  if (slug.includes("fair-play")) return "fairPlay";
  if (slug.includes("wager") || slug.includes("stake")) return "wagers";
  if (category === "Product") return "howItWorks";
  if (category === "Strategy") return "home";
  return "journal";
}
