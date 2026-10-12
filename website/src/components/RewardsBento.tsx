"use client";

import Link from "next/link";
import { Icon } from "@/icons";
import { Badge } from "@/components/ui/Badge";
import { LiveSettlementFeed } from "./LiveSettlementFeed";

// ── Modern 2D/3D Tokens for Vault Drop Sphere ──────────────────────────────
function GramToken() {
  return (
    <div
      className="flex size-8.5 items-center justify-center rounded-full bg-gradient-to-br from-[#0098EA] via-[#0088d6] to-[#005fa8] text-white shadow-[0_4px_14px_rgba(0,152,234,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-white/60 transition-transform hover:scale-115"
      title="GRAM"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-4.5" aria-label="GRAM">
        <path
          d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function BtcToken() {
  return (
    <div
      className="flex size-8.5 items-center justify-center rounded-full bg-gradient-to-br from-[#F7931A] via-[#f59e0b] to-[#b45309] text-white shadow-[0_4px_14px_rgba(247,147,26,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-white/60 transition-transform hover:scale-115"
      title="Bitcoin"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-4.5" aria-label="BTC">
        <path
          d="M22.5 13.6c.3-2.1-1.3-3.2-3.5-4l.7-2.9-1.8-.4-.7 2.8c-.5-.1-1-.2-1.5-.3l.7-2.9-1.8-.4-.7 2.9c-.4-.1-.8-.2-1.2-.3l-2.4-.6-.5 1.9s1.3.3 1.3.3c.7.2.8.7.8 1.1l-.8 3.2c.1 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.6-.8.4 0 0-1.3-.3-1.3-.3l-.9 2.1 2.3.6c.4.1.9.2 1.3.3l-.7 2.9 1.8.4.7-2.8c.5.1 1 .2 1.5.3l-.7 2.9 1.8.4.7-2.9c3.1.6 5.4.3 6.4-2.4.8-2.2 0-3.5-1.6-4.3 1.1-.3 2-1 2.2-2.4zm-4 5.3c-.6 2.3-4.4 1.1-5.6.8l1-4c1.2.3 5.2.9 4.6 3.2zm.5-5.4c-.5 2.1-3.7 1-4.7.8l.9-3.7c1 .2 4.3.7 3.8 2.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function UsdtToken() {
  return (
    <div
      className="flex size-8.5 items-center justify-center rounded-full bg-gradient-to-br from-[#26A17B] via-[#10b981] to-[#047857] text-white shadow-[0_4px_14px_rgba(38,161,123,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-white/60 transition-transform hover:scale-115"
      title="Tether USDT"
    >
      <svg viewBox="0 0 32 32" fill="none" className="size-4.5" aria-label="USDT">
        <path
          d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z"
          fill="white"
        />
      </svg>
    </div>
  );
}

function KingChessToken() {
  return (
    <div
      className="flex size-8.5 items-center justify-center rounded-full bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#581c87] text-amber-300 shadow-[0_4px_14px_rgba(139,92,246,0.5),inset_0_1px_1.5px_rgba(255,255,255,0.8)] border border-amber-300/50 transition-transform hover:scale-115"
      title="Chess King"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4.5 text-amber-300"
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* ── CARD 1 (2 cols on lg): Live Real-Time Arena Settlements ── */}
      <div className="md:col-span-2 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="accent" icon="lightning">Live Settlements</Badge>
            <span className="font-mono text-caption text-emerald-700 font-semibold flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time on-chain
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Instant 95% Winner Payouts
            </h3>
            <p className="text-body-sm text-fg-muted mt-1 max-w-[55ch]">
              Both players lock equal USDT before move 1. The moment checkmate or resignation lands, 95% of the pot credits instantly to the winner’s balance.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore payout architecture</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Live Animated Settlement Terminal (UNDER TEXT) */}
        <div className="relative h-56 w-full overflow-hidden bg-inset/30 border-t border-line/50 p-3.5 flex flex-col justify-between">
          <LiveSettlementFeed />
        </div>
      </div>

      {/* ── CARD 2 (1 col): Mystery Vault Drops with 3D Spheric Orbits ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="accent" icon="gift">Mystery Vaults</Badge>
            <span className="font-mono text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Daily Drops
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Win up to 1,000 GRAM
            </h3>
            <p className="text-body-sm text-fg-muted mt-1">
              Every match earns XP. Unbox King, Queen, and Knight chests with chances to win GRAM prizes, 2× XP boosts, and rare 3D pieces.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Explore Mystery Boxes</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — 3D Spheric Crypto Vault (UNDER TEXT) */}
        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-b from-inset/30 via-surface/40 to-amber-500/[0.05] border-t border-line/50 flex items-center justify-center select-none">
          {/* Ambient lighting glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="size-32 rounded-full bg-amber-400/15 blur-2xl animate-pulse" />
          </div>

          {/* Dotted elliptical orbital guide paths */}
          <svg className="absolute pointer-events-none" width="200" height="100" viewBox="0 0 200 100">
            <ellipse cx="100" cy="50" rx="70" ry="24" fill="none" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="1.2" strokeDasharray="3 3" />
            <ellipse cx="100" cy="50" rx="56" ry="18" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3 3" />
          </svg>

          {/* Central 3D Spheric Vault Core */}
          <div className="relative z-10 flex size-18 items-center justify-center rounded-full shadow-[inset_-5px_-5px_14px_rgba(0,0,0,0.55),inset_2px_2px_8px_rgba(255,255,255,0.9),0_12px_28px_rgba(245,158,11,0.35)] bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#fef08a_15%,#f59e0b_50%,#b45309_80%,#451a03_100%)] border border-amber-200/60 transition-transform duration-300 hover:scale-105">
            <div className="flex flex-col items-center justify-center text-amber-950">
              <svg viewBox="0 0 24 24" className="size-6 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] stroke-current fill-current/25" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v3M10.5 3.5h3" />
                <path d="M7 8c1.2 1 2 1.5 5 1.5s3.8-.5 5-1.5c.8 3-1 5.5-1.5 7.5h-7C8 13.5 6.2 11 7 8z" />
                <path d="M6.5 17h11M5.5 20h13" />
              </svg>
            </div>
          </div>

          {/* 4 Orbiting 3D Tokens (Trigonometric smooth 3D paths, zero distortion) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* GRAM — Orbit 1, angle 0 */}
            <div
              className="absolute pointer-events-auto"
              style={{ animation: 'vault-orbit-cw 12s linear infinite' }}
            >
              <GramToken />
            </div>

            {/* BTC — Orbit 1, angle 180 (opposite GRAM) */}
            <div
              className="absolute pointer-events-auto"
              style={{ animation: 'vault-orbit-cw 12s linear infinite -6s' }}
            >
              <BtcToken />
            </div>

            {/* USDT — Orbit 2 (counter-orbit), angle 0 */}
            <div
              className="absolute pointer-events-auto"
              style={{ animation: 'vault-orbit-ccw 10s linear infinite' }}
            >
              <UsdtToken />
            </div>

            {/* KING CHESS — Orbit 2 (counter-orbit), angle 180 (opposite USDT) */}
            <div
              className="absolute pointer-events-auto"
              style={{ animation: 'vault-orbit-ccw 10s linear infinite -5s' }}
            >
              <KingChessToken />
            </div>
          </div>

          {/* Integrated Asset Legend Pill */}
          <div className="absolute bottom-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold text-fg-muted bg-surface/90 px-3 py-0.5 rounded-full border border-line shadow-2xs backdrop-blur-xs">
            <span className="text-[#0098EA] flex items-center gap-1 font-bold"><span className="size-1.5 rounded-full bg-[#0098EA]" />GRAM</span>
            <span className="text-line">·</span>
            <span className="text-[#F7931A] flex items-center gap-1 font-bold"><span className="size-1.5 rounded-full bg-[#F7931A]" />BTC</span>
            <span className="text-line">·</span>
            <span className="text-[#26A17B] flex items-center gap-1 font-bold"><span className="size-1.5 rounded-full bg-[#26A17B]" />USDT</span>
            <span className="text-line">·</span>
            <span className="text-[#8b5cf6] flex items-center gap-1 font-bold"><span className="size-1.5 rounded-full bg-[#8b5cf6]" />KING</span>
          </div>
        </div>
      </div>

      {/* ── CARD 3 (1 col): Stakes Flexibility ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="accent" icon="lightning">Stake Flexibility</Badge>
            <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              From $1
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Play at Any Stake Level
            </h3>
            <p className="text-body-sm text-fg-muted mt-1">
              From $1 micro-duels up to $500 high-roller classics. Choose your format, deposit equal USDT, and take 95% of the pot.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/wagers"
              className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>View all stake tiers</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — 3-Tier Arena Lobby Showcase (UNDER TEXT) */}
        <div className="relative h-48 w-full overflow-hidden bg-inset/30 border-t border-line/50 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 text-[11px] font-mono text-fg-muted">
            <span className="text-fg-default font-semibold">Arena Stake Ladder</span>
            <span className="text-emerald-700 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px]">Min $1 · Max $500</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 w-full my-auto">
            <div className="rounded-xl border border-line bg-surface p-2 text-center shadow-2xs">
              <span className="block font-mono font-bold text-fg-default text-[13px]">$5</span>
              <span className="block font-mono text-[9px] text-fg-muted mt-0.5">Blitz 3+2</span>
              <span className="block font-mono text-[10px] font-bold text-emerald-600 mt-1">→ $9.50</span>
            </div>
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/[0.04] p-2 text-center shadow-xs relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-500 text-white uppercase font-mono tracking-wider">
                Popular
              </span>
              <span className="block font-mono font-bold text-emerald-700 text-[13px]">$25</span>
              <span className="block font-mono text-[9px] text-fg-muted mt-0.5">Rapid 10+0</span>
              <span className="block font-mono text-[10px] font-bold text-emerald-600 mt-1">→ $47.50</span>
            </div>
            <div className="rounded-xl border border-line bg-surface p-2 text-center shadow-2xs">
              <span className="block font-mono font-bold text-fg-default text-[13px]">$100</span>
              <span className="block font-mono text-[9px] text-fg-muted mt-0.5">Classic 30+0</span>
              <span className="block font-mono text-[10px] font-bold text-emerald-600 mt-1">→ $190</span>
            </div>
          </div>

          {/* Visual Stake Ladder Rail */}
          <div className="w-full pt-1.5 border-t border-line/50 flex items-center justify-between font-mono text-[9px] text-fg-muted">
            <span>$1 Micro</span>
            <div className="h-1 flex-1 mx-2.5 rounded-full bg-line relative">
              <div className="h-full bg-emerald-500 rounded-full w-2/5" />
              <div className="size-2.5 rounded-full bg-emerald-600 absolute top-1/2 -translate-y-1/2 left-[40%] border border-surface shadow-2xs" />
            </div>
            <span>$500 Whale</span>
          </div>
        </div>
      </div>

      {/* ── CARD 4 (1 col): Affiliate Growth Engine ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="accent" icon="users-three">Affiliate Engine</Badge>
            <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              2.0% Total
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Earn 2% Lifetime Match Rake
            </h3>
            <p className="text-body-sm text-fg-muted mt-1">
              Invite friends once with your Telegram link. Collect passive USDT commissions across 6 referral tiers every time your network competes.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>How referrals work</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Multi-Tier Affiliate Breakdown (UNDER TEXT) */}
        <div className="relative h-48 w-full bg-inset/30 border-t border-line/50 p-3.5 flex flex-col justify-between font-mono text-[11px]">
          <div className="flex items-center justify-between pb-1.5 border-b border-line/60">
            <span className="text-fg-default font-semibold">Referral Commission</span>
            <span className="text-emerald-700 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">2.0% Total</span>
          </div>

          <div className="space-y-1.5 my-auto">
            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06]">
              <div className="flex items-center gap-2">
                <span className="size-4.5 rounded-full bg-emerald-500 text-white font-bold text-[9px] flex items-center justify-center">1</span>
                <span className="font-semibold text-fg-default text-[11px]">Tier 1 Direct</span>
              </div>
              <span className="font-bold text-emerald-700 text-[12px]">1.0% Rake</span>
            </div>

            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg border border-line bg-surface">
              <div className="flex items-center gap-2">
                <span className="size-4.5 rounded-full bg-inset border border-line text-fg-muted font-bold text-[9px] flex items-center justify-center">2</span>
                <span className="text-fg-muted text-[11px]">Tier 2 Friends</span>
              </div>
              <span className="font-bold text-emerald-700 text-[12px]">0.4% Rake</span>
            </div>

            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg border border-line bg-surface">
              <div className="flex items-center gap-2">
                <span className="size-4.5 rounded-full bg-inset border border-line text-fg-muted font-bold text-[9px] flex items-center justify-center">3–6</span>
                <span className="text-fg-muted text-[11px]">Tiers 3–6 Pool</span>
              </div>
              <span className="font-bold text-emerald-700 text-[12px]">0.6% Rake</span>
            </div>
          </div>

          <div className="pt-1 border-t border-line/50 text-[9px] text-fg-muted text-center">
            Instant on-chain credit whenever referrals compete
          </div>
        </div>
      </div>

      {/* ── CARD 5 (1 col): The Modern Edge (Web3 vs Web2) ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="neutral" icon="lightning">The Modern Edge</Badge>
            <span className="font-mono text-[11px] text-fg-muted bg-inset border border-line px-2 py-0.5 rounded-full">
              Web3 vs Web2
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Chess That Actually Pays
            </h3>
            <p className="text-body-sm text-fg-muted mt-1">
              Traditional chess platforms monetize your attention. Web3Chess rewards your skill with instant on-chain pots and daily GRAM drops.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/fair-play"
              className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Our fair-play promise</span>
              <Icon name="arrow-right" size={14} />
            </Link>
          </div>
        </div>

        {/* Dedicated bottom visual container — Comparative Edge (UNDER TEXT) */}
        <div className="relative h-48 w-full bg-inset/30 border-t border-line/50 p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1.5 border-b border-line/60 font-mono text-[11px]">
            <span className="text-fg-default font-semibold">Platform Economics</span>
            <span className="text-emerald-700 font-semibold text-[10px]">95% vs 0%</span>
          </div>

          <div className="space-y-2 my-auto">
            <div className="flex items-center gap-2.5 rounded-xl bg-surface p-2.5 border border-line text-[11px] shadow-2xs">
              <span className="size-5 shrink-0 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-[10px]">✕</span>
              <div className="min-w-0">
                <span className="font-semibold text-fg-default block truncate">Legacy Chess Platforms</span>
                <span className="text-fg-muted block text-[10px] truncate">Zero prizes · Ads &amp; paywalls</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/[0.06] p-2.5 border border-emerald-500/30 text-[11px] shadow-2xs">
              <span className="size-5 shrink-0 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
              <div className="min-w-0">
                <span className="font-bold text-fg-default block truncate">Web3Chess Arena</span>
                <span className="text-emerald-700 block text-[10px] truncate">95% Winner pot · Instant on-chain</span>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-line/50 font-mono text-[9px] text-fg-muted flex items-center justify-between">
            <span>Winner Payout:</span>
            <span className="font-bold text-emerald-700">95% Guaranteed Pot</span>
          </div>
        </div>
      </div>

    </div>
  );
}
