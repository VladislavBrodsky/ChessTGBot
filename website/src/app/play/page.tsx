import Link from "next/link";
import type { Metadata } from "next";
import { PlayButton } from "@/components/PlayButton";
import { ChessSculpture } from "@/components/ChessSculpture";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MetaLine } from "@/components/ui/MetaLine";
import { Icon } from "@/icons";
import { qrSvg } from "@/lib/qr";
import { telegramLink, SITE, WEBSITE_CAMPAIGNS } from "@/lib/config";
import { BRAND } from "@/lib/brand";
import { pageMetadata, jsonLd, softwareApplicationData, breadcrumbData, faqData } from "@/lib/seo";

const PLAY_FAQS = [
  {
    question: "How do I start playing chess inside Telegram?",
    answer:
      "Tap 'Play in Telegram' to open the Web3Chess Mini App inside Telegram. You are instantly authenticated with your Telegram handle—no passwords, no app store downloads, and no registration forms required.",
  },
  {
    question: "Can I play on desktop web browsers without Telegram?",
    answer:
      "Yes. Tap 'Play in browser' to launch the full Web3Chess web arena in Chrome, Safari, Firefox, or Brave. You can log in via Telegram Web or practice against Stockfish AI anonymously.",
  },
  {
    question: "Is Web3Chess free to play?",
    answer:
      "Yes. Unlimited practice matches against the Stockfish 16 engine, 100 tactical puzzle levels in the Academy, and casual games are 100% free with zero paywalls. Real-money USDT matches are completely optional.",
  },
  {
    question: "How do I challenge a friend to a chess game on Telegram?",
    answer:
      "Inside the app, tap 'Play Friend' to generate a unique match challenge link. Share the link into any Telegram private chat or group. When your friend taps it, the board opens immediately.",
  },
] as const;

export const metadata: Metadata = pageMetadata(
  "Play Chess Online: Telegram Bot & Web Arena",
  "Launch Web3Chess in Telegram or play in your web browser. Practice free against Stockfish, explore 100 tactical levels, and learn the rules for optional USDT matches.",
  "/play",
  [
    "telegram chess bot",
    "play chess in telegram",
    "telegram chess mini app",
    "play chess online telegram",
    "chess bot telegram",
    "web3 chess app",
    "crypto chess bot",
    "play chess online",
  ],
);

