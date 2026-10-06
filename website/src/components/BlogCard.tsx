import Link from "next/link";
import type { BlogPost } from "@/content/blog";
import { Icon } from "@/icons";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-card bg-surface p-8 md:p-12 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-5">
            {/* Meta Pill & Category */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="tag">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-caption text-fg-muted">
                <Icon name="clock" size={14} />
                {post.readingTime}
              </span>
              <span className="font-mono text-caption text-fg-muted">• {post.publishedAt}</span>
            </div>

            {/* Title */}
            <h2 className="poster text-heading-lg text-fg">
              <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-80">
                {post.title}
              </Link>
            </h2>

            {/* Subtitle / Excerpt */}
            <p className="max-w-[65ch] text-body sm:text-lead text-fg-muted">
              {post.subtitle || post.excerpt}
            </p>

            {/* Author & CTA Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-line">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-wash font-mono text-xs font-bold text-fg">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-body-sm font-semibold text-fg leading-tight">{post.author.name}</p>
                  <p className="font-mono text-overline text-fg-muted uppercase tracking-wider mt-0.5">{post.author.role}</p>
                </div>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 rounded-control bg-inverse px-5 py-2.5 text-button text-fg-inverse transition-colors hover:bg-graphite active:scale-[.98]"
              >
                <span>Read Story</span>
                <Icon name="arrow-up-right" size={16} className="flip-rtl" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col justify-between rounded-card bg-surface p-7 sm:p-8 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="space-y-4">
        {/* Category & Time */}
        <div className="flex items-center justify-between gap-2">
          <span className="tag">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-caption text-fg-muted">
            <Icon name="clock" size={14} />
            {post.readingTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="poster text-heading-sm text-fg">
          <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-80">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-3 text-body-sm text-fg-muted">
          {post.excerpt}
        </p>
      </div>

      {/* Author & Footer Link */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-line">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-full bg-wash font-mono text-[10px] font-bold text-fg">
            {post.author.name.charAt(0)}
          </div>
          <span className="text-body-sm font-semibold text-fg">{post.author.name}</span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 font-mono text-overline font-semibold uppercase tracking-wider text-fg transition-transform group-hover:translate-x-1"
        >
          <span>Read</span>
          <Icon name="arrow-up-right" size={14} className="flip-rtl" />
        </Link>
      </div>
    </article>
  );
}
