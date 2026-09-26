import type { Metadata, Viewport } from "next";
import { Onest, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { SITE } from "@/lib/config";
import "./globals.css";

const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-onest",
  display: "swap",
});
const condensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-condensed",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Web3Chess — Play-to-Earn Chess in Telegram", template: "%s · Web3Chess" },
  description: SITE.description,
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "Web3Chess — Play-to-Earn Chess in Telegram",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#e5e5e5",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${onest.variable} ${condensed.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[140] focus:rounded-control focus:bg-surface focus:px-4 focus:py-3 focus:text-body focus:font-semibold focus:text-fg focus:shadow-card"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
