import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE, SETTLEMENT } from "@/lib/config";
import { Icon, type IconName } from "@/icons";

export const metadata: Metadata = {
  title: "Fair Play & Anti-Cheat Protocol",
  description: "How Web3Chess enforces deterministic Stockfish move evaluation, server-side clock validation, and non-custodial smart escrow.",
  openGraph: {
    title: "Fair Play & Anti-Cheat Protocol · Web3Chess",
    description: "Server-side chess integrity, ELO matchmaking, and transparent payouts.",
    url: `${SITE.url}/fair-play`,
  },
};

const PILLARS = [
  {
    icon: "cpu" as IconName,
    title: "Server-Side Move Verification",
    desc: "Every move is parsed, validated, and clocked on our backend clusters. The client browser has zero authority over move legality, preventing client-side memory or clock exploits.",
  },
  {
    icon: "shield-check" as IconName,
    title: "Continuous Stockfish Engine Analysis",
    desc: "Match transcripts are evaluated in real-time against Grandmaster engine heuristics (Centipawn loss, move timing patterns, and move entropy) to detect unauthorized computer assistance.",
  },
  {
    icon: "scales" as IconName,
    title: "Provably Fair ELO Matchmaking",
    desc: "Dynamic matchmaking pairs opponents within tight rating bands. Wager tiers prevent rating manipulation, smurfing, and predatory pairing.",
  },
  {
    icon: "lock" as IconName,
    title: "Escrowed Stakes",
    desc: `Both players lock equal stakes into escrow held by the platform at match start. The winner claims ${100 - SETTLEMENT.platformFeePercent - SETTLEMENT.referralFeePercent}% of the pool automatically upon resignation or checkmate.`,
  },
];

export default function FairPlayPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Nav />

      <main className="shell-wide space-y-16 py-8 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-surface px-4 py-2 font-mono text-overline uppercase text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>

          <span className="tag">
            <Icon name="lightning" size={14} />
            Deterministic Engine Arbitration
          </span>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <span className="tag">
            Protocol Integrity
          </span>
          <h1 className="poster text-heading-xl text-fg">
            Skill is sacred.<br />
            No exploits.<br />
            Zero tampering.
          </h1>
          <p className="text-body sm:text-lead text-fg-muted max-w-[65ch]">
            Chess is the ultimate game of pure intellect. We designed Web3Chess from the protocol layer up so that no player can buy an advantage, manipulate clock timers, or exploit engine assistance.
          </p>
        </section>

        {/* 4 Pillars Grid */}
        <section className="grid gap-6 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-card bg-surface p-8 sm:p-10 space-y-4">
              <span className="grid size-12 place-items-center rounded-control bg-wash text-fg">
                <Icon name={p.icon} size={24} />
              </span>
              <h2 className="poster text-heading-sm text-fg">
                {p.title}
              </h2>
              <p className="text-body text-fg-muted">
                {p.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Settlement Rules: Black Block */}
        <section className="rounded-block bg-inverse p-8 sm:p-14 text-fg-inverse space-y-8">
          <div className="space-y-3">
            <span className="tag">
              Transparent Math
            </span>
            <h2 className="poster text-heading-lg text-fg-inverse">
              How Prize Pools and Rakes are Split
            </h2>
            <p className="max-w-[55ch] text-body sm:text-lead text-smoke">
              Every match creates a deterministic prize ledger on our server infrastructure.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 font-mono">
            <div className="rounded-card bg-white/5 p-6 space-y-2 border border-white/10">
              <p className="text-overline text-smoke uppercase tracking-wider">Winner Share</p>
              <p className="poster text-display text-fg-link leading-none">{SETTLEMENT.winnerPercent}%</p>
              <p className="text-caption text-smoke pt-2">Credited immediately to the winner&apos;s balance upon mate or resignation.</p>
            </div>
            <div className="rounded-card bg-white/5 p-6 space-y-2 border border-white/10">
              <p className="text-overline text-smoke uppercase tracking-wider">Platform Rake</p>
              <p className="poster text-display text-fg-inverse leading-none">{SETTLEMENT.platformFeePercent}%</p>
              <p className="text-caption text-smoke pt-2">Funds engine compute, game sockets, and arbitration infrastructure.</p>
            </div>
            <div className="rounded-card bg-white/5 p-6 space-y-2 border border-white/10">
              <p className="text-overline text-smoke uppercase tracking-wider">Referral Reward Pool</p>
              <p className="poster text-display text-voltage leading-none">{SETTLEMENT.referralFeePercent}%</p>
              <p className="text-caption text-smoke pt-2">Distributed transparently to players who invited community members.</p>
            </div>
          </div>
        </section>

        {/* CTA Card */}
        <section className="rounded-card bg-surface p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="poster text-heading-sm text-fg">
              Experience True Competitive Integrity.
            </h3>
            <p className="text-body text-fg-muted">
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
