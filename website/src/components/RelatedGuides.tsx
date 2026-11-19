import Link from "next/link";
import { BlogCard } from "@/components/BlogCard";
import { Eyebrow } from "@/components/ui/Badge";
import { getBlogPostBySlug } from "@/content/blog";
import { Icon } from "@/icons";

/**
 * Hand-picked articles at the foot of an indexed product page. Google had found every
 * article from the sitemap but crawled none (Search Console, Nov 2026); links from pages
 * it already indexes are what raise their crawl priority. Unpublished or removed slugs
 * are skipped, so a list can never render a dead link.
 */
export function RelatedGuides({
  slugs,
  heading = "Related guides",
  id = "related-guides",
  className,
}: {
  slugs: readonly string[];
  heading?: string;
  id?: string;
  /** Only for pages whose <main> has no section spacing of its own (e.g. /play). */
  className?: string;
}) {
  const posts = slugs.map((slug) => getBlogPostBySlug(slug)).filter((post) => post !== undefined);
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby={`${id}-heading`} className={className}>
      <Eyebrow>From the blog</Eyebrow>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h2 id={`${id}-heading`} className="editorial-title">
          {heading}
        </h2>
        <Link href="/blog" className="link-inline inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold">
          All guides
          <Icon name="arrow-right" size={14} />
        </Link>
      </div>
      <div className="home-story-grid grid gap-4">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
