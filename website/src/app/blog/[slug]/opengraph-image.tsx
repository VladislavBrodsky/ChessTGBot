import { socialImage } from "@/components/SocialImage";
import { getBlogPostBySlug, BLOG_POSTS } from "@/content/blog";
import { articleArt } from "@/lib/chess-art";
export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "The Web3Chess chess journal";
export function generateStaticParams() {
  return BLOG_POSTS.map(({ slug }) => ({ slug }));
}
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  return socialImage({
    art: articleArt(slug, post?.category ?? "Academy"),
    title: post?.title ?? "Moves worth reading.",
    eyebrow: post?.category ?? "THE CHESS JOURNAL",
    description:
      "Opening ideas, tactical patterns, and the thinking behind Web3Chess.",
  });
}
