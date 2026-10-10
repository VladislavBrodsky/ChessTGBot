import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess terms of service.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    title: "Terms",
    eyebrow: "WEB3CHESS",
    description: "The rules for using Web3Chess, including adult-only USDT matches.",
  });
}
