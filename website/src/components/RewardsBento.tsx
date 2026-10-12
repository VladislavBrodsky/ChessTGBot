"use client";

import Link from "next/link";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedList } from "@/components/magicui/animated-list";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { Icon } from "@/icons";
import { Badge } from "@/components/ui/Badge";

// ── Real Live Settlement Feed ─────────────────────────────────────────────
const LIVE_SETTLEMENTS = [
  {
    id: "s1",
    player: "CryptoMorphy",
    flag: "🇦🇪",
    action: "Won Blitz 3+2",
    payout: "+$47.50",
    time: "14s ago",
    icon: "lightning" as const,
    color: "text-emerald-600 bg-emerald-500/15 border-emerald-500/30",
  },
  {
    id: "s2",
    player: "Magnus_TON",
    flag: "🇳🇴",
    action: "Won Rapid 15+10",
    payout: "+$190.00",
    time: "38s ago",
    icon: "trophy" as const,
    color: "text-blue-600 bg-blue-500/15 border-blue-500/30",
  },
  {
    id: "s3",
    player: "ton_tactician",
    flag: "🇯🇵",
    action: "Unboxed King's Vault",
    payout: "+50 TON",
    time: "1m ago",
    icon: "gift" as const,
    color: "text-amber-600 bg-amber-500/15 border-amber-500/30",
  },
  {
    id: "s4",
    player: "pawn_storm",
    flag: "🇩🇪",
    action: "Won Bullet 1+0",
    payout: "+$19.00",
    time: "2m ago",
    icon: "lightning" as const,
    color: "text-emerald-600 bg-emerald-500/15 border-emerald-500/30",
  },
  {
    id: "s5",
    player: "gm_vlad",
    flag: "🇺🇿",
    action: "Withdrew USDT",
    payout: "✓ On-Chain",
    time: "3m ago",
    icon: "arrow-up-right" as const,
    color: "text-purple-600 bg-purple-500/15 border-purple-500/30",
  },
];

// ── Stake Tiers for Marquee ───────────────────────────────────────────────
const STAKE_PILLS = [
  { stake: "$1",  format: "Bullet 1+0",   win: "$1.90",  tier: "Micro" },
  { stake: "$5",  format: "Blitz 3+2",    win: "$9.50",  tier: "Starter" },
  { stake: "$10", format: "Blitz 5+0",    win: "$19.00", tier: "Popular 🔥" },
  { stake: "$25", format: "Rapid 10+0",   win: "$47.50", tier: "Active" },
  { stake: "$50", format: "Rapid 15+10",  win: "$95.00", tier: "Championship" },
  { stake: "$100",format: "Classic 30+0", win: "$190",   tier: "VIP Table 👑" },
  { stake: "$250",format: "Classic 30+0", win: "$475",   tier: "Elite 💎" },
  { stake: "$500",format: "Classic 60+0", win: "$950",   tier: "Whale 🐋" },
];

