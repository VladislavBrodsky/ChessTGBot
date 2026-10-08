import { Badge, Eyebrow } from "@/components/ui/Badge";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BLOG_POSTS,
  getBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { ShareButtons } from "@/components/ShareButtons";
import { ChessPositionCard } from "@/components/ChessPositionCard";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";
import { Icon } from "@/icons";
import { jsonLd } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
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

  return {
    title: post.title,
    description:
      post.metaDescription ?? post.excerpt,
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
      tags: post.takeaways.slice(0, 3),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
    alternates: {
      canonical: url,
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

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${articleUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        articleSection: post.category,
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
            url: `${SITE.url}/icon.svg`,
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
      <Nav />

      <main
        id="main"
        className="shell-wide space-y-12 py-8 md:space-y-16 md:py-12"
      >
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 font-mono text-overline uppercase text-fg-muted"
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
            <span className="inline-flex items-center gap-1 font-mono text-caption text-fg-muted">
              <Icon name="clock" size={14} />
              {post.readingTime}
            </span>
            <span className="font-mono text-caption text-fg-muted">
              <time dateTime={post.publishedAt}>{post.publishedAt}</time>
              {post.updatedAt && <> · Updated <time dateTime={post.updatedAt}>{post.updatedAt}</time></>}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-heading-xl font-semibold leading-tight text-fg">
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

        {/* Key Takeaways Box */}
        {post.takeaways && post.takeaways.length > 0 && (
          <section className="max-w-4xl rounded-card bg-surface p-8 md:p-10">
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
        <article className="max-w-3xl rounded-card bg-surface p-6 md:p-12 space-y-8 text-body text-fg">
          {post.content.map((block, index) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={index}
                    className="text-heading-md font-semibold leading-tight text-fg pt-8 first:pt-0"
                  >
                    {block.text}
                  </h2>
                );
              case "subheading":
                return (
                  <h3
                    key={index}
                    className="text-heading-sm font-semibold text-fg pt-4"
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
                    {block.text}
                  </p>
                );
              case "quote":
                return (
                  <blockquote
                    key={index}
                    className="my-8 rounded-control border-l-4 border-black bg-inset p-6 poster text-heading-md text-fg"
                  >
                    {block.text}
                  </blockquote>
                );
              case "callout":
                return (
                  <div
                    key={index}
                    className="my-6 rounded-control bg-mint/50 border border-line p-6 text-fg"
                  >
                    <p className="text-body font-medium text-fg">
                      {block.text}
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
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-inset font-mono text-[11px] font-bold text-fg mt-0.5">
                          {i + 1}
                        </span>
                        <span>{item}</span>
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

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section
            aria-labelledby="related-heading"
            className="space-y-6 pt-8 max-w-4xl"
          >
            <div className="flex items-center justify-between">
              <h2
                id="related-heading"
                className="font-mono text-overline uppercase text-fg-muted"
              >
                Related Articles
              </h2>
              <Link
                href="/blog"
                className="font-mono text-overline uppercase text-fg hover:underline"
              >
                View all articles →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((related) => (
                <BlogCard key={related.slug} post={related} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      <QrDock />
      <MobileCta />
    </div>
  );
}
