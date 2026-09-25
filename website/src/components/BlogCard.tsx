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
      <article className="group relative overflow-hidden rounded-[32px] bg-white p-8 md:p-12 transition-transform duration-200 hover:-translate-y-0.5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-5">
            {/* Meta Pill & Category */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[12px] font-medium uppercase tracking-tight text-[#000000]">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#979797]">
                <Clock className="size-3.5 text-[#979797]" />
                {post.readingTime}
              </span>
              <span className="font-mono text-[12px] text-[#979797]">• {post.publishedAt}</span>
            </div>

            {/* Title */}
            <h2 className="text-balance font-condensed text-[36px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000] sm:text-[48px] lg:text-[60px]">
              <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-80">
                {post.title}
              </Link>
            </h2>

            {/* Subtitle / Excerpt */}
            <p className="max-w-[65ch] text-[16px] leading-[1.35] text-[#444444] sm:text-[18px]">
              {post.subtitle || post.excerpt}
            </p>

            {/* Author & CTA Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#e5e5e5]">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-[#f3f3f3] font-mono text-xs font-bold text-[#000000]">
                  {post.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-[#000000] leading-tight">{post.author.name}</p>
                  <p className="font-mono text-[11px] text-[#979797] uppercase tracking-wider mt-0.5">{post.author.role}</p>
                </div>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#000000] px-6 py-3 font-medium text-[14px] text-white transition-opacity hover:opacity-90 active:scale-95"
              >
                <span>Read Story</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col justify-between rounded-[32px] bg-white p-7 sm:p-8 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="space-y-4">
        {/* Category & Time */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3 py-0.5 font-mono text-[11px] font-medium uppercase tracking-tight text-[#000000]">
            {post.category}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#979797]">
            <Clock className="size-3.5" />
            {post.readingTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-condensed text-[28px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000] sm:text-[32px]">
          <Link href={`/blog/${post.slug}`} className="transition-opacity hover:opacity-80">
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        <p className="line-clamp-3 text-[15px] leading-[1.35] text-[#444444]">
          {post.excerpt}
        </p>
      </div>

      {/* Author & Footer Link */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-[#e5e5e5]">
        <div className="flex items-center gap-2.5">
          <div className="grid size-7 place-items-center rounded-full bg-[#f3f3f3] font-mono text-[10px] font-bold text-[#000000]">
            {post.author.name.charAt(0)}
          </div>
          <span className="text-[13px] font-semibold text-[#000000]">{post.author.name}</span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="inline-flex items-center gap-1 font-mono text-[12px] font-medium uppercase tracking-wider text-[#000000] transition-transform group-hover:translate-x-1"
        >
          <span>Read</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
