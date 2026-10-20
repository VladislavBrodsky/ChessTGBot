import { socialImage } from "@/components/SocialImage";
import { getBlogPostBySlug, getPublishedPosts } from "@/content/blog";
import { articleArt } from "@/lib/chess-art";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Web3Chess chess journal";
export function generateStaticParams() {
  return getPublishedPosts().map(({ slug }) => ({ slug }));
}
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (slug === "free-ai-chess-practice-three-game-threat-drill") {
    const png = await readFile(join(process.cwd(), "public/blog/three-game-threat-drill-social.png"));
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
  }
  return socialImage({
    art: articleArt(slug, post?.category ?? "Academy"),
    title: post?.title ?? "Moves worth reading.",
    eyebrow: post?.category ?? "THE CHESS JOURNAL",
    description: post?.subtitle ??
      "Opening ideas, tactical patterns, and the thinking behind Web3Chess.",
  });
}
