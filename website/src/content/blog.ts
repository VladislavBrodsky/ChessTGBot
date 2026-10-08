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
  publishedAt: string;
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
export const BLOG_POSTS: BlogPost[] = readdirSync(articleDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => JSON.parse(readFileSync(join(articleDirectory, file), "utf8")) as BlogPost)
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  const selected = BLOG_POSTS.filter((post) => post.slug !== slug && current?.relatedSlugs?.includes(post.slug));
  return selected.length ? selected.slice(0, 3) : BLOG_POSTS.filter((post) => post.slug !== slug).slice(0, 3);
}
