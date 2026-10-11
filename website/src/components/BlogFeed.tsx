"use client";

import { useState } from "react";
import { BlogCard, type BlogSummary } from "./BlogCard";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Icon } from "@/icons";
import { BLOG_CATEGORIES } from "@/content/blog-taxonomy";

const ALL = "All stories";

export function BlogFeed({
  posts,
  featuredSlug,
}: {
  posts: BlogSummary[];
  /** The editor's pick is shown above the feed, so it is not repeated until a filter is applied. */
  featuredSlug?: string;
}) {
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");
  const categories = [ALL, ...BLOG_CATEGORIES.filter((item) => posts.some((post) => post.category === item))];
  const needle = query.trim().toLowerCase();
  const filtering = category !== ALL || needle !== "";
  const filtered = posts.filter(
    (p) =>
      (filtering || p.slug !== featuredSlug) &&
      (category === ALL || p.category === category) &&
      (p.title + " " + p.excerpt).toLowerCase().includes(needle),
  );
  const reset = () => {
    setQuery("");
    setCategory(ALL);
  };
  return (
    <div>
      <div className="blog-toolbar">
        <label className="blog-category-select text-caption font-semibold">
          Topic
          <Select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2">
            {categories.map((item) => <option key={item}>{item}</option>)}
          </Select>
        </label>
        <fieldset className="blog-category-buttons">
          <legend className="mb-2 text-caption font-semibold">Topic</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Button
                key={item}
                variant={category === item ? "primary" : "secondary"}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                size="sm"
              >
                {item}
              </Button>
            ))}
          </div>
        </fieldset>
        <label className="blog-search text-caption font-semibold">
          Search the journal
          <span className="relative mt-2 block">
            <Icon name="magnifying-glass" size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-fg-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="search"
              placeholder="Openings, tactics, Telegram…"
              className="ps-11"
            />
          </span>
        </label>
      </div>
      <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-x-4">
        <p className="text-caption text-fg-muted" role="status">
          {filtered.length} {filtering ? "" : "more "}
          {filtered.length === 1 ? "story" : "stories"}
          {filtering ? " found" : " to explore"}
        </p>
        {filtering && (
          <Button variant="ghost" size="sm" className="-me-3.5" onClick={reset}>
            Clear filters
          </Button>
        )}
      </div>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <Icon name="book-open-text" size={32} className="mx-auto" />
          <h3 className="mt-4 text-title">No stories in this position</h3>
          <p className="mt-2 text-body text-fg-muted">
            Try another topic or clear the filters.
          </p>
          <Button variant="secondary" className="mt-5" onClick={reset}>
            Show all stories
          </Button>
        </Card>
      )}
    </div>
  );
}
