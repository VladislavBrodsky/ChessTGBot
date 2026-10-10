import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess privacy — how we handle your data.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    title: "Privacy",
    eyebrow: "WEB3CHESS",
    description: "How Web3Chess handles data, Telegram sign-in and wallet routing.",
  });
}
