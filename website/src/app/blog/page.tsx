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
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      <Nav />

      <main className="shell-wide space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase text-[#000000] transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#d1ffca] px-4 py-1.5 font-mono text-[12px] font-medium uppercase tracking-tight text-[#000000]">
            <Sparkles className="size-3.5" />
            <span>Official Chronicles</span>
          </div>
        </div>

        {/* Page Hero Header */}
        <section className="space-y-4 max-w-4xl">
          <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
            INSIGHTS · STRATEGY · TECHNOLOGY
          </span>
          <h1 className="font-condensed text-[48px] sm:text-[68px] lg:text-[84px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000]">
            THOUGHTS ON SKILL, CODE &amp; PROTOCOL STRATEGY.
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-[1.4] text-[#444444] max-w-[65ch]">
            Deep dives on real-time chess engine mechanics, fair play arbitration, grandmaster opening preparation, and the future of Telegram gaming.
          </p>
        </section>

        {/* Featured Post Hero */}
        <section aria-labelledby="featured-post-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="featured-post-heading" className="font-mono text-[12px] uppercase tracking-wider text-[#979797]">
              Featured Story
            </h2>
          </div>
          <BlogCard post={featuredPost} featured={true} />
        </section>

        {/* Regular Articles Grid */}
        <section aria-labelledby="latest-articles-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 id="latest-articles-heading" className="font-mono text-[12px] uppercase tracking-wider text-[#979797]">
              All Articles ({BLOG_POSTS.length})
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Community Callout Card (Brutalist Dayos Style) */}
        <section className="rounded-[32px] bg-white p-8 md:p-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[#fff100] px-3.5 py-1 font-mono text-[11px] font-medium uppercase tracking-tight text-[#000000]">
                Join 12,000+ Players
              </span>
              <h3 className="font-condensed text-[36px] sm:text-[44px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                GET TOURNAMENT SIGNALS &amp; TACTICS FIRST.
              </h3>
              <p className="text-[15px] leading-[1.4] text-[#444444]">
                Subscribe to our Telegram announcement channel for daily tactical breakdowns, grandmaster puzzles, and season leaderboard updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-[8px] bg-[#000000] px-8 py-4 font-medium text-[15px] text-white transition-opacity hover:opacity-90 active:scale-95"
              >
                <Send className="size-4" />
                <span>Join Official Telegram</span>
              </a>

              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-[#444444] px-6 py-4 text-[15px] font-medium text-[#444444] transition-colors hover:border-[#000000] hover:text-[#000000]"
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
