import type { ReactNode } from "react";

/** Splits owner copy written as "A · B · C" into separate facts without changing the words. */
export function metaItems(text: string): string[] {
  return text.split(" · ").map((item) => item.trim()).filter(Boolean);
}

/**
 * Short facts on one line. Hairline dividers sit before each item and are clipped at every line
 * start, so a wrap never leaves a dangling "·" at the end of a line.
 */
export function MetaLine({ items, className = "" }: { items: ReactNode[] | string; className?: string }) {
  const list = typeof items === "string" ? metaItems(items) : items;
  return (
    <div className={`meta-line ${className}`}>
      <ul className="meta-line-track">
        {list.map((item, index) => <li key={index} className="meta-line-item">{item}</li>)}
      </ul>
    </div>
  );
}
