import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GA_GATEWAY_PATH, GEO_COOKIE, SITE } from "@/lib/config";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

// EEA member states, EEA EFTA states, the UK and Switzerland.
const CONSENT_REQUIRED_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE", "IS", "LI", "NO", "GB", "CH",
];

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
    "play chess vs computer online",
    "web3 chess",
    "usdt chess wager",
    "skill based chess",
    "telegram chess game",
  ],
  category: "games",
  classification: "Web3 Chess Game, Telegram Mini App, Online Chess Platform",
  alternates: {
    canonical: SITE.url,
    types: {
      "application/rss+xml": `${SITE.url}/feed.xml`,
    },
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
      data-scroll-behavior="smooth"
      lang="en"
      dir="ltr"
      className={`${onest.variable} ${condensed.variable}`}
    >
      <body>
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Consent Mode v2. The site runs no ads, so advertising signals
              // stay denied everywhere. Analytics cookies are denied by default
              // where prior consent is required (EEA, UK, Switzerland); GA then
              // sends cookieless pings only. The country comes from the
              // ${GEO_COOKIE} cookie set by src/proxy.ts, not gtag's region
              // parameter: that needs www.google.com/ccm/geo, which blockers
              // drop, and gtag then denies analytics for everyone.
              var cc = (document.cookie.match(/(?:^|; )${GEO_COOKIE}=([A-Z]{2})/) || [])[1];
              var consentRequired = ${JSON.stringify(CONSENT_REQUIRED_REGIONS)};
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage:
                  cc && consentRequired.indexOf(cc) !== -1 ? 'denied' : 'granted'
              });
              gtag('set', 'ads_data_redaction', true);

              gtag('js', new Date());
              // Page views, including App Router navigations, come from GA4
              // enhanced measurement (browser history events).
              gtag('config', '${SITE.gaMeasurementId}');
            `,
          }}
        />
        {/* Served first-party through the Google tag gateway (src/app/a3k) so
            tracker blockers that match Google's domains don't drop it. */}
        <Script
          id="gtag-base"
          strategy="afterInteractive"
          src={`${GA_GATEWAY_PATH}?id=${SITE.gaMeasurementId}`}
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
