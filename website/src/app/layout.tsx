import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/lib/config";
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
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function isEditable(el){if(!el)return false;var tag=el.tagName;return tag==='INPUT'||tag==='TEXTAREA'||el.isContentEditable;}document.addEventListener('copy',function(e){if(!isEditable(e.target)){e.preventDefault();if(e.clipboardData){e.clipboardData.clearData();}}},true);document.addEventListener('cut',function(e){if(!isEditable(e.target)){e.preventDefault();if(e.clipboardData){e.clipboardData.clearData();}}},true);document.addEventListener('selectstart',function(e){if(!isEditable(e.target)){e.preventDefault();}},true);document.addEventListener('dragstart',function(e){if(!isEditable(e.target)){e.preventDefault();}},true);document.addEventListener('keydown',function(e){if(!isEditable(e.target)&&(e.ctrlKey||e.metaKey)){var k=(e.key||'').toLowerCase();if(k==='c'||k==='x'||k==='a'){e.preventDefault();}}},true);document.addEventListener('selectionchange',function(){if(!isEditable(document.activeElement)){var sel=window.getSelection();if(sel&&sel.rangeCount>0&&!sel.isCollapsed){sel.removeAllRanges();}}});})();`,
          }}
        />
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
