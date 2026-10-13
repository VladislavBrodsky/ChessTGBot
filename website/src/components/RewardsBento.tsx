"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/icons";
import { Badge } from "@/components/ui/Badge";
import { IconCloud } from "./magicui/icon-cloud";
import { LiveSettlementFeed } from "./LiveSettlementFeed";

// ── Modern 2D/3D Tokens for Vault Drop Sphere ──────────────────────────────
function GramToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#0098EA] via-[#0088d6] to-[#005fa8] text-white shadow-sm border border-white/60 `}
      title="GRAM"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="GRAM">
        <path
          d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function BtcToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#F7931A] via-[#f59e0b] to-[#b45309] text-white shadow-sm border border-white/60 `}
      title="Bitcoin"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="BTC">
        <path
          d="M22.5 13.6c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 2.9 1.8.4.7-2.8c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c3.1.6 5.4.3 6.4-2.4.8-2.2 0-3.5-1.6-4.3 1.1-.3 2-1 2.2-2.4zm-4 5.3c-.6 2.3-4.4 1.1-5.6.8l1-4c1.2.3 5.2.9 4.6 3.2zm.5-5.4c-.5 2.1-3.7 1-4.7.8l.9-3.7c1 .2 4.3.7 3.8 2.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function UsdtToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#26A17B] via-[#10b981] to-[#047857] text-white shadow-sm border border-white/60 `}
      title="Tether USDT"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-3.5 sm:size-4.5" aria-label="USDT">
        <path
          d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function KingChessToken({ className = "size-6.5 sm:size-8.5" }: { className?: string }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#581c87] text-white shadow-sm border border-amber-300/50 `}
      title="Chess King"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 sm:size-4.5 text-white"
        aria-label="King Chess"
      >
        <path d="M12 2v4M10 4h4" />
        <path
          d="M6.5 8.5C8 9.5 9 10 12 10s4-.5 5.5-1.5c.8 3.5-1 6.5-1.5 8.5h-8C7.5 15 5.7 12 6.5 8.5z"
          fill="currentColor"
          fillOpacity="0.25"
        />
        <path d="M6 17h12M5 20h14" />
      </svg>
    </div>
  );
}

