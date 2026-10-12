import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/config";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const onest = localFont({
  src: "../../public/fonts/onest-variable.woff2",
  weight: "400 700",
  variable: "--nf-sans",
  display: "swap",
});
const condensed = localFont({
  src: "../../public/fonts/barlow-condensed-bold.woff2",
  weight: "700",
  variable: "--nf-condensed",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Web3Chess — Play Chess Online in Telegram & Win Real Crypto",
    template: "%s · Web3Chess",
  },
  description: SITE.description,
  keywords: [
    "telegram chess bot",
    "play chess in telegram",
    "telegram chess mini app",
    "play chess for crypto",
    "play chess for money online",
    "crypto chess game",
    "earn crypto playing chess",
    "free chess puzzles online",
    "online chess tactics trainer",
    "play chess vs stockfish online",
    "web3 chess",
    "usdt chess wager",
    "skill based chess",
    "telegram chess game",
  ],
  category: "games",
  classification: "Web3 Chess Game, Telegram Mini App, Online Chess Platform",
  alternates: {
    canonical: SITE.url,
  },
  openGraph: {
    title: "Web3Chess — Play Chess Online in Telegram & Win Real Crypto",
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE.url}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Web3Chess — The Premier Telegram Chess Arena",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Web3Chess — Play Chess Online in Telegram & Win Real Crypto",
    description: SITE.description,
    images: [`${SITE.url}/opengraph-image`],
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
      className={`${onest.variable} ${condensed.variable}`}
    >
      <body>
        <Script
          id="gtag-base"
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${SITE.gaMeasurementId}`}
        />
        <Script
          id="gtag-init"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Google Consent Mode v2 (EEA compliance & privacy standards)
              gtag('consent', 'default', {
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted',
                'analytics_storage': 'granted',
                'wait_for_update': 500
              });

              gtag('js', new Date());

              // GA4 initialization
              gtag('config', '${SITE.gaMeasurementId}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure',
                transport_type: 'beacon'
              });
            `,
          }}
        />
        <GoogleAnalytics />
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
