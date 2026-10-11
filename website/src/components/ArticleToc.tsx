"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; text: string };

/** "On this page" rail. The current section follows scroll via one IntersectionObserver. */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => node !== null);
    if (!headings.length) return;
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        // Several headings can share the band; the earliest in the document wins.
        // With none in the band the last answer stays, so the rail never flickers blank.
        const current = headings.find((heading) => inBand.has(heading.id));
        if (current) setActive(current.id);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="On this page">
      <p className="mb-3 text-caption font-semibold">On this page</p>
      <ol className="article-toc">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
