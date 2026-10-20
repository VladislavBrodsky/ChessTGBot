/**
 * Single source of truth for facts the marketing site states.
 * Anything that can change in the product is an env var with a documented default.
 */

/** Canonical bot. Backend default: backend/app/core/config.py TELEGRAM_BOT_USERNAME.
 *  A leading "@" is stripped: `t.me/@bot/...` is not a valid Telegram link. */
export const BOT_USERNAME = (
  process.env.NEXT_PUBLIC_BOT_USERNAME || "chess_matbot"
)
  .trim()
  .replace(/^@+/, "");

/**
 * Mini App deep link.
 * `startapp` values the app understands (frontend/src/app/[locale]/home/page.tsx):
 *   - omitted      → opens home
 *   - "arena"      → opens matchmaking
 *   - "ref_<code>" → referral
 *   - "mk_<source>" → first-touch marketing source for newly registered
 *     players. The backend routes the website's play/academy codes directly;
 *     other marketing codes open Home.
 * ANY other value is treated as a game id and sends the player to a game that
 * does not exist. Do not add campaign parameters here.
 */
export const WEBSITE_CAMPAIGNS = {
  home: "mk_web_home",
  play: "mk_web_play_arena",
  academy: "mk_web_academy",
  rules: "mk_web_rules",
  howItWorks: "mk_web_how",
  wagers: "mk_web_wagers",
  fairPlay: "mk_web_fairplay",
  navigation: "mk_web_nav",
  footer: "mk_web_footer",
  mobile: "mk_web_mobile",
  qr: "mk_web_qr",
  other: "mk_web_other",
} as const;

export type WebsiteLaunchParameter =
  | "arena"
  | (typeof WEBSITE_CAMPAIGNS)[keyof typeof WEBSITE_CAMPAIGNS];

/** Fixed, aggregate source buckets. No visitor IDs or arbitrary URL data. */
export function campaignForCta(location: string): WebsiteLaunchParameter {
  if (location.startsWith("academy") || location === "puzzle_solved_banner") return WEBSITE_CAMPAIGNS.academy;
  if (location.startsWith("rules")) return WEBSITE_CAMPAIGNS.rules;
  if (location.startsWith("how_it_works")) return WEBSITE_CAMPAIGNS.howItWorks;
  if (location.startsWith("wagers")) return WEBSITE_CAMPAIGNS.wagers;
  if (location.startsWith("fair_play")) return WEBSITE_CAMPAIGNS.fairPlay;
  if (location.startsWith("nav_")) return WEBSITE_CAMPAIGNS.navigation;
  if (location.startsWith("footer_")) return WEBSITE_CAMPAIGNS.footer;
  if (location === "sticky_mobile_dock") return WEBSITE_CAMPAIGNS.mobile;
  if (["hero", "final_banner", "facts_banner", "infrastructure"].includes(location)) return WEBSITE_CAMPAIGNS.home;
  return WEBSITE_CAMPAIGNS.other;
}

export function telegramLink(startapp?: WebsiteLaunchParameter): string {
  const base = `https://t.me/${BOT_USERNAME}/Web3Chess`;
  return startapp ? `${base}?startapp=${startapp}` : base;
}

/**
 * Wager settlement, from backend/app/services/settlement.py
 * (locked by backend/app/tests/test_settlement.py).
 * Pot = 2 x stake. Winner takes 95%: 3% platform fee + 2% referral fee.
 */
export const SETTLEMENT = {
  winnerPercent: 95,
  platformFeePercent: 3,
  referralFeePercent: 2,
} as const;

export function winnerReceives(stake: number): number {
  return (stake * 2 * SETTLEMENT.winnerPercent) / 100;
}

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-JXR1D3D5E3";

export const SITE = {
  name: "Web3Chess",
  /** Set NEXT_PUBLIC_SITE_URL once the final domain is decided. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://web3chess.online",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.web3chess.online",
  gaMeasurementId: GA_MEASUREMENT_ID,
  description:
    "Play chess in Telegram. Practice free against A.I., explore the Academy, and challenge opponents in USDT matches with clear stakes and rules.",
  telegramChannel:
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL ?? "https://t.me/chess_hub",
  telegramChat:
    process.env.NEXT_PUBLIC_TELEGRAM_CHAT ?? "https://t.me/chesshub_chat",
} as const;

/**
 * Player-match rules, verified 2026-10-16.
 * Clock lengths: frontend/src/components/game/lobby/BetSlip.tsx TIME_CONTROLS (flat, no increment).
 * First move: backend/app/services/game_service.py monitor_first_move_abort (30s per side, then the
 * match is aborted and refunded); players matched while the app was closed get
 * OFFLINE_FIRST_MOVE_GRACE_SECONDS in backend/app/socket_events.py.
 * In game_service.py a draw refunds both stakes and a flagged clock always loses.
 */
export const MATCH_RULES = {
  clockMinutes: [1, 3, 5, 10, 15, 30, 60],
  minStakeUsdt: 1,
  firstMoveSeconds: 30,
  offlineFirstMoveMinutes: 3,
} as const;
export const WAGER_TIERS = [1, 5, 10, 25] as const;
