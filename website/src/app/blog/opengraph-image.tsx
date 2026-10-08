import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "The Web3Chess journal — Moves worth reading.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "journal",
    title: "Moves worth reading.",
    eyebrow: "THE CHESS JOURNAL",
    description:
      "Opening ideas, tactical patterns, and a closer look at the game.",
  });
}
