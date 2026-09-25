import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import type { BlogPost } from "@/content/blog";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-[32px] border border-line bg-card p-6 transition-all duration-200 hover:border-ink/40 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-4">
            {/* Meta Pill & Category */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-mint px-3.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-fg-muted">
                <Clock className="size-3.5 text-fg-muted" />
                {post.readingTime}
              </span>
              <span className="font-mono text-xs text-fg-muted">• {post.publishedAt}</span>
            </div>

            {/* Title */}
            <h2 className="text-balance font-display text-[32px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-ink sm:text-[44px] lg:text-[52px]">
              <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-ink/80">
                {post.title}
              </Link>
            </h2>

            {/* Subtitle / Excerpt */}
            <p className="max-w-[70ch] text-base leading-relaxed text-fg-muted sm:text-lg">
              {post.subtitle || post.excerpt}
            </p>

            {/* Author & CTA Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-line/60">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-mist font-mono text-xs font-bold text-ink">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-ink leading-none">{post.author.name}</p>
                  <p className="font-mono text-[11px] text-fg-muted uppercase tracking-wider mt-1">{post.author.role}</p>
                </div>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-ink/90 active:scale-95"
              >
                <span>Read Article</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col justify-between rounded-[28px] border border-line bg-card p-6 transition-all duration-200 hover:border-ink/40 sm:p-7">
      <div className="space-y-4">
        {/* Category & Time */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-mint px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-fg-muted">
            <Clock className="size-3" />
            {post.readingTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-[24px] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-ink sm:text-[28px]">
          <Link href={`/blog/${post.slug}`} className="transition-colors hover:text-ink/80">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-3 text-sm leading-relaxed text-fg-muted">
          {post.excerpt}
        </p>
      </div>

      {/* Author & Footer Link */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-line/60">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-full bg-mist font-mono text-[10px] font-bold text-ink">
            {post.author.name.charAt(0)}
          </div>
          <span className="text-xs font-bold text-ink">{post.author.name}</span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase tracking-widest text-ink transition-transform group-hover:translate-x-0.5"
        >
          <span>Read</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
