import type { Metadata } from "next";
import { SITE } from "./config";

/** Google truncates titles at roughly 600px, about 60 characters. */
export const MAX_TITLE_LENGTH = 60;

/**
 * Title for a child route. The root layout appends " · Web3Chess"; drop that
 * suffix when the result would be cut off in search results, or when the title
 * already names the brand (otherwise it would say Web3Chess twice).
 */
export function fitTitle(title: string): Metadata["title"] {
  if (title.includes(SITE.name)) return { absolute: title };
  return `${title} · ${SITE.name}`.length > MAX_TITLE_LENGTH ? { absolute: title } : title;
}

export function pageMetadata(
  title: string,
  description: string,
  path: string,
  keywords?: string[] | string,
  image?: string,
): Metadata {
  const url = `${SITE.url}${path}`;
  const cleanTitle = title.includes(SITE.name)
    ? title
    : `${title} · ${SITE.name}`;
  const ogImage = image ?? `${SITE.url}${path === "" || path === "/" ? "" : path}/opengraph-image`;

  return {
    // The root layout's title template applies only to child segments.
    title:
      path === "" || path === "/"
        ? { absolute: cleanTitle }
        : fitTitle(title),
    description,
    keywords: keywords ?? [
      "telegram chess bot",
      "play chess in telegram",
      "telegram chess mini app",
      "crypto chess game",
      "play chess for crypto",
      "free chess puzzles online",
      "web3 chess",
    ],
    alternates: { canonical: url },
    openGraph: {
      title: cleanTitle,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbData(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE.url}${item.path}`,
    })),
  };
}

export function softwareApplicationData() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Web3Chess Telegram Chess Bot",
    applicationCategory: "GameApplication",
    operatingSystem: "Telegram, iOS, Android, Web, macOS, Windows",
    url: `${SITE.url}/play`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

export function faqData(
  items: readonly { readonly question: string; readonly answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function howToData({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string; url?: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.name,
      text: step.text,
      url: step.url ?? `${SITE.url}/how-it-works`,
    })),
  };
}

