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
  description: "How Web3Chess handles data privacy, Telegram WebApp authentication, and TON wallet routing.",
  openGraph: {
    title: "Privacy Policy · Web3Chess",
    description: "Data handling, telemetry protection, and privacy standards on Web3Chess.",
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
          <span className="font-mono text-caption text-fg-muted">Last updated: October 2026</span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <span className="tag">Data Protection</span>
          <h1 className="poster text-heading-xl text-fg">
            Privacy Policy
          </h1>
          <p className="text-body sm:text-lead text-fg-muted">
            Web3Chess is designed with minimal data collection, zero third-party ad tracking, and cryptographic integrity.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-card bg-surface p-8 md:p-12 space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              1. TELEGRAM DATA &amp; AUTHENTICATION
            </h2>
            <p>
              When you open the Mini App, Telegram securely delivers your public Telegram User ID, display name, username, and language preference via cryptographically signed `initData`. We never request or store your Telegram password, phone number, contacts, or personal private messages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              2. WALLET ADDRESSES &amp; TRANSACTION RECORDS
            </h2>
            <p>
              When initiating withdrawals to your personal TON wallet, we record only your public TON address for fund routing and security audits. We never request, process, or have access to your private keys, seed phrases, or external wallet passwords.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              3. GAME TELEMETRY &amp; ANTI-CHEAT ANALYSIS
            </h2>
            <p>
              Move notations (PGN), millisecond clock timestamps, and socket connectivity signals are recorded to compute ratings, maintain leaderboards, and conduct automated Stockfish 17 anti-cheat heuristic checks.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              4. STORAGE &amp; THIRD-PARTY TRACKING
            </h2>
            <p>
              We use local storage strictly to remember interface preferences (sound effects, board theme, chess notation). We do not deploy third-party advertising trackers or sell player data to external brokers.
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
