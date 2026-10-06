import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";
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
          <span className="font-mono text-caption text-fg-muted">Last updated: September 2026</span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <span className="tag">Legal Protocol</span>
          <h1 className="poster text-heading-xl text-fg">
            Terms of Service
          </h1>
          <p className="text-body sm:text-lead text-fg-muted">
            By accessing Web3Chess via Telegram Mini App, web, or smart contract interactions, you agree to comply with these terms.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-card bg-surface p-8 md:p-12 space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              1. ELIGIBILITY &amp; AGE REQUIREMENTS
            </h2>
            <p>
              Free play is open to global users with an active Telegram account. You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to participate in real-money USDT or TON wager matches.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              2. FAIR PLAY &amp; ANTI-CHEAT POLICY
            </h2>
            <p>
              External chess engines, AI bots, opening books during live games, and multi-accounting to manipulate ELO rating or wager pools are strictly prohibited. Accounts identified as violating fair play policies will be disqualified from prize pools and banned.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              3. WAGERS &amp; PRIZE SETTLEMENT
            </h2>
            <p>
              When entering a cash wager match, both players commit equal platform balance stakes. The winner receives 95% of the total pot. A platform fee of 3% is retained for server operation, and 2% is distributed to the referral pool. Games ended by timeout, resignation, or checkmate are final.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              4. WITHDRAWALS &amp; SECURITY CHECKS
            </h2>
            <p>
              Withdrawals to personal TON wallets are processed automatically. High-frequency or large withdrawals may undergo secondary risk verification to safeguard treasury liquidity and prevent fraud.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-condensed text-[26px] sm:text-[30px] font-bold uppercase text-[#000000]">
              5. RESPONSIBLE GAMING
            </h2>
            <p>
              Wager chess involves financial risk. Users should never stake funds they cannot afford to lose. Web3Chess provides voluntary deposit limits and self-exclusion tools via the Telegram bot interface.
            </p>
          </section>
        </div>
      </main>

      <QrDock />
      <MobileCta />
    </div>
  );
}
