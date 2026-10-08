export const BLOG_CATEGORIES = [
  "Tactics", "Openings", "Academy", "Chess News", "Chess Culture", "Product", "Match Rules",
] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
