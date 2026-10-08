"use client";

import { useState } from "react";
import { BlogCard, type BlogSummary } from "./BlogCard";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Icon } from "@/icons";
import { BLOG_CATEGORIES } from "@/content/blog-taxonomy";

export function BlogFeed({ posts }: { posts: BlogSummary[] }) {
  const [category, setCategory] = useState("All stories");
  const [query, setQuery] = useState("");
  const categories = ["All stories", ...BLOG_CATEGORIES.filter((item) => posts.some((post) => post.category === item))];
  const filtered = posts.filter(
    (p) =>
      (category === "All stories" || p.category === category) &&
      (p.title + " " + p.excerpt)
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter stories by category"
        >
          {categories.map((item) => (
            <Button
              key={item}
              variant={category === item ? "primary" : "secondary"}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className="px-3! text-caption!"
            >
              {item}
            </Button>
          ))}
        </div>
        <label className="block text-caption font-semibold">
          Search the journal
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Openings, tactics, Telegram…"
            className="mt-2 block min-h-12 w-full rounded-control border border-line bg-surface px-4 text-body sm:w-72"
          />
        </label>
      </div>
      <p className="mb-4 text-caption text-fg-muted" role="status">
        {filtered.length} {filtered.length === 1 ? "story" : "stories"} to
        explore
      </p>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <Card className="text-center">
          <Icon name="book-open-text" size={32} className="mx-auto" />
          <h3 className="mt-4 text-title">No stories in this position.</h3>
          <p className="mt-2 text-body text-fg-muted">
            Try another topic or clear the filters.
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => {
              setQuery("");
              setCategory("All stories");
            }}
          >
            Show all stories
          </Button>
        </Card>
      )}
    </div>
  );
}
