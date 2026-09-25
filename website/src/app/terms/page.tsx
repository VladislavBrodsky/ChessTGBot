import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service · Web3Chess",
  description: "Terms and conditions for playing rated chess matches and participating in wager pools on Web3Chess.",
  openGraph: {
    title: "Terms of Service · Web3Chess",
    description: "Rules, wager conditions, and eligibility for Web3Chess.",
    url: `${SITE.url}/terms`,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      <Nav />

      <main className="shell-wide space-y-12 py-8 md:py-14 max-w-4xl">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase text-[#000000] transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-[12px] text-[#979797]">Last updated: September 2026</span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
            LEGAL PROTOCOL
          </span>
          <h1 className="font-condensed text-[48px] sm:text-[68px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000]">
            TERMS OF SERVICE
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-[1.4] text-[#444444]">
            By accessing Web3Chess via Telegram Mini App, web, or smart contract interactions, you agree to comply with these terms.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-[32px] bg-white p-8 md:p-14 space-y-8 text-[15px] sm:text-[16px] leading-[1.65] text-[#444444]">
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
