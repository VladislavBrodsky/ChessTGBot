import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PageHero } from "@/components/PageHero";
import { ChessSculpture } from "@/components/ChessSculpture";
import { CanvasStudio } from "@/components/canvas/CanvasStudio";
import { CanvasLibrary } from "@/components/canvas/CanvasLibrary";
import { CanvasStyleGuide } from "@/components/canvas/CanvasStyleGuide";
import { pageMetadata, jsonLd, breadcrumbData, faqData } from "@/lib/seo";

const CANVAS_FAQS = [
  {
    question: "What formats and aspect ratios are supported in Canvas Studio?",
    answer:
      "Canvas Studio supports four high-resolution social formats: 1:1 Square (1080×1080) for feed posts and carousel cards, 4:5 Portrait (1080×1350) for mobile feeds, 16:9 Wide (1920×1080) for X banners and YouTube thumbnails, and 9:16 Story (1080×1920) for Telegram stories, Reels, and vertical video covers.",
  },
  {
    question: "Can I customize the chess positions and headlines on the canvases?",
    answer:
      "Yes. The live studio allows you to edit the headline hook, tag, body copy, proof bullet points, CTA button, disclaimer note, and visual assets including 3D chess sculptures and real 8×8 FEN chessboard tactical positions with zero quality loss.",
  },
  {
    question: "How do I use the exported canvases with the Telegram CMO bot?",
    answer:
      "Every template includes a one-click 'Copy Bot Command' button that generates the exact CLI command (such as /post kind=telegram category=Tactics ...) needed for autonomous scheduling or publishing in the Telegram channel.",
  },
  {
    question: "Are exported PNGs and SVGs free to use for community and affiliate promotion?",
    answer:
      "Yes. All exported vector graphics, PNGs, and SVGs are free to download and use for promoting Web3Chess matches, organizing tournaments, streaming, sharing affiliate links, and community growth.",
  },
] as const;

export const metadata = pageMetadata(
  "Chess Marketing Canvas Studio: Templates & Design",
  "Design, preview, and download high-conversion marketing graphics for Telegram, X, and Instagram. 12 viral templates, 4 aspect ratios, and instant PNG export.",
  "/canvas",
  [
    "chess marketing templates",
    "chess canvas studio",
    "telegram chess graphics",
    "chess social media templates",
    "web3chess canvas",
    "chess post generator",
  ]
);

export default function CanvasPage() {
  return (
    <>
      <Nav />
      <main className="shell-main flex flex-col gap-12 py-8 sm:py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                breadcrumbData([
                  { name: "Home", path: "" },
                  { name: "Canvas Studio", path: "/canvas" },
                ]),
                faqData(CANVAS_FAQS),
              ],
            }),
          }}
        />

        <PageHero
          eyebrow="MARKETING DESIGN STUDIO"
          title={
            <>
              Canva &amp; templates
              <br />
              library
            </>
          }
          lead="Customise, preview, and export high-conversion marketing graphics for Telegram, X, and Instagram. Multi-format geometry, 100% vector fidelity, and zero terminal periods."
          visual={<ChessSculpture variant="home" />}
        />

        {/* 1. Interactive Studio (Toolbar, Preview, Form Editor) */}
        <CanvasStudio />

        {/* 2. Templates Bento Grid Library */}
        <CanvasLibrary />

        {/* 3. Style Guide & 7 Golden Rules */}
        <CanvasStyleGuide />
      </main>
      <Footer />
      <MobileCta />
      <QrDock />
    </>
  );
}
