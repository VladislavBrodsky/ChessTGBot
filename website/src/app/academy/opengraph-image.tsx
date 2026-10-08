import { socialImage } from "@/components/SocialImage";
export const runtime = "nodejs";
export const alt = "Web3Chess — See more. Play better.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return socialImage({
    art: "academy",
    title: "See more. Play better.",
    eyebrow: "THE CHESS ACADEMY",
    description:
      "Opening principles, tactical patterns, and free A.I. practice.",
  });
}
