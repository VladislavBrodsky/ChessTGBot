import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";
import { Icon } from "@/icons";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Web3Chess handles data privacy, Telegram WebApp authentication, and self-custodial wallet interactions.",
  openGraph: {
    title: "Privacy Policy · Web3Chess",
    description: "Data handling, non-custodial privacy, and encryption standards on Web3Chess.",
    url: `${SITE.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Nav />

      <main className="shell-prose space-y-12 py-8 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-surface px-4 py-2 font-mono text-overline uppercase text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-caption text-fg-muted">Last updated: September 2026</span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <span className="tag">Data Protection</span>
          <h1 className="poster text-heading-xl text-fg">
            Privacy Policy
          </h1>
          <p className="text-body sm:text-lead text-fg-muted">
            Web3Chess is committed to minimal data collection and cryptographic security.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-card bg-surface p-8 md:p-12 space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              1. INFORMATION WE PROCESS
            </h2>
            <p>
              When you initialize the Mini App, Telegram securely passes your public Telegram ID, username, and language preference via cryptographic hash verification (`initData`). We do not collect passwords, email addresses, phone numbers, or credit card details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              2. ON-CHAIN &amp; WALLET DATA
            </h2>
            <p>
              When connecting your TON wallet (e.g. Tonkeeper, Telegram Wallet), we store only your public wallet address for withdrawal and deposit routing. We never request, process, or store your private keys or seed phrases.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              3. GAME TELEMETRY &amp; MOVE DATA
            </h2>
            <p>
              Chess move notations (PGN), clock deltas, and matchmaking telemetry are stored to maintain leaderboard ratings, dispute resolution, and automated Stockfish anti-cheat validation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              4. COOKIES &amp; LOCAL STORAGE
            </h2>
            <p>
              We use local storage only to remember user interface preferences (theme, sound effects, notation style). No third-party ad tracking cookies are deployed on the marketing website or Telegram Mini App.
            </p>
          </section>
        </div>
      </main>

      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
