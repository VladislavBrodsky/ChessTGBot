import { Badge } from "@/components/ui/Badge";
import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/content/blog";
import { Icon, type IconName } from "@/icons";
import { articleArt, chessArt } from "@/lib/chess-art";

export type BlogSummary = Pick<
  BlogPost,
  | "slug"
  | "title"
  | "subtitle"
  | "excerpt"
  | "category"
  | "author"
  | "readingTime"
  | "publishedAt"
>;
const categoryIcons: Record<BlogPost["category"], IconName> = {
  Tactics: "target",
  Openings: "strategy",
  Product: "device-mobile",
  Academy: "graduation-cap",
  "Chess News": "globe",
  "Chess Culture": "chats-circle",
  "Match Rules": "scales",
};
export function BlogCard({
  post,
  featured = false,
}: {
  post: BlogSummary;
  featured?: boolean;
}) {
  return (
    <article
      className={`site-card journal-card group min-w-0 bg-surface ${featured ? "journal-featured" : ""}`}
    >
      <div className={`flex flex-col ${featured ? "" : "h-full"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge icon={categoryIcons[post.category]}>{post.category}</Badge>
          <span className="flex items-center gap-1 text-caption text-fg-muted">
            <Icon name="clock" size={16} />
            {post.readingTime}
          </span>
        </div>
        {featured ? (
          <h2 className="journal-title mt-4 font-medium">
            <Link href={`/blog/${post.slug}`} className="journal-link">
              {post.title}
            </Link>
          </h2>
        ) : (
          <h3 className="journal-title mt-4 font-medium">
            <Link href={`/blog/${post.slug}`} className="journal-link">
              {post.title}
            </Link>
          </h3>
        )}
        <p className="mt-3 text-body-sm text-fg-muted">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-5">
          <span className="text-caption text-fg-muted">{post.author.name}</span>
          <span
            aria-hidden="true"
            className="journal-read inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold"
          >
            Read story
            <Icon name="arrow-up-right" size={16} />
          </span>
        </div>
      </div>
      {featured && (
        <div className="journal-art">
          <Image
            src={`/illustrations/${chessArt[articleArt(post.slug, post.category)].file}.webp`}
            width={1000}
            height={1000}
            sizes="(max-width: 767px) 180px, 240px"
            alt=""
            className="h-auto w-full"
          />
        </div>
      )}
    </article>
  );
}
