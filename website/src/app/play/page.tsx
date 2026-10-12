import Link from "next/link";
import type { Metadata } from "next";
import { PlayButton } from "@/components/PlayButton";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/magicui/border-beam";
import { Icon } from "@/icons";
import { qrSvg } from "@/lib/qr";
import { telegramLink, SITE } from "@/lib/config";
import { BRAND } from "@/lib/brand";
import { pageMetadata, jsonLd, softwareApplicationData, breadcrumbData } from "@/lib/seo";

export const metadata: Metadata = pageMetadata(
  "Play Chess Online: Telegram Bot & Web Arena",
  "Launch the #1 Telegram chess bot or play in your web browser. Free Stockfish 16 A.I. practice, 100 tactical puzzles, and real-money USDT matches with instant on-chain payouts.",
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
  const svg = await qrSvg(telegramLink("arena"));
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
            ],
          }),
        }}
      />
      <header className="site-header flex min-h-20 items-center justify-between gap-4">
        <Link href="/" aria-label={`${BRAND.wordmark} home`} className="inline-flex min-h-11 items-center"><Logo /></Link>
        <Link href="/" aria-label="Back to the website" className="site-nav-link gap-2"><Icon name="arrow-left" size={16} /><span className="hidden sm:inline">Website</span></Link>
      </header>
      <main id="main" className="play-page mx-auto max-w-4xl">
        <div className="mb-8 space-y-4 sm:mb-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="accent" icon="lightning">
              Instant Launch
            </Badge>
            <span className="font-mono text-caption text-emerald-600 flex items-center gap-1.5 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Arena · 3,840+ Active Rivals
            </span>
          </div>
          <h1 className="poster play-heading">Play Chess Online: Telegram Chess Bot &amp; Web Arena</h1>
          <p className="max-w-[50ch] hero-lead text-fg-muted">
            Launch directly in Telegram with the premier Telegram chess bot or play in your desktop browser. Enjoy free Stockfish A.I. practice, solve 100 tactics puzzles, or enter live USDT matches on GRAM rails.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: Telegram Mini App (Recommended) */}
          <Card className="flex flex-col justify-between p-6 bg-surface border border-line rounded-2xl relative overflow-hidden group">
            <BorderBeam size={260} duration={12} colorFrom="#3b82f6" colorTo="#10b981" />
            <div className="relative z-10 w-full flex flex-col flex-1 items-start">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Icon name="telegram-logo" size={24} />
                </div>
                <Badge tone="accent">Recommended</Badge>
              </div>
              <h2 className="mt-5 text-heading-sm font-medium tracking-tight">Telegram Chess Bot &amp; Mini App</h2>
              <p className="mt-2 text-body-sm text-fg-muted">
                Open the Mini App with your Telegram profile. Zero friction, zero passwords, and no separate app download.
              </p>

              <div className="my-5 w-full space-y-2 border-t border-line pt-4 text-caption font-mono text-fg-muted">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>One-tap launch with Telegram profile</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>GRAM wallet deposit and withdrawal rails</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>Push notification when rival is paired</span>
                </div>
              </div>

              <div className="mt-auto w-full">
                <PlayButton size="lg" startapp="arena" label="Open in Telegram" className="w-full" pulsating trackingLocation="play_arena_card" />
              </div>
            </div>
          </Card>

          {/* Card 2: Desktop Browser */}
          <Card className="flex flex-col justify-between p-6 bg-surface border border-line rounded-2xl relative overflow-hidden group">
            <div className="relative z-10 w-full flex flex-col flex-1 items-start">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-inset text-fg-default border border-line">
                  <Icon name="globe" size={24} />
                </div>
                <span className="font-mono text-caption text-fg-muted bg-inset px-2.5 py-0.5 rounded-full border border-line">
                  Desktop Web
                </span>
              </div>
              <h2 className="mt-5 text-heading-sm font-medium tracking-tight">In your browser</h2>
              <p className="mt-2 text-body-sm text-fg-muted">
                More room for the board on desktop screens. Sign in via Telegram to sync your rating, pieces, and match history.
              </p>

              <div className="my-5 w-full space-y-2 border-t border-line pt-4 text-caption font-mono text-fg-muted">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span>Expanded widescreen board layout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span>Stockfish 16 engine analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span>Synchronized cloud profile state</span>
                </div>
              </div>

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
            <div className="shrink-0 rounded-xl bg-white p-2.5 border border-line shadow-xs">
              <div className="size-24 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="QR code that opens Web3Chess in Telegram" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-title">Take the board with you</h2>
                <span className="font-mono text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                  Instant mobile handoff
                </span>
              </div>
              <p className="max-w-[44ch] text-body-sm text-fg-muted">
                Scan with your phone camera to launch Web3Chess in Telegram. No login required.
              </p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-4 text-caption font-mono text-fg-muted pr-2">
            <div className="text-right">
              <span className="block font-semibold text-fg-default">iOS &amp; Android</span>
              <span className="text-[11px]">Bot API 8.0+ Ready</span>
            </div>
          </div>
        </div>

        {/* Trust & Safe Space Guarantees */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 rounded-xl border border-line bg-inset p-3.5 text-center font-mono text-caption">
          <div className="flex items-center justify-center gap-1.5 text-fg-default font-medium py-1 sm:py-0">
            <Icon name="shield-check" size={16} className="text-emerald-600 shrink-0" />
            <span>Automated Match Escrow</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-fg-default font-medium border-y sm:border-y-0 sm:border-x border-line py-2 sm:py-0">
            <Icon name="lightning" size={16} className="text-amber-500 shrink-0" />
            <span>Sub-Second Finality</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-fg-default font-medium py-1 sm:py-0">
            <Icon name="cpu" size={16} className="text-blue-600 shrink-0" />
            <span>Stockfish Anti-Cheat</span>
          </div>
        </div>

        <p className="mt-4 max-w-[65ch] text-caption text-fg-muted">
          A.I. practice and tactics puzzles are 100% free with unlimited games. Real-money matches use optional USDT stakes on GRAM rails. Wager matches are 18+ where available; play responsibly.
        </p>
      </main>
    </div>
  );
}
