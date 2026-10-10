import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { BlogCategory } from "./blog-taxonomy";

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: BlogCategory;
  author: {
    name: string;
    role: string;
    avatar: string;
    kind?: "Person" | "Organization";
  };
  /** Calendar date (YYYY-MM-DD, UTC). A future date keeps the article hidden until that day. */
  publishedAt: string;
  /** Optional UTC instant (ISO 8601) to stagger several articles across one day. */
  publishAt?: string;
  updatedAt?: string;
  readingTime: string;
  featured?: boolean;
  coverImage?: string;
  takeaways: string[];
  content: {
    type:
      | "paragraph"
      | "heading"
      | "subheading"
      | "quote"
      | "callout"
      | "chess_position"
      | "list";
    text?: string;
    items?: string[];
    fen?: string;
    moves?: string[];
    initialFen?: string;
    caption?: string;
    highlight?: boolean;
  }[];
  relatedSlugs?: string[];
  metaDescription?: string;
  sources?: { title: string; url: string }[];
  cta?: { label: string; href: string };
}


const articleDirectory = join(process.cwd(), "src/content/articles");
const ALL_POSTS: BlogPost[] = readdirSync(articleDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(articleDirectory, file), "utf8")) as BlogPost)
  .sort((a, b) => liveInstant(b) - liveInstant(a) || b.publishedAt.localeCompare(a.publishedAt));

/** The instant an article goes live: `publishAt` if present, otherwise 00:00 UTC on `publishedAt`. */
function liveInstant(post: BlogPost): number {
  return Date.parse(post.publishAt ?? `${post.publishedAt}T00:00:00Z`);
}

export function isLive(post: BlogPost, now: Date = new Date()): boolean {
  return liveInstant(post) <= now.getTime();
}

/**
 * Articles visible to readers right now. Always call this at render time (pages revalidate
 * every few minutes) instead of caching the result in a module constant, so scheduled
 * articles appear on time without a redeploy.
 */
export function getPublishedPosts(now: Date = new Date()): BlogPost[] {
  return ALL_POSTS.filter((post) => isLive(post, now));
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getPublishedPosts().find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string): BlogPost[] {
  const published = getPublishedPosts();
  const current = published.find((post) => post.slug === slug);
  const selected = published.filter((post) => post.slug !== slug && current?.relatedSlugs?.includes(post.slug));
  return selected.length ? selected.slice(0, 3) : published.filter((post) => post.slug !== slug).slice(0, 3);
}
