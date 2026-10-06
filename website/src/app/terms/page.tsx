import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, SETTLEMENT } from "@/lib/config";
import { Icon } from "@/icons";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for playing rated chess matches and participating in wager pools on Web3Chess.",
  openGraph: {
    title: "Terms of Service · Web3Chess",
    description: "Rules, wager conditions, and eligibility for Web3Chess.",
    url: `${SITE.url}/terms`,
  },
};

export default function TermsPage() {
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
          <span className="tag">Legal Protocol</span>
          <h1 className="poster text-heading-xl text-fg">
            Terms of Service
          </h1>
          <p className="text-body sm:text-lead text-fg-muted">
            By accessing Web3Chess via the Telegram Mini App or web interface, you agree to comply with these terms.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-card bg-surface p-8 md:p-12 space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              1. ELIGIBILITY &amp; AGE REQUIREMENTS
            </h2>
            <p>
              Free practice against the A.I. and daily tactical puzzle training are open to global users with an active Telegram account. You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to participate in real-money USDT or TON wager matches. Real-money gaming is subject to local laws; players are responsible for compliance within their own jurisdictions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              2. FAIR PLAY &amp; ZERO-TOLERANCE ANTI-CHEAT
            </h2>
            <p>
              External chess engines, computer assistance, opening books during active wager matches, and multi-accounting to manipulate rating or match pools are strictly prohibited. Every move is processed server-side and analyzed against Stockfish 17 centipawn loss heuristics. Accounts violating fair play policies will be permanently banned and forfeits enforced.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              3. WAGERS &amp; SETTLEMENT RULES
            </h2>
            <p>
              When entering a cash wager match, both players commit equal platform balance stakes into match escrow. The winner receives {SETTLEMENT.winnerPercent}% of the total pot immediately upon checkmate, opponent resignation, or opponent clock flag. A platform fee of {SETTLEMENT.platformFeePercent}% is retained for server operations and anti-cheat compute, and {SETTLEMENT.referralFeePercent}% funds community referral rewards. Matches that conclude by legitimate chess rules are final.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              4. PLATFORM BALANCE &amp; WITHDRAWALS
            </h2>
            <p>
              Deposits are credited to your in-app platform balance. Web3Chess is not a bank or self-custody wallet. Withdrawals to your personal TON wallet are processed following security verification. High-volume transfers receive secondary review to safeguard platform solvency and prevent fraudulent account drain.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              5. RESPONSIBLE GAMING SAFEGUARDS
            </h2>
            <p>
              Wager matches involve real cryptocurrency and you can lose your stake. Never wager funds you cannot comfortably afford to lose. Web3Chess provides voluntary pause and cool-off options in the Telegram interface. Practice against the A.I. is always 100% free and unlimited.
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
