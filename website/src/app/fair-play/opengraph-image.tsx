import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess fair play — Your mind. Your moves.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "fairPlay",
    title: "Your mind. Your moves.",
    eyebrow: "RESPECT THE BOARD",
    description:
      "Clear match rules and a fair play approach you can understand.",
  });
}