export function RewardsBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* ── CARD 1 (2 cols on lg): Live Real-Time Arena Settlements ── */}
      <div className="md:col-span-2 rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top visual container — NO collisions */}
        <div className="relative h-44 w-full overflow-hidden bg-inset/30 border-b border-line/40 p-3 [mask-image:linear-gradient(to_bottom,#000_75%,transparent_100%)]">
          <AnimatedList delay={2000} maxItems={2}>
            {LIVE_SETTLEMENTS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-2xs mb-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                    <Icon name={item.icon} size={14} />
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold text-fg-default text-[12px] truncate">
                      {item.flag} {item.player} · <span className="font-normal text-fg-muted">{item.action}</span>
                    </span>
                    <span className="block text-[10px] text-fg-muted font-mono">{item.time}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 font-mono font-bold text-emerald-600 text-[13px]">
                  {item.payout}
                </div>
              </div>
            ))}
          </AnimatedList>
        </div>

        {/* Dedicated bottom content container */}
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
      </div>

      {/* ── CARD 2 (1 col): Mystery Vault Drops with Orbiting Circles ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top visual container */}
        <div className="relative h-44 w-full overflow-hidden bg-inset/30 border-b border-line/40 flex items-center justify-center">
          <div className="z-10 flex size-10 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 shadow-xs">
            <Icon name="gift" size={20} />
          </div>
          <OrbitingCircles radius={36} duration={12} iconSize={20} path>
            <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-xs">💎</span>
            <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-xs">⚡</span>
          </OrbitingCircles>
          <OrbitingCircles radius={58} reverse duration={18} iconSize={20} path>
            <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-xs">👑</span>
            <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-xs">🏆</span>
          </OrbitingCircles>
        </div>

        {/* Dedicated bottom content container */}
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone="accent" icon="gift">Mystery Vaults</Badge>
            <span className="font-mono text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Daily Drops
            </span>
          </div>
          <div>
            <h3 className="text-heading-sm font-medium tracking-tight text-fg-default">
              Win up to 1,000 TON
            </h3>
            <p className="text-body-sm text-fg-muted mt-1">
              Every match earns XP. Unbox King, Queen, and Knight chests with chances to win TON prizes, 2× XP boosts, and rare 3D pieces.
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
      </div>

      {/* ── CARD 3 (1 col): Stakes Marquee ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top visual container */}
        <div className="relative h-44 w-full overflow-hidden bg-inset/30 border-b border-line/40 flex items-center [mask-image:linear-gradient(to_right,transparent_0%,#000_15%,#000_85%,transparent_100%)]">
          <Marquee pauseOnHover className="[--duration:24s]">
            {STAKE_PILLS.map((p, idx) => (
              <div
                key={idx}
                className="w-28 shrink-0 rounded-xl border border-line bg-surface p-2.5 mx-1.5 shadow-2xs text-center"
              >
                <span className="block font-bold text-fg-default text-[15px] font-mono">{p.stake}</span>
                <span className="block text-[10px] text-fg-muted font-mono mt-0.5">{p.format}</span>
                <span className="block text-[11px] font-bold text-emerald-600 font-mono mt-1">→ {p.win}</span>
              </div>
            ))}
          </Marquee>
        </div>

        {/* Dedicated bottom content container */}
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
      </div>

      {/* ── CARD 4 (1 col): Affiliate Growth Engine ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top visual container */}
        <div className="relative h-44 w-full bg-inset/30 border-b border-line/40 p-4 flex flex-col justify-center space-y-2 font-mono text-[11px]">
          <div>
            <div className="flex justify-between mb-1 text-fg-muted">
              <span>Tier 1 Direct</span>
              <span className="font-bold text-emerald-700">1.0%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full w-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-fg-muted">
              <span>Tier 2 Network</span>
              <span className="font-bold text-emerald-700">0.4%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full w-2/5" />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1 text-fg-muted">
              <span>Tiers 3–6 Pool</span>
              <span className="font-bold text-emerald-700">0.6%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full bg-emerald-300 rounded-full w-3/5" />
            </div>
          </div>
        </div>

        {/* Dedicated bottom content container */}
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
      </div>

      {/* ── CARD 5 (1 col): The Modern Edge (Web3 vs Web2) ── */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-xs flex flex-col justify-between transition-all hover:border-fg-muted/40 hover:shadow-sm">
        {/* Dedicated top visual container */}
        <div className="relative h-44 w-full bg-inset/30 border-b border-line/40 p-3.5 flex flex-col justify-center space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-surface/80 p-2 border border-line text-[11px]">
            <span className="size-4 shrink-0 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold text-[10px]">✕</span>
            <div className="min-w-0">
              <span className="font-semibold text-fg-default block truncate">Legacy Chess Apps</span>
              <span className="text-fg-muted block text-[10px] truncate">Zero prizes · Ads &amp; paywalls</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 p-2 border border-emerald-500/20 text-[11px]">
            <span className="size-4 shrink-0 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-[10px]">✓</span>
            <div className="min-w-0">
              <span className="font-bold text-emerald-900 block truncate">Web3Chess Arena</span>
              <span className="text-emerald-700 block text-[10px] truncate">95% Winner pot · 1-tap Telegram</span>
            </div>
          </div>
        </div>

        {/* Dedicated bottom content container */}
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
              Traditional chess platforms monetize your attention. Web3Chess rewards your skill with instant on-chain pots and daily TON drops.
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
      </div>

    </div>
  );
}
