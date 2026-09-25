import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Cpu, Scale, Lock, Zap } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, SETTLEMENT } from "@/lib/config";

export const metadata: Metadata = {
  title: "Fair Play & Anti-Cheat Protocol · Web3Chess",
  description: "How Web3Chess enforces deterministic Stockfish move evaluation, server-side clock validation, and non-custodial smart escrow.",
  openGraph: {
    title: "Fair Play & Anti-Cheat Protocol · Web3Chess",
    description: "Server-side chess integrity, ELO matchmaking, and transparent on-chain payouts.",
    url: `${SITE.url}/fair-play`,
  },
};

const PILLARS = [
  {
    icon: Cpu,
    title: "Server-Side Move Verification",
    desc: "Every move is parsed, validated, and clocked on our backend clusters. The client browser has zero authority over move legality, preventing client-side memory or clock exploits.",
  },
  {
    icon: ShieldCheck,
    title: "Continuous Stockfish Engine Analysis",
    desc: "Match transcripts are evaluated in real-time against Grandmaster engine heuristics (Centipawn loss, move timing patterns, and move entropy) to detect unauthorized computer assistance.",
  },
  {
    icon: Scale,
    title: "Provably Fair ELO Matchmaking",
    desc: "Dynamic matchmaking pairs opponents within tight rating bands. Wager tiers prevent rating manipulation, smurfing, and predatory pairing.",
  },
  {
    icon: Lock,
    title: "Self-Custodial Smart Escrow",
    desc: `Both players lock equal stakes into escrow at match start. The winner claims ${100 - SETTLEMENT.platformFeePercent - SETTLEMENT.referralFeePercent}% of the pool automatically upon resignation or checkmate.`,
  },
];

export default function FairPlayPage() {
  return (
    <div className="min-h-screen bg-[#e5e5e5] text-[#000000]">
      <Nav />

      <main className="shell-wide space-y-16 py-8 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-[8px] bg-white px-4 py-2 font-mono text-[12px] font-medium uppercase text-[#000000] transition-opacity hover:opacity-80"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full bg-[#d1ffca] px-4 py-1.5 font-mono text-[12px] font-medium uppercase tracking-tight text-[#000000]">
            <Zap className="size-3.5" />
            <span>Integrity System v2.4</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
            PROTOCOL INTEGRITY
          </span>
          <h1 className="font-condensed text-[52px] sm:text-[76px] lg:text-[96px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-[#000000]">
            SKILL IS SACRED.<br />
            NO EXPLOITS.<br />
            ZERO TAMPERING.
          </h1>
          <p className="text-[18px] sm:text-[20px] leading-[1.35] text-[#444444] max-w-[65ch]">
            Chess is the ultimate game of pure intellect. We designed Web3Chess from the protocol layer up so that no player can buy an advantage, manipulate clock timers, or exploit engine assistance.
          </p>
        </section>

        {/* 4 Pillars Grid */}
        <section className="grid gap-6 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-[32px] bg-white p-8 sm:p-10 space-y-4">
              <span className="grid size-12 place-items-center rounded-[8px] bg-[#f3f3f3] text-[#000000]">
                <p.icon className="size-6" strokeWidth={1.5} />
              </span>
              <h2 className="font-condensed text-[32px] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-[#000000]">
                {p.title}
              </h2>
              <p className="text-[15px] leading-[1.4] text-[#444444]">
                {p.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Inverted Top-Arc Section: Settlement Rules */}
        <section className="rounded-[40px] bg-[#000000] p-8 sm:p-14 text-white space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
              Transparent Math
            </span>
            <h2 className="font-condensed text-[40px] sm:text-[60px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-white">
              HOW PRIZE POOLS AND RAKES ARE SPLIT
            </h2>
            <p className="max-w-[55ch] text-[16px] text-[#979797]">
              Every match creates a deterministic prize ledger on the TON network.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 font-mono">
            <div className="rounded-[24px] bg-[#181818] p-6 space-y-2">
              <p className="text-[12px] text-[#979797] uppercase tracking-wider">Winner Share</p>
              <p className="font-condensed text-[48px] font-bold text-[#d1ffca] leading-none">95%</p>
              <p className="text-[13px] text-[#979797] pt-2">Credited immediately to the winner&apos;s balance upon mate or resignation.</p>
            </div>
            <div className="rounded-[24px] bg-[#181818] p-6 space-y-2">
              <p className="text-[12px] text-[#979797] uppercase tracking-wider">Platform Rake</p>
              <p className="font-condensed text-[48px] font-bold text-white leading-none">{SETTLEMENT.platformFeePercent}%</p>
              <p className="text-[13px] text-[#979797] pt-2">Funds engine compute, high-availability Redis game sockets, and liquidity.</p>
            </div>
            <div className="rounded-[24px] bg-[#181818] p-6 space-y-2">
              <p className="text-[12px] text-[#979797] uppercase tracking-wider">Referral Reward Pool</p>
              <p className="font-condensed text-[48px] font-bold text-[#fff100] leading-none">{SETTLEMENT.referralFeePercent}%</p>
              <p className="text-[13px] text-[#979797] pt-2">Distributed 3 tiers deep to the community members who recruited the players.</p>
            </div>
          </div>
        </section>

        {/* CTA Card */}
        <section className="rounded-[32px] bg-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="font-condensed text-[32px] sm:text-[40px] font-bold uppercase leading-[0.92] text-[#000000]">
              EXPERIENCE TRUE COMPETITIVE INTEGRITY.
            </h3>
            <p className="text-[15px] text-[#444444]">
              Join thousands of rated players in the Telegram arena.
            </p>
          </div>
          <PlayButton size="lg" />
        </section>
      </main>

      <QrDock />
      <MobileCta />
    </div>
  );
}
