import Link from "next/link";
import type { Metadata } from "next";
import { PlayButton } from "@/components/PlayButton";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";
import { qrSvg } from "@/lib/qr";
import { telegramLink, SITE } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE.url}/play` },
  title: "Play",
  description:
    "Open the Web3Chess arena in Telegram, or sign in to play chess in your browser.",
};

export default async function PlayPage() {
  const svg = await qrSvg(telegramLink("arena"));
  return (
    <div className="shell-wide">
      <header className="site-header flex min-h-20 items-center justify-between gap-4">
        <Link href="/" aria-label="Web3Chess home" className="inline-flex min-h-11 items-center"><Logo /></Link>
        <Link href="/" aria-label="Back to the website" className="site-nav-link gap-2"><Icon name="arrow-left" size={16} /><span className="hidden sm:inline">Website</span></Link>
      </header>
      <main id="main" className="play-page mx-auto max-w-4xl">
        <div className="mb-8 space-y-4 sm:mb-10">
          <Badge tone="accent">Your next move</Badge>
          <h1 className="poster play-heading">Open the board.</h1>
          <p className="max-w-[48ch] hero-lead text-fg-muted">Choose your arena. Start with free A.I. practice, then decide how you want to play.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col items-start">
            <div className="flex w-full items-center justify-between gap-3">
              <Icon name="telegram-logo" size={28} />
              <Badge>Recommended</Badge>
            </div>
            <h2 className="mt-5 text-heading-sm font-medium">Inside Telegram</h2>
            <p className="mt-3 text-body text-fg-muted">Open the Mini App with your Telegram profile. No separate chess app to download.</p>
            <div className="mt-auto w-full pt-6">
              <PlayButton size="lg" startapp="arena" label="Open in Telegram" className="w-full" />
            </div>
          </Card>
          <Card className="flex flex-col items-start">
            <div className="flex min-h-7 items-center"><Icon name="globe" size={28} /></div>
            <h2 className="mt-5 text-heading-sm font-medium">In your browser</h2>
            <p className="mt-3 text-body text-fg-muted">A little more room for the board. Sign in with Telegram to continue on the web.</p>
            <div className="mt-auto w-full pt-6">
              <a href={`${SITE.appUrl}/en/login`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "w-full", "lg")}>
                Play in browser<Icon name="arrow-up-right" size={18} />
              </a>
            </div>
          </Card>
        </div>
        <div className="mt-6 hidden items-center gap-6 rounded-media border border-line p-5 md:flex">
          <div className="shrink-0 rounded-control bg-white p-2">
            <div className="size-28 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} role="img" aria-label="QR code that opens Web3Chess in Telegram" />
          </div>
          <div>
            <h2 className="text-title">Take the board with you.</h2>
            <p className="mt-2 max-w-[44ch] text-body text-fg-muted">Scan with your phone camera to open Web3Chess in Telegram.</p>
          </div>
        </div>
        <p className="mt-6 max-w-[65ch] text-caption text-fg-muted">A.I. practice and puzzles are free. Player matches use USDT stakes. Wager matches are 18+ where available; you can lose your stake.</p>
      </main>
    </div>
  );
}
