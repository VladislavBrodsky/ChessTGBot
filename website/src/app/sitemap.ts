import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { getPublishedPosts } from "@/content/blog";

// Scheduled articles join the sitemap as soon as they go live.
export const revalidate = 600;

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getPublishedPosts().map((post) => ({
    url: `${SITE.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE.url}/play`, lastModified: new Date(), changeFrequency: "daily", priority: 0.95 },
    {
      url: `${SITE.url}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    { url: `${SITE.url}/wagers`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/academy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE.url}/fair-play`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE.url}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE.url}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...posts,
  ];
}
