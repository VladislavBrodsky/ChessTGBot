/**
 * Single source of truth for facts the marketing site states.
 * Anything that can change in the product is an env var with a documented default.
 */

/** Canonical bot. Backend default: backend/app/core/config.py TELEGRAM_BOT_USERNAME. */
export const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "chess_matbot";

/**
 * Mini App deep link.
 * `startapp` values the app understands (frontend/src/app/[locale]/home/page.tsx):
 *   - omitted      → opens home
 *   - "arena"      → opens matchmaking
 *   - "ref_<code>" → referral
 *   - "mk_<card-id>_<channel>_<target>" → marketing deep link; routes to the
 *     target (arena | academy | challenges | wallet) and logs telemetry. Needs a
 *     card id reserved from backend/app/services/marketing/ — do not invent one.
 * ANY other value is treated as a game id and sends the player to a game that
 * does not exist. Do not add campaign parameters here.
 */
export function telegramLink(startapp?: "arena"): string {
  const base = `https://t.me/${BOT_USERNAME}/app`;
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

export const SITE = {
  name: "Web3Chess",
  /** Set NEXT_PUBLIC_SITE_URL once the final domain is decided. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://web3chess.online",
  description:
    "Real-time chess inside Telegram. Play rated games for free, or stake USDT against players at your level.",
  telegramChannel: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL ?? "https://t.me/chess_hub",
  telegramChat: process.env.NEXT_PUBLIC_TELEGRAM_CHAT ?? "https://t.me/chesshub_chat",
} as const;

export const TIME_CONTROLS = ["1+0", "3+2", "5+0", "10+0"] as const;
export const WAGER_TIERS = [1, 5, 10, 25] as const;
