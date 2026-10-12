import { SITE } from "@/lib/config";
import { getPublishedPosts } from "@/content/blog";

export const revalidate = 600;

export async function GET() {
  const posts = getPublishedPosts();
  const rssItems = posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE.url}/blog/${post.slug}</link>
      <guid>${SITE.url}/blog/${post.slug}</guid>
      <description><![CDATA[${post.metaDescription ?? post.excerpt}]]></description>
      <pubDate>${new Date(post.publishAt ?? `${post.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${post.category}</category>
    </item>`,
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE.name} Chess Journal</title>
    <link>${SITE.url}/blog</link>
    <description>${SITE.description}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE.url}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=600, stale-while-revalidate",
    },
  });
}
