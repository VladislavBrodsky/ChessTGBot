import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles, Send, BookOpen } from "lucide-react";
import { BLOG_POSTS } from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { Nav } from "@/components/Nav";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, telegramLink } from "@/lib/config";

export const metadata: Metadata = {
  title: "Blog & Chronicles · Web3Chess",
  description: "Explore in-depth articles on chess strategy, game theory, Telegram Mini App architecture, and fair play protocols.",
  openGraph: {
    title: "Blog & Chronicles · Web3Chess",
    description: "Insights on chess mastery, transparent settlement, and competitive gaming on Telegram.",
    url: `${SITE.url}/blog`,
  },
};

export default function BlogHubPage() {
  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  const regularPosts = BLOG_POSTS.filter((p) => p.slug !== featuredPost.slug);

  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Nav />

      <main className="shell-main space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-fg-muted transition-colors hover:border-ink hover:text-ink"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
            <Sparkles className="size-3.5" />
            <span>Official Chronicles</span>
          </div>
        </div>

        {/* Page Hero Header */}
        <section className="space-y-4 max-w-3xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-fg-muted">
            INSIGHTS · STRATEGY · TECHNOLOGY
          </p>
          <h1 className="font-display text-[44px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-ink sm:text-[64px] lg:text-[76px]">
            THOUGHTS ON SKILL, CODE &amp; STRATEGY.
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted md:text-xl">
            Deep dives on real-time chess engine mechanics, fair play escrow, opening preparation, and the future of Telegram gaming.
          </p>
        </section>

        {/* Featured Post Hero */}
        <section aria-labelledby="featured-post-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="featured-post-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
              Featured Story
            </h2>
          </div>
          <BlogCard post={featuredPost} featured={true} />
        </section>

        {/* Regular Articles Grid */}
        <section aria-labelledby="latest-articles-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 id="latest-articles-heading" className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-fg-muted">
              All Articles ({BLOG_POSTS.length})
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Community & Newsletter Callout Card (Brutalist Refero Style) */}
        <section className="overflow-hidden rounded-[32px] border border-line bg-card p-8 md:p-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-voltage px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
                Join 12,000+ Players
              </span>
              <h3 className="font-display text-[32px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-ink sm:text-[40px]">
                GET TOURNAMENT SIGNALS &amp; TACTICS FIRST.
              </h3>
              <p className="text-base leading-relaxed text-fg-muted">
                Subscribe to our Telegram announcement channel for daily tactical breakdowns, grandmaster puzzles, and season leaderboard updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-8 py-4 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-ink/90 active:scale-95"
              >
                <Send className="size-4" />
                <span>Join Official Telegram</span>
              </a>

              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-canvas px-6 py-4 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:border-ink"
              >
                <BookOpen className="size-4" />
                <span>Play Free Match</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <QrDock />
      <MobileCta />
    </div>
  );
}
