import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Sparkles, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { BLOG_POSTS, getBlogPostBySlug, getRelatedBlogPosts } from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { ShareButtons } from "@/components/ShareButtons";
import { ChessPositionCard } from "@/components/ChessPositionCard";
import { Nav } from "@/components/Nav";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, telegramLink } from "@/lib/config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found · Web3Chess",
    };
  }

  const url = `${SITE.url}/blog/${post.slug}`;

  return {
    title: `${post.title} · Web3Chess Chronicles`,
    description: post.excerpt,
    keywords: [
      post.category,
      "Web3 Chess",
      "Telegram Chess Bot",
      "Play Chess Earn Crypto",
      "TON Gaming",
      "Speed Chess Tactics",
      "Blitz Chess Strategy",
      "Online Chess Wagers"
    ],
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: "Web3Chess Chronicles",
      type: "article",
      publishedTime: post.publishedAt,
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

  const jsonLd = {
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
          "@type": "Person",
          name: post.author.name,
          jobTitle: post.author.role,
        },
        publisher: {
          "@type": "Organization",
          name: "Web3Chess",
          url: SITE.url,
          logo: `${SITE.url}/icon.svg`,
        },
        datePublished: post.publishedAt,
        mainEntityOfPage: articleUrl,
        keywords: [post.category, "Chess", "Web3", "Telegram Mini App"],
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
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      <main className="shell-wide space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-[12px] text-[#979797]">
          <Link href="/" className="transition-colors hover:text-[#000000]">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/blog" className="transition-colors hover:text-[#000000]">
            Blog
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-[#000000] font-semibold">{post.category}</span>
        </nav>

        {/* Article Header Container */}
        <header className="space-y-6 max-w-4xl">
          {/* Metadata Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[12px] font-medium uppercase tracking-tight text-[#000000]">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#979797]">
              <Clock className="size-3.5" />
              {post.readingTime}
            </span>
            <span className="font-mono text-[12px] text-[#979797]">• {post.publishedAt}</span>
          </div>

          {/* Headline (Brutalist Condensed) */}
          <h1 className="font-condensed text-[40px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000] sm:text-[58px] lg:text-[76px]">
            {post.title}
          </h1>

          {/* Subtitle / Lead */}
          <p className="text-[18px] sm:text-[20px] leading-[1.35] text-[#444444] font-normal">
            {post.subtitle}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3.5 pt-6 border-t border-[#e5e5e5]">
            <div className="grid size-11 place-items-center rounded-full bg-[#000000] font-mono text-sm font-bold text-white">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#000000] leading-tight">{post.author.name}</p>
              <p className="font-mono text-[11px] text-[#979797] uppercase tracking-wider mt-0.5">{post.author.role}</p>
            </div>
          </div>
        </header>

        {/* Key Takeaways Box (Dayos Style) */}
        {post.takeaways && post.takeaways.length > 0 && (
          <section className="max-w-4xl rounded-[32px] bg-white p-8 md:p-10">
            <div className="flex items-center gap-2.5 mb-6">
              <span className="grid size-7 place-items-center rounded-full bg-[#d1ffca] text-[#000000]">
                <Sparkles className="size-4" />
              </span>
              <h2 className="font-mono text-[12px] font-bold uppercase tracking-wider text-[#000000]">
                Key Takeaways
              </h2>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {post.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[15px] leading-[1.4] text-[#000000]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#047857] mt-1" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Article Content Body */}
        <article className="max-w-4xl rounded-[32px] bg-white p-8 md:p-14 space-y-8 text-[16px] md:text-[18px] leading-[1.65] text-[#000000]">
          {post.content.map((block, index) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={index}
                    className="font-condensed text-[32px] sm:text-[42px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000] pt-8 first:pt-0"
                  >
                    {block.text}
                  </h2>
                );
              case "subheading":
                return (
                  <h3
                    key={index}
                    className="font-condensed text-[24px] sm:text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.02em] text-[#000000] pt-4"
                  >
                    {block.text}
                  </h3>
                );
              case "paragraph":
                return (
                  <p key={index} className="text-[#444444] leading-[1.65]">
                    {block.text}
                  </p>
                );
              case "quote":
                return (
                  <blockquote
                    key={index}
                    className="my-8 rounded-[24px] border-l-4 border-[#000000] bg-[#f3f3f3] p-6 font-condensed text-[24px] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-[#000000] sm:text-[28px]"
                  >
                    {block.text}
                  </blockquote>
                );
              case "callout":
                return (
                  <div
                    key={index}
                    className="my-6 rounded-[24px] bg-[#d1ffca]/30 p-6 text-[#000000]"
                  >
                    <p className="text-[15px] md:text-[16px] leading-[1.5] font-medium text-[#000000]">
                      {block.text}
                    </p>
                  </div>
                );
              case "chess_position":
                return (
                  <ChessPositionCard
                    key={index}
                    fen={block.fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
                    caption={block.caption}
                  />
                );
              case "list":
                return (
                  <ul key={index} className="my-4 space-y-3 list-none">
                    {block.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3.5 text-[15px] md:text-[16px] text-[#444444]">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#f3f3f3] font-mono text-[11px] font-bold text-[#000000] mt-0.5">
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
          <div className="pt-8 border-t border-[#e5e5e5]">
            <ShareButtons title={post.title} url={articleUrl} />
          </div>
        </article>

        {/* Interactive Play Banner Callout */}
        <section className="max-w-4xl rounded-[32px] bg-[#000000] p-8 md:p-12 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3 py-0.5 font-mono text-[11px] font-medium uppercase text-[#000000]">
                READY TO TEST YOUR SKILLS?
              </span>
              <h3 className="font-condensed text-[32px] sm:text-[40px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-white">
                PLAY REAL-TIME CHESS ON TELEGRAM.
              </h3>
              <p className="text-[14px] text-[#979797]">
                Zero download required. Play free ranked matches or stake USDT instantly.
              </p>
            </div>

            <a
              href={telegramLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[8px] bg-white px-8 py-4 font-medium text-[15px] text-[#000000] transition-opacity hover:opacity-90 active:scale-95"
            >
              <BookOpen className="size-4" />
              <span>Launch Web3Chess</span>
            </a>
          </div>
        </section>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-6 pt-8">
            <div className="flex items-center justify-between">
              <h2 id="related-heading" className="font-mono text-[12px] uppercase tracking-wider text-[#979797]">
                Related Articles
              </h2>
              <Link
                href="/blog"
                className="font-mono text-[12px] uppercase tracking-wider text-[#000000] hover:underline"
              >
                View all →
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

      <QrDock />
      <MobileCta />
    </div>
  );
}