export default async function PlayPage() {
  const svg = await qrSvg(telegramLink(WEBSITE_CAMPAIGNS.play));
  return (
    <div className="shell-wide">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@graph": [
              breadcrumbData([
                { name: "Home", path: "" },
                { name: "Play Chess Online", path: "/play" },
              ]),
              softwareApplicationData(),
              faqData(PLAY_FAQS),
            ],
          }),
        }}
      />
      <header className="site-header flex min-h-20 items-center justify-between gap-4">
        <Link href="/" aria-label={`${BRAND.wordmark} home`} className="inline-flex min-h-11 items-center"><Logo /></Link>
        <Link href="/" aria-label="Back to the website" className="site-nav-link gap-2"><Icon name="arrow-left" size={16} /><span className="hidden sm:inline">Website</span></Link>
      </header>
      <main id="main" className="play-page mx-auto max-w-4xl">
        <section className="page-hero mb-8 sm:mb-10" aria-labelledby="page-title">
          <div className="hero-visual"><ChessSculpture /></div>
          <div className="page-hero-copy hero-intro space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="accent" icon="lightning">
              Instant Launch
            </Badge>
            <MetaLine className="font-semibold win-ink" items="Free AI practice · Optional online matches" />
          </div>
          <h1 id="page-title" className="poster play-heading">Play Chess Online: Telegram Chess Bot &amp; Web Arena</h1>
          <p className="max-w-[50ch] hero-lead text-fg-muted">
            Launch directly in Telegram or play in your desktop browser. Enjoy free Stockfish A.I. practice, solve 100 tactics puzzles, or explore optional USDT matches.
          </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Card 1: Telegram Mini App (Recommended) */}
          <Card className="flex flex-col justify-between p-4 sm:p-6 bg-surface border border-line rounded-2xl relative overflow-hidden group">
            <div className="relative z-10 w-full flex flex-col flex-1 items-start">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-fg-muted/10 text-fg-muted border border-line/20">
                  <Icon name="telegram-logo" size={24} />
                </div>
                <Badge tone="accent">Recommended</Badge>
              </div>
              <h2 className="mt-5 text-heading-sm font-medium tracking-tight">Telegram Chess Bot &amp; Mini App</h2>
              <p className="mt-2 text-body-sm text-fg-muted">
                Open the Mini App with your Telegram profile. Zero friction, zero passwords, and no separate app download.
              </p>

              <ul className="play-checks">
                <li><Icon name="check" size={14} /><span>One-tap launch with Telegram profile</span></li>
                <li><Icon name="check" size={14} /><span>GRAM wallet deposit and withdrawal rails</span></li>
                <li><Icon name="check" size={14} /><span>Push notification when rival is paired</span></li>
              </ul>
              <div className="mt-auto w-full">
                <PlayButton size="lg" startapp="arena" label="Open in Telegram" className="w-full" pulsating trackingLocation="play_arena_card" />
              </div>
            </div>
          </Card>

          {/* Card 2: Desktop Browser */}
          <Card className="flex flex-col justify-between p-4 sm:p-6 bg-surface border border-line rounded-2xl relative overflow-hidden group">
            <div className="relative z-10 w-full flex flex-col flex-1 items-start">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-inset text-fg border border-line">
                  <Icon name="globe" size={24} />
                </div>
                <Badge tone="outline">Desktop Web</Badge>
              </div>
              <h2 className="mt-5 text-heading-sm font-medium tracking-tight">In your browser</h2>
              <p className="mt-2 text-body-sm text-fg-muted">
                More room for the board on desktop screens. Sign in via Telegram to sync your rating, pieces, and match history.
              </p>

              <ul className="play-checks">
                <li><Icon name="check" size={14} /><span>Expanded widescreen board layout</span></li>
                <li><Icon name="check" size={14} /><span>Stockfish 16 engine analysis</span></li>
                <li><Icon name="check" size={14} /><span>Synchronized cloud profile state</span></li>
              </ul>
              <div className="mt-auto w-full">
                <a
                  href={`${SITE.appUrl}/en/login`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary", "w-full", "lg")}
                >
                  Play in browser
                  <Icon name="arrow-up-right" size={18} />
                </a>
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop Mobile Bridge / QR Dock */}
        <div className="mt-6 hidden items-center justify-between gap-6 rounded-2xl border border-line bg-surface p-5 md:flex">
          <div className="flex items-center gap-5">
            <div className="shrink-0 rounded-xl bg-white p-2.5 border border-line shadow-none">
              <div className="size-24 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="QR code that opens Web3Chess in Telegram" />
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h2 className="text-title">Take the board with you</h2>
                <Badge tone="accent">Instant mobile handoff</Badge>
              </div>
              <p className="max-w-[44ch] text-body-sm text-fg-muted">
                Scan with your phone camera to launch Web3Chess in Telegram. No login required.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 pe-2 text-caption text-fg-muted lg:flex">
            <div className="text-right">
              <span className="block font-semibold text-fg">iOS &amp; Android</span>
              <span className="text-caption">Bot API 8.0+ Ready</span>
            </div>
          </div>
        </div>

        {/* Trust & Safe Space Guarantees */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 rounded-xl border border-line bg-inset p-3.5 text-center text-caption">
          <div className="flex items-center justify-center gap-1.5 text-fg font-medium py-1 sm:py-0">
            <Icon name="shield-check" size={16} className="text-fg-win shrink-0" />
            <span>Automated Match Escrow</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-fg font-medium border-y sm:border-y-0 sm:border-x border-line py-2 sm:py-0">
            <Icon name="lightning" size={16} className="text-fg-caution shrink-0" />
            <span>Sub-Second Finality</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-fg font-medium py-1 sm:py-0">
            <Icon name="cpu" size={16} className="text-fg-muted shrink-0" />
            <span>Stockfish Anti-Cheat</span>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Instant Help</span>
            <span className="text-caption text-fg-muted">Play &amp; Matchmaking FAQs</span>
          </div>
          <Card>
            <div>
              {PLAY_FAQS.map((item) => (
                <details
                  key={item.question}
                  name="play-faq"
                  className="group border-b border-line py-2 last:border-0"
                >
                  <summary className="faq-question flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-fg marker:hidden">
                    <span className="text-body-sm font-medium">{item.question}</span>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-fg-muted transition-transform duration-150 group-open:rotate-45"
                    >
                      <Icon name="plus" size={18} />
                    </span>
                  </summary>
                  <p className="pb-4 pt-1 text-body-sm text-fg-muted">{item.answer}</p>
                </details>
              ))}
            </div>
          </Card>
        </div>

        <p className="mt-6 max-w-[65ch] text-caption text-fg-muted">
          A.I. practice and tactics puzzles are 100% free with unlimited games. Real-money matches use optional USDT stakes on GRAM rails. Wager matches are 18+ where available; play responsibly.
        </p>
      </main>
    </div>
  );
}
