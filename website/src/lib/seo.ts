import type { Metadata } from "next";
import { SITE } from "./config";

export function pageMetadata(
  title: string,
  description: string,
  path: string,
): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    // The root layout's title template applies only to child segments.
    title:
      path === "" || path === "/"
        ? { absolute: `${title} · ${SITE.name}` }
        : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} · Web3Chess`,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Web3Chess`,
      description,
    },
  };
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
