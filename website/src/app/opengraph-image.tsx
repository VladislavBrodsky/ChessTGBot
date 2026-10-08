import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess — Skill is the only edge.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    title: "Skill is the only edge.",
    eyebrow: "CHESS IN TELEGRAM",
    description:
      "Train for free. Find your next rival. Make your next move count.",
  });
}