export function RewardsBento() {
  return (
    <div className="marketing-bento grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* ── CARD 1 (Full 2 cols on mobile, 2 cols on lg): Live Real-Time Arena Settlements ── */}
      <Card className="reward-panel sm:col-span-2 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="reward-copy p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <Badge tone="accent" icon="lightning">Live Settlements</Badge>
            <span className="font-mono text-caption sm:text-caption text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="size-1.5 sm:size-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time on-chain
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default leading-snug">
              Instant 95% Winner Payouts
            </h3>
            <p className="text-body text-fg-muted mt-1 max-w-[55ch]">
              Both players lock equal USDT before move 1. The moment checkmate or resignation lands, 95% of the pot credits instantly to the winner’s balance.
            </p>
          </div>
          <div className="pt-0.5 sm:pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 font-mono text-caption sm:text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore payout architecture</span>
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Live Animated Settlement Terminal */}
        <div className="reward-demo settlement-demo relative w-full bg-inset/30 border-t border-line/50 p-2.5 sm:p-3.5 flex flex-col justify-between">
          <LiveSettlementFeed />
        </div>
      </Card>

      {/* ── CARD 2 (1 col on mobile, 1 col on desktop): Mystery Vault Drops ── */}
      <Card className="reward-panel col-span-1 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs transition-all hover:border-fg-muted/40 hover:shadow-sm [--vault-rx:38px] [--vault-ry:14px] [--vault-rx2:30px] [--vault-ry2:11px] sm:[--vault-rx:70px] sm:[--vault-ry:24px] sm:[--vault-rx2:56px] sm:[--vault-ry2:18px]">
        {/* Dedicated top content container */}
        <div className="reward-copy p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <Badge tone="accent" icon="gift">Mystery Vaults</Badge>
            <span className="font-mono text-caption font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              Daily Drops
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default leading-tight">
              Win up to 1,000 GRAM
            </h3>
            <p className="text-body text-fg-muted mt-0.5 sm:mt-1 leading-snug">
              Match XP unboxes King, Queen, and Knight chests with GRAM prizes &amp; 2× boosts.
            </p>
          </div>
          <div className="pt-0.5 sm:pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1 font-mono text-caption sm:text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore Boxes</span>
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — 3D Spheric Crypto Vault */}
        <div className="reward-demo vault-demo relative min-h-52 w-full overflow-hidden bg-inset/30 border-t border-line/50 flex items-center justify-center select-none">
          <IconCloud center={
            <div className="vault-core">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v3M10.5 3.5h3M7 8c1.2 1 2 1.5 5 1.5s3.8-.5 5-1.5c.8 3-1 5.5-1.5 7.5h-7C8 13.5 6.2 11 7 8zM6.5 17h11M5.5 20h13" />
              </svg>
            </div>
          }>
            <GramToken className="size-10" />
            <BtcToken className="size-10" />
            <UsdtToken className="size-10" />
            <KingChessToken className="size-10" />
          </IconCloud>

          {/* Integrated Asset Legend Pill */}
          <div className="vault-asset-legend absolute bottom-4 flex items-center gap-1 sm:gap-1.5 font-mono text-caption font-semibold text-fg-muted bg-surface/90 px-1.5 sm:px-3 py-0.5 rounded-full border border-line shadow-2xs backdrop-blur-xs">
            <span className="text-[#00649A] font-bold">GRAM</span>
            <span className="text-line">·</span>
            <span className="text-[#945000] font-bold">BTC</span>
            <span className="text-line">·</span>
            <span className="text-[#065F46] font-bold">USDT</span>
            <span className="text-line">·</span>
            <span className="text-[#6D28D9] font-bold">KING</span>
          </div>
        </div>
      </Card>

      {/* ── CARD 3 (1 col on mobile, 1 col on desktop): Stakes Flexibility ── */}
      <Card className="reward-panel col-span-1 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="reward-copy p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <Badge tone="accent" icon="lightning">Stake Ladder</Badge>
            <span className="font-mono text-caption font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              From $1
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default leading-tight">
              Play Any Stake Level
            </h3>
            <p className="text-body text-fg-muted mt-0.5 sm:mt-1 leading-snug">
              $1 micro-duels up to $500 high-roller classics. Winner claims 95% on-chain.
            </p>
          </div>
          <div className="pt-0.5 sm:pt-1">
            <Link
              href="/wagers"
              className="inline-flex items-center gap-1 font-mono text-caption sm:text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>View tiers</span>
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — 3-Tier Arena Lobby Showcase */}
        <div className="reward-demo relative min-h-56 w-full overflow-hidden bg-inset/30 border-t border-line/50 p-2 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-0.5 sm:pb-1 text-caption font-mono text-fg-muted">
            <span className="text-fg-default font-semibold">Stake Ladder</span>
            <span className="text-emerald-700 font-semibold bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded-full text-caption">$1–$500</span>
          </div>

          {/* Mobile view: Compact clean rows */}
          <div className="flex flex-col gap-1 sm:hidden w-full my-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-surface text-caption">
              <span className="font-mono font-bold text-fg-default">$5 Blitz</span>
              <span className="font-mono font-bold text-emerald-600">→ $9.50</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] text-caption">
              <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                $25 Rapid
                <span className="text-caption font-bold bg-mint text-fg px-1 rounded-sm uppercase">Hot</span>
              </span>
              <span className="font-mono font-bold text-emerald-600">→ $47.50</span>
            </div>
          </div>

          {/* Desktop view: 3 Columns Grid */}
          <div className="hidden sm:grid grid-cols-3 gap-1.5 w-full my-3">
            <div className="rounded-xl border border-line bg-surface p-2 text-center shadow-2xs">
              <span className="block font-mono font-bold text-fg-default text-caption">$5</span>
              <span className="block font-mono text-caption text-fg-muted mt-0.5">Blitz 3+2</span>
              <span className="block font-mono text-caption font-bold text-emerald-600 mt-1">→ $9.50</span>
            </div>
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-2 text-center shadow-xs relative">
              <span className="block mx-auto mb-2 w-fit px-1.5 py-0.2 rounded-full text-caption font-bold bg-mint text-fg uppercase font-mono tracking-wider">
                Popular
              </span>
              <span className="block font-mono font-bold text-emerald-700 text-caption">$25</span>
              <span className="block font-mono text-caption text-fg-muted mt-0.5">Rapid 10+0</span>
              <span className="block font-mono text-caption font-bold text-emerald-600 mt-1">→ $47.50</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-2 text-center shadow-2xs">
              <span className="block font-mono font-bold text-fg-default text-caption">$100</span>
              <span className="block font-mono text-caption text-fg-muted mt-0.5">Classic 30+0</span>
              <span className="block font-mono text-caption font-bold text-emerald-600 mt-1">→ $190</span>
            </div>
          </div>

          {/* Visual Stake Ladder Rail */}
          <div className="w-full pt-1 border-t border-line/50 flex items-center justify-between font-mono text-caption text-fg-muted">
            <span>$1 Micro</span>
            <div className="h-1 flex-1 mx-1.5 sm:mx-2.5 rounded-full bg-line relative">
              <div className="h-full bg-emerald-500 rounded-full w-2/5" />
              <div className="size-2 sm:size-2.5 rounded-full bg-emerald-600 absolute top-1/2 -translate-y-1/2 left-[40%] border border-surface shadow-2xs" />
            </div>
            <span>$500 Whale</span>
          </div>
        </div>
      </Card>

      {/* ── CARD 4 (1 col on mobile, 1 col on desktop): Affiliate Growth Engine ── */}
      <Card className="reward-panel col-span-1 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="reward-copy p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <Badge tone="accent" icon="users-three">Affiliate Engine</Badge>
            <span className="font-mono text-caption font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              2.0% Total
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default leading-tight">
              2% Lifetime Match Rake
            </h3>
            <p className="text-body text-fg-muted mt-0.5 sm:mt-1 leading-snug">
              Invite friends once. Earn passive USDT commissions across 6 referral tiers.
            </p>
          </div>
          <div className="pt-0.5 sm:pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1 font-mono text-caption sm:text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Referral rules</span>
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Multi-Tier Affiliate Breakdown */}
        <div className="reward-demo relative min-h-56 w-full bg-inset/30 border-t border-line/50 p-2 sm:p-3.5 flex flex-col justify-between font-mono text-caption">
          <div className="flex items-center justify-between pb-1 border-b border-line/60">
            <span className="text-fg-default font-semibold">Referral Rake</span>
            <span className="text-emerald-700 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20 text-caption">2.0% Pool</span>
          </div>

          <div className="space-y-1 sm:space-y-1.5 my-3">
            <div className="flex items-center justify-between p-2.5 rounded-md sm:rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06]">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="min-w-7 h-7 shrink-0 whitespace-nowrap rounded-full bg-mint text-fg font-bold text-caption flex items-center justify-center">1</span>
                <span className="font-semibold text-fg-default text-caption">Tier 1 Direct</span>
              </div>
              <span className="font-bold text-emerald-700 text-caption">1.0%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md sm:rounded-lg border border-line bg-surface">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="min-w-7 h-7 shrink-0 whitespace-nowrap rounded-full bg-inset border border-line text-fg-muted font-bold text-caption flex items-center justify-center">2</span>
                <span className="text-fg-muted text-caption">Tier 2 Friends</span>
              </div>
              <span className="font-bold text-emerald-700 text-caption">0.4%</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-md sm:rounded-lg border border-line bg-surface">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="min-w-7 h-7 shrink-0 whitespace-nowrap rounded-full bg-inset border border-line text-fg-muted font-bold text-caption flex items-center justify-center">3–6</span>
                <span className="text-fg-muted text-caption">Tiers 3–6</span>
              </div>
              <span className="font-bold text-emerald-700 text-caption">0.6%</span>
            </div>
          </div>

          <div className="pt-0.5 sm:pt-1 border-t border-line/50 text-caption text-fg-muted text-center">
            Instant credit when referrals compete
          </div>
        </div>
      </Card>

      {/* ── CARD 5 (1 col on mobile, 1 col on desktop): The Modern Edge (Web3 vs Web2) ── */}
      <Card className="reward-panel col-span-1 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="reward-copy p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <Badge tone="neutral" icon="lightning">Modern Edge</Badge>
            <span className="font-mono text-caption text-fg-muted bg-inset border border-line px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
              Web3 vs 2
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default leading-tight">
              Chess That Pays
            </h3>
            <p className="text-body text-fg-muted mt-0.5 sm:mt-1 leading-snug">
              Legacy chess keeps 100%. Web3Chess returns 95% of pot to winners.
            </p>
          </div>
          <div className="pt-0.5 sm:pt-1">
            <Link
              href="/fair-play"
              className="inline-flex items-center gap-1 font-mono text-caption sm:text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Fair-play</span>
              <Icon name="arrow-right" size={12} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Comparative Edge */}
        <div className="reward-demo relative min-h-56 w-full bg-inset/30 border-t border-line/50 p-2 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 border-b border-line/60 font-mono text-caption">
            <span className="text-fg-default font-semibold">Economics</span>
            <span className="text-emerald-700 font-semibold text-caption">95% vs 0%</span>
          </div>

          <div className="space-y-1 sm:space-y-2 my-3">
            <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl bg-surface p-3 border border-line text-caption shadow-2xs">
              <span className="size-4 sm:size-5 shrink-0 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-caption">✕</span>
              <div className="min-w-0">
                <span className="font-semibold text-fg-default block text-caption">Legacy Chess</span>
                <span className="text-fg-muted block text-caption">Zero cash · Paywalls</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-lg sm:rounded-xl bg-emerald-500/[0.06] p-3 border border-emerald-500/30 text-caption shadow-2xs">
              <span className="size-4 sm:size-5 shrink-0 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-caption">✓</span>
              <div className="min-w-0">
                <span className="font-bold text-fg-default block text-caption">Web3Chess</span>
                <span className="text-emerald-700 block text-caption">95% Winner Payout</span>
              </div>
            </div>
          </div>

          <div className="pt-0.5 sm:pt-1 border-t border-line/50 font-mono text-caption text-fg-muted flex items-center justify-between">
            <span>Winner Share:</span>
            <span className="font-bold text-emerald-700">95% Guaranteed</span>
          </div>
        </div>
      </Card>

    </div>
  );
}
