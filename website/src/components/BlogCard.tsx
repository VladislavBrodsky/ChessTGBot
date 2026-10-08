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
      className={`site-card journal-card group flex min-w-0 flex-col bg-surface ${featured ? "lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] lg:items-center lg:gap-10" : ""}`}
    >
      <div className={`flex flex-col ${featured ? "" : "h-full"}`}>
        {!featured && (
          <Link
            href={`/blog/${post.slug}`}
            aria-label={`Read ${post.title}`}
            tabIndex={-1}
            className="journal-cover mb-6"
            aria-hidden="true"
          >
            <Icon name={categoryIcons[post.category]} size={48} />
            <span className="journal-cover-label">
              Web3Chess journal
            </span>
          </Link>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge icon={categoryIcons[post.category]}>{post.category}</Badge>
          <span className="flex items-center gap-1 font-mono text-caption text-fg-muted">
            <Icon name="clock" size={14} />
            {post.readingTime}
          </span>
        </div>
        {featured ? (
          <h2 className="mt-5 text-heading-md font-medium leading-tight">
            <Link href={`/blog/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h2>
        ) : (
          <h3 className="mt-5 text-heading-sm font-medium leading-tight">
            <Link href={`/blog/${post.slug}`} className="hover:underline">
              {post.title}
            </Link>
          </h3>
        )}
        <p className="mt-3 text-body-sm text-fg-muted">{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-5">
          <span className="text-caption text-fg-muted">{post.author.name}</span>
          <Link
            href={`/blog/${post.slug}`}
            aria-label={`Read ${post.title}`}
            className="inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold"
          >
            Read story
            <Icon name="arrow-up-right" size={16} />
          </Link>
        </div>
      </div>
      {featured && (
        <div className="mt-6 flex justify-center rounded-media bg-inset p-5 lg:mt-0">
          <Image
            src={`/illustrations/${chessArt[articleArt(post.slug, post.category)].file}.webp`}
            width={1000}
            height={1000}
            sizes="(max-width: 479px) 80vw, 320px"
            alt=""
            className="h-auto w-full max-w-80"
          />
        </div>
      )}
    </article>
  );
}
