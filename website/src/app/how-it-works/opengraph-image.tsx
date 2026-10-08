import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess — One tap. Your next rival.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "howItWorks",
    title: "One tap. Your next rival.",
    eyebrow: "HOW IT WORKS",
    description:
      "Choose your pace. Find your match. Play right inside Telegram.",
  });
}
