"use client";

import { useState } from "react";
import { BlogCard, type BlogSummary } from "./BlogCard";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
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
      <div className="blog-toolbar">
        <label className="blog-category-select block text-caption font-semibold">
          Topic
          <Select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2">
            {categories.map(item => <option key={item}>{item}</option>)}
          </Select>
        </label>
        <fieldset className="blog-category-buttons min-w-0">
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
        <label className="block min-w-0 text-caption font-semibold">
          Search the journal
          <span className="relative mt-2 block">
          <Icon name="magnifying-glass" size={18} className="pointer-events-none absolute start-3.5 top-4 text-fg-muted" />
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
      <p className="mb-4 text-caption text-fg-muted" role="status">
        {filtered.length} {filtered.length === 1 ? "story" : "stories"} to
        explore
      </p>
      {filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
