import type { ReactNode } from "react";
import { Badge, Eyebrow } from "@/components/ui/Badge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedPosts,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { ShareButtons } from "@/components/ShareButtons";
import { ChessPositionCard } from "@/components/ChessPositionCard";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";
import { Icon } from "@/icons";
import { jsonLd } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArticleToc } from "@/components/ArticleToc";
import { formatDate, headingId } from "@/lib/format";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Articles scheduled for later are rendered on demand once they go live.
export const revalidate = 60;
export const dynamicParams = true;

function renderFormattedText(text: string): ReactNode {
  if (!text || !text.includes("[")) return text;
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith("/");
    if (isInternal) {
      parts.push(
        <Link
          key={`${match.index}-${href}`}
          href={href}
          className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg transition-colors"
        >
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a
          key={`${match.index}-${href}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-fg underline decoration-line-strong underline-offset-4 hover:decoration-fg transition-colors"
        >
          {label}
        </a>
      );
    }
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

export async function generateStaticParams() {
  return getPublishedPosts().map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found",
    };
  }

  const url = `${SITE.url}/blog/${post.slug}`;
  const keywords = [
    post.title,
    post.category,
    "chess tactics",
    "speed chess",
    "chess strategy",
    "play chess online",
    ...post.slug.split("-"),
  ];

  return {
    title: post.title,
    description: post.metaDescription ?? post.excerpt,
    keywords,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: "Web3Chess Chronicles",
      type: "article",
      publishedTime: new Date(post.publishedAt).toISOString(),
      modifiedTime: new Date(post.updatedAt ?? post.publishedAt).toISOString(),
      authors: [post.author.name],
      section: post.category,
      tags: keywords.slice(0, 5),
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`${url}/opengraph-image`],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedBlogPosts(post.slug);
  const articleUrl = `${SITE.url}/blog/${post.slug}`;

  // Stable, unique ids for every section heading: deep links, "On this page" rail, scroll-spy.
  const takenIds = new Set<string>();
  const headingIds = new Map<number, string>();
  post.content.forEach((block, index) => {
    if (block.type !== "heading" || !block.text) return;
    const id = headingId(block.text, takenIds);
    takenIds.add(id);
    headingIds.set(index, id);
  });
  const toc = post.content.flatMap((block, index) => {
    const id = headingIds.get(index);
    return id && block.text ? [{ id, text: block.text }] : [];
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        articleSection: post.category,
        keywords: [post.title, post.category, ...post.takeaways].join(", "),
        inLanguage: "en-US",
        author: {
          "@type": post.author.kind ?? "Person",
          name: post.author.name,
          ...(post.author.kind === "Organization" ? { url: SITE.url } : { jobTitle: post.author.role }),
        },
        publisher: {
          "@type": "Organization",
          name: "Web3Chess",
          url: SITE.url,
          logo: {
            "@type": "ImageObject",
            url: `${SITE.url}/brand/w3chess-avatar.png`,
          },
        },
        citation: post.sources?.map((source) => source.url),
        datePublished: new Date(post.publishedAt).toISOString(),
        dateModified: new Date(
          post.updatedAt ?? post.publishedAt,
        ).toISOString(),
        image: `${articleUrl}/opengraph-image`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": articleUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${articleUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE.url}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: post.title,
            item: articleUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <div className="reading-progress" aria-hidden="true" />
      <Nav />

      <main
        id="main"
        className="reading-page shell-wide space-y-8 py-6 md:space-y-12 md:py-10"
      >
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-mono text-overline uppercase text-fg-muted [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center"
        >
          <Link href="/" className="transition-colors hover:text-fg">
            Home
          </Link>
          <Icon name="caret-right" size={12} />
          <Link href="/blog" className="transition-colors hover:text-fg">
            Blog
          </Link>
          <Icon name="caret-right" size={12} />
          <span className="text-fg font-semibold">{post.category}</span>
        </nav>

        {/* Article Header Container */}
        <header className="space-y-6 max-w-4xl">
          {/* Metadata Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge>{post.category}</Badge>
            <span className="inline-flex items-center gap-1 text-caption text-fg-muted">
              <Icon name="clock" size={14} />
              {post.readingTime}
            </span>
            <span className="text-caption text-fg-muted">
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
              {post.updatedAt && post.updatedAt !== post.publishedAt && (
                <> · Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time></>
              )}
            </span>
          </div>

          {/* Headline */}
          <h1 className="article-title text-fg">
            {post.title}
          </h1>

          {/* Subtitle / Lead */}
          <p className="text-lead text-fg-muted">{post.subtitle}</p>

          {/* Author Badge */}
          <div className="flex items-center gap-3.5 pt-6 border-t border-line">
            <div className="grid size-11 place-items-center rounded-full bg-black font-mono text-sm font-bold text-white">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="text-body-sm font-semibold text-fg leading-tight">
                {post.author.name}
              </p>
              <p className="font-mono text-overline text-fg-muted uppercase tracking-wider mt-0.5">
                {post.author.role}
              </p>
            </div>
          </div>
        </header>

        <div className="article-layout">
        <div className="article-column space-y-8 md:space-y-12">
        {/* Key Takeaways Box */}
        {post.takeaways && post.takeaways.length > 0 && (
          <section className="site-card bg-surface">
            <div className="flex items-center gap-2.5 mb-6">
              <Eyebrow>Key takeaways</Eyebrow>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {post.takeaways.map((takeaway, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-body-sm text-fg"
                >
                  <Icon
                    name="check-circle"
                    size={16}
                    className="shrink-0 text-black mt-0.5"
                  />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Article Content Body */}
        <article className="article-body site-card space-y-6 bg-surface text-body text-fg">
          {post.content.map((block, index) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={index}
                    id={headingIds.get(index)}
                    className="scroll-mt-28 font-medium leading-tight text-fg pt-3 first:pt-0"
                  >
                    {block.text}
                  </h2>
                );
              case "subheading":
                return (
                  <h3
                    key={index}
                    className="font-medium text-fg pt-2"
                  >
                    {block.text}
                  </h3>
                );
              case "paragraph":
                return (
                  <p
                    key={index}
                    className="text-body text-fg-muted leading-relaxed"
                  >
                    {renderFormattedText(block.text ?? "")}
                  </p>
                );
              case "quote":
                return (
                  <blockquote
                    key={index}
                    className="my-6 rounded-control border-s-4 border-line-strong bg-inset p-5 text-lead font-medium text-fg"
                  >
                    {renderFormattedText(block.text ?? "")}
                  </blockquote>
                );
              case "callout":
                return (
                  <div
                    key={index}
                    className="my-6 rounded-control bg-mint/50 border border-line p-6 text-fg"
                  >
                    <p className="text-body font-medium text-fg">
                      {renderFormattedText(block.text ?? "")}
                    </p>
                  </div>
                );
              case "chess_position":
                return (
                  <ChessPositionCard
                    key={index}
                    fen={
                      block.fen ||
                      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
                    }
                    caption={block.caption}
                  />
                );
              case "list":
                return (
                  <ul key={index} className="my-4 space-y-3 list-none">
                    {block.items?.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3.5 text-body text-fg-muted"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-inset font-mono text-overline font-bold text-fg mt-0.5">
                          {i + 1}
                        </span>
                        <span>{renderFormattedText(item)}</span>
                      </li>
                    ))}
                  </ul>
                );
              default:
                return null;
            }
          })}

          {/* Share Section */}
          <div className="pt-8 border-t border-line">
            <ShareButtons title={post.title} url={articleUrl} />
          </div>
        </article>

        {post.sources?.length ? (
          <Card className="max-w-3xl">
            <h2 className="text-heading-sm font-semibold">Sources and further reading</h2>
            <ul className="mt-4 space-y-3 text-body">
              {post.sources.map((source) => <li key={source.url}><a href={source.url} className="link-inline" rel="noopener noreferrer">{source.title}</a></li>)}
            </ul>
          </Card>
        ) : null}
        <Card className="max-w-3xl">
          <h2 className="text-heading-sm font-semibold">Put the idea into practice</h2>
          <p className="mt-3 text-body text-fg-muted">Build your next chess decision around what you learned.</p>
          <ButtonLink href={post.cta?.href ?? "/play"} className="mt-4">{post.cta?.label ?? "Practise free against A.I."}<Icon name="arrow-up-right" size={18} /></ButtonLink>
        </Card>
        </div>
        {toc.length > 1 && (
          <aside className="article-rail" aria-label="Article navigation">
            <ArticleToc items={toc} />
          </aside>
        )}
        </div>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="related-stories space-y-6 pt-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2
                id="related-heading"
                className="font-mono text-overline uppercase text-fg-muted"
              >
                Related Articles
              </h2>
              <Link
                href="/blog"
                className="inline-flex min-h-11 items-center font-mono text-overline uppercase text-fg hover:underline"
              >
                View all articles →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {relatedPosts.map((related) => (
                <BlogCard key={related.slug} post={related} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <MobileCta />
    </div>
  );
}
