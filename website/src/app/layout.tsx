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
      className={`${onest.variable} ${condensed.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      </head>
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
