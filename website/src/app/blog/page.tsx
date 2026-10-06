import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/content/blog";
import { BlogCard } from "@/components/BlogCard";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, telegramLink } from "@/lib/config";
import { Icon } from "@/icons";

export const metadata: Metadata = {
  title: "Blog & Chronicles",
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

      <main className="shell-wide space-y-12 py-8 md:space-y-16 md:py-12">
        {/* Breadcrumb & Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-surface px-4 py-2 font-mono text-overline uppercase text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>

          <span className="tag">
            <Icon name="sparkle" size={14} />
            Official Chronicles
          </span>
        </div>

        {/* Page Hero Header */}
        <section className="space-y-4 max-w-4xl">
          <span className="tag">
            Insights · Strategy · Technology
          </span>
          <h1 className="poster text-heading-xl text-fg">
            Thoughts on skill, code &amp; protocol strategy
          </h1>
          <p className="text-body sm:text-lead text-fg-muted max-w-[65ch]">
            Deep dives on real-time chess engine mechanics, fair play arbitration, grandmaster opening preparation, and the future of Telegram gaming.
          </p>
        </section>

        {/* Featured Post Hero */}
        <section aria-labelledby="featured-post-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="featured-post-heading" className="font-mono text-overline uppercase text-fg-muted">
              Featured Story
            </h2>
          </div>
          <BlogCard post={featuredPost} featured={true} />
        </section>

        {/* Regular Articles Grid */}
        <section aria-labelledby="latest-articles-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 id="latest-articles-heading" className="font-mono text-overline uppercase text-fg-muted">
              All Articles ({BLOG_POSTS.length})
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* Community Callout Card */}
        <section className="rounded-card bg-surface p-8 md:p-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="space-y-3">
              <span className="tag">
                Community Signals
              </span>
              <h3 className="poster text-heading-md text-fg">
                Get tournament signals &amp; tactics first
              </h3>
              <p className="text-body text-fg-muted">
                Subscribe to our Telegram announcement channel for tactical breakdowns, puzzles, and season leaderboard updates.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-control bg-inverse px-6 py-3.5 text-button text-fg-inverse transition-colors hover:bg-graphite active:scale-[.98]"
              >
                <Icon name="paper-plane-tilt" size={16} />
                <span>Join Official Telegram</span>
              </a>

              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-line-strong px-6 py-3.5 text-button text-fg transition-colors hover:bg-white active:scale-[.98]"
              >
                <Icon name="book-open-text" size={16} />
                <span>Play Free Match</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
