import { Eyebrow } from "@/components/ui/Badge";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, SETTLEMENT } from "@/lib/config";
import { Icon } from "@/icons";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE.url}/terms` },
  title: "Terms of Service",
  description:
    "Terms and conditions for playing rated chess matches and participating in wager pools on Web3Chess.",
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

      <main id="main" className="shell-prose space-y-12 py-8 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-control bg-surface px-4 py-2 text-caption text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-caption text-fg-muted">
            Last updated: October 2026
          </span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <Eyebrow>Legal Protocol</Eyebrow>
          <h1 className="poster text-heading-xl text-fg">Terms of Service</h1>
          <p className="text-body sm:text-lead text-fg-muted">
            By accessing Web3Chess via the Telegram Mini App or web interface,
            you agree to comply with these terms.
          </p>
        </section>

        {/* Content Card */}
        <Card className="legal-copy space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              1. ELIGIBILITY &amp; AGE REQUIREMENTS
            </h2>
            <p>
              Free A.I. practice and tactical puzzles do not require a stake.
              You must be at least 18 years of age (or the higher legal age in
              your jurisdiction) to enter a USDT wager match. Availability
              depends on local rules and in-app eligibility requirements.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              2. FAIR PLAY
            </h2>
            <p>
              Make your own moves during player matches. Chess engines, outside
              analysis, another person choosing moves, and account manipulation
              are not permitted. The server validates legal moves and maintains
              the match state; legal-move validation alone cannot detect every
              kind of outside assistance. Suspected violations may be reviewed
              under the current in-app match rules.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              3. WAGERS &amp; SETTLEMENT RULES
            </h2>
            <p>
              In a USDT wager match, both players commit equal stakes from
              their platform balances. For a decided match, the winner is
              credited {SETTLEMENT.winnerPercent}% of the combined pot to their
              platform balance. The remaining split is{" "}
              {SETTLEMENT.platformFeePercent}% platform fee and{" "}
              {SETTLEMENT.referralFeePercent}% referral allocation. Draws,
              disconnections, reviews, and other outcomes follow the current
              in-app match rules. A balance credit is not an on-chain transfer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              4. PLATFORM BALANCE &amp; WITHDRAWALS
            </h2>
            <p>
              Eligible USDT deposits are credited to your in-app platform
              balance when the required token, network, and account reference
              are verified. Web3Chess is not a bank or self-custody wallet. To
              send funds to your personal TON wallet, request a withdrawal and
              complete the bot-chat confirmation. Some requests require review;
              processing and network timing can vary.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              5. RESPONSIBLE GAMING SAFEGUARDS
            </h2>
            <p>
              Wager matches involve real cryptocurrency and you can lose your
              stake. Set a limit before joining, never chase losses, and stop
              when play is no longer enjoyable. Free A.I. practice is available
              when you want to play without committing a stake.
            </p>
          </section>
        </Card>
      </main>

      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
