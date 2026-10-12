import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess Rules — Chess Rules for Beginners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "academy",
    title: "Chess Rules for Beginners",
    eyebrow: "STEP-BY-STEP GUIDE",
    description:
      "Learn piece moves, castling, en passant, checkmate, stalemate, and chess clocks.",
  });
}
