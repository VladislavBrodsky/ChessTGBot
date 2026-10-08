import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess — Your stake. The full picture.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "wagers",
    title: "Your stake. The full picture.",
    eyebrow: "STAKES & SETTLEMENT",
    description:
      "Equal stakes, clear match math, and a balance you can follow. Wagers: 18+. You can lose your stake.",
  });
}
