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
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
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
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
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
  };

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      <main className="shell-main space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-mono text-xs text-fg-muted">
          <Link href="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <Link href="/blog" className="transition-colors hover:text-ink">
            Blog
          </Link>
          <ChevronRight className="size-3" />
          <span className="text-ink font-bold">{post.category}</span>
        </nav>

        {/* Article Header Container */}
        <header className="space-y-6 max-w-4xl">
          {/* Metadata Pill Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center rounded-full bg-mint px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-ink">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-fg-muted">
              <Clock className="size-3.5" />
              {post.readingTime}
            </span>
            <span className="font-mono text-xs text-fg-muted">• {post.publishedAt}</span>
          </div>

          {/* Headline (Brutalist Condensed) */}
          <h1 className="font-display text-[38px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-ink sm:text-[54px] lg:text-[68px]">
            {post.title}
          </h1>

          {/* Subtitle / Lead */}
          <p className="text-lg leading-relaxed text-fg-muted sm:text-xl md:text-2xl font-normal">
            {post.subtitle}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3.5 pt-4 border-t border-line">
            <div className="grid size-11 place-items-center rounded-full bg-ink font-mono text-sm font-bold text-white">
              {post.author.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-ink leading-tight">{post.author.name}</p>
              <p className="font-mono text-xs text-fg-muted uppercase tracking-wider">{post.author.role}</p>
            </div>
          </div>
        </header>

        {/* Key Takeaways Box (Refero Style) */}
        {post.takeaways && post.takeaways.length > 0 && (
          <section className="max-w-4xl rounded-[28px] border-2 border-ink bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid size-6 place-items-center rounded-full bg-mint text-ink">
                <Sparkles className="size-3.5" />
              </span>
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink">
                Key Takeaways
              </h2>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {post.takeaways.map((takeaway, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm leading-relaxed text-fg">
                  <CheckCircle2 className="size-4 shrink-0 text-win mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Main Article Content Body */}
        <article className="max-w-3xl space-y-8 text-base md:text-lg leading-[1.7] text-fg">
          {post.content.map((block, index) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={index}
                    className="font-display text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-ink pt-6 first:pt-0 sm:text-[34px]"
                  >
                    {block.text}
                  </h2>
                );
              case "subheading":
                return (
                  <h3
                    key={index}
                    className="font-display text-[22px] font-bold uppercase leading-tight tracking-[-0.02em] text-ink pt-4 sm:text-[26px]"
                  >
                    {block.text}
                  </h3>
                );
              case "paragraph":
                return (
                  <p key={index} className="text-fg leading-relaxed">
                    {block.text}
                  </p>
                );
              case "quote":
                return (
                  <blockquote
                    key={index}
                    className="my-8 rounded-[24px] border-l-4 border-ink bg-card p-6 font-display text-xl font-bold uppercase leading-snug tracking-[-0.02em] text-ink sm:text-2xl"
                  >
                    {block.text}
                  </blockquote>
                );
              case "callout":
                return (
                  <div
                    key={index}
                    className="my-6 rounded-[24px] border border-line bg-mint/40 p-6 font-medium text-ink shadow-sm"
                  >
                    <p className="text-sm md:text-base leading-relaxed font-semibold">
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
                  <ul key={index} className="my-4 space-y-2.5 pl-2 list-none">
                    {block.items?.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm md:text-base text-fg">
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mist font-mono text-[11px] font-bold text-ink mt-0.5">
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
          <ShareButtons title={post.title} url={articleUrl} />
        </article>

        {/* Interactive Play Banner Callout */}
        <section className="max-w-4xl overflow-hidden rounded-[32px] border border-line bg-card p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                READY TO TEST YOUR SKILLS?
              </span>
              <h3 className="font-display text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-ink sm:text-[36px]">
                PLAY REAL-TIME CHESS ON TELEGRAM.
              </h3>
              <p className="text-sm text-fg-muted">
                Zero download required. Play free ranked matches or stake USDT instantly.
              </p>
            </div>

            <a
              href={telegramLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-ink/90 active:scale-95"
            >
              <BookOpen className="size-4" />
              <span>Launch Web3Chess</span>
            </a>
          </div>
        </section>

        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-6 pt-8 border-t border-line">
            <div className="flex items-center justify-between">
              <h2 id="related-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
                Related Articles
              </h2>
              <Link
                href="/blog"
                className="font-mono text-xs font-bold uppercase tracking-wider text-ink hover:underline"
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
