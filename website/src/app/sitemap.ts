import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { BLOG_POSTS } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = BLOG_POSTS.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/play`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    ...posts,
  ];
}
