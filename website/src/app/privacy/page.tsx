import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy · Web3Chess",
  description: "How Web3Chess handles data privacy, Telegram WebApp authentication, and self-custodial wallet interactions.",
  openGraph: {
    title: "Privacy Policy · Web3Chess",
    description: "Data handling, non-custodial privacy, and encryption standards on Web3Chess.",
    url: `${SITE.url}/privacy`,
  },
};

export default function PrivacyPage() {
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
            DATA PROTECTION
          </span>
          <h1 className="font-condensed text-[48px] sm:text-[68px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000]">
            PRIVACY POLICY
          </h1>
          <p className="text-[16px] sm:text-[18px] leading-[1.4] text-[#444444]">
            Web3Chess is committed to minimal data collection and cryptographic security.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-[32px] bg-white p-8 md:p-14 space-y-8 text-[15px] sm:text-[16px] leading-[1.65] text-[#444444]">
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

      <QrDock />
      <MobileCta />
    </div>
  );
}
