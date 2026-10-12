import { socialImage } from "@/components/SocialImage";

export const runtime = "nodejs";
export const alt = "Web3Chess — Play Chess Online: Telegram Bot & Web Arena";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return socialImage({
    art: "home",
    title: "Play Chess Online: Telegram Bot & Web Arena",
    eyebrow: "PLAY CHESS ONLINE",
    description:
      "Instant matchmaking inside Telegram. Free Stockfish A.I. practice and real USDT stakes.",
  });
}
