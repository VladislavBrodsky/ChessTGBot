import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { BLOG_POSTS } from "@/content/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = BLOG_POSTS.map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),

    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: SITE.url, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE.url}/how-it-works`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${SITE.url}/wagers`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/academy`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/blog`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/fair-play`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/terms`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE.url}/privacy`, changeFrequency: "yearly", priority: 0.5 },
    ...posts,
  ];
}
