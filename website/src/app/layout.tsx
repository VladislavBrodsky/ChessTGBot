import type { Metadata, Viewport } from "next";
import { Onest, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { SITE } from "@/lib/config";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--nf-sans",
  display: "swap",
});
const condensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  variable: "--nf-condensed",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--nf-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Web3Chess — Chess in Telegram",
    template: "%s · Web3Chess",
  },
  description: SITE.description,
  openGraph: {
    title: "Web3Chess — Chess in Telegram",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#e5e5e5",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${onest.variable} ${condensed.variable} ${plexMono.variable}`}
    >
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[140] focus:rounded-control focus:bg-surface focus:px-4 focus:py-3 focus:text-body focus:font-semibold focus:text-fg focus:border focus:border-line"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
