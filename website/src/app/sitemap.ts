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

  // Only article dates are known from editorial data. A build or sitemap fetch
  // does not mean the main content of a static route changed.
  return [
    { url: SITE.url, priority: 1.0 },
    { url: `${SITE.url}/play`, priority: 0.95 },
    {
      url: `${SITE.url}/how-it-works`,
      priority: 0.9,
    },
    { url: `${SITE.url}/wagers`, priority: 0.9 },
    { url: `${SITE.url}/academy`, priority: 0.9 },
    { url: `${SITE.url}/blog`, priority: 0.9 },
    { url: `${SITE.url}/CREATIVES`, priority: 0.6 },
    { url: `${SITE.url}/fair-play`, priority: 0.85 },
    { url: `${SITE.url}/rules`, priority: 0.85 },
    { url: `${SITE.url}/terms`, priority: 0.5 },
    { url: `${SITE.url}/privacy`, priority: 0.5 },
    ...posts,
  ];
}
