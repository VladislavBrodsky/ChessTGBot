import { socialImage } from "@/components/SocialImage";

export const runtime = "nodejs";
export const alt = "Web3Chess — Marketing Canvas & Templates Library";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return socialImage({
    art: "home",
    title: "Canvas & Templates Studio",
    eyebrow: "MARKETING DESIGN STUDIO",
    description:
      "Edit, customize, and export high-conversion marketing graphics for Telegram and social channels.",
  });
}
