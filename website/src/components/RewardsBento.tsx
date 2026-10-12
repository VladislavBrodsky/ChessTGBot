"use client";


import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedList } from "@/components/magicui/animated-list";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { Icon } from "@/icons";
import { Badge } from "@/components/ui/Badge";

// ── Live arena feed for the animated notification stream ──────────────────
const LIVE_FEED = [
  {
    id: "f1",
    player: "CryptoMorphy",
    flag: "🇦🇪",
    action: "Won Blitz 3+2 match",
    payout: "+$47.50",
    time: "12s",
    icon: "lightning" as const,
    color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600",
  },
  {
    id: "f2",
    player: "Magnus_TON",
    flag: "🇳🇴",
    action: "Won Rapid 15+10 match",
    payout: "+$190.00",
    time: "34s",
    icon: "trophy" as const,
    color: "bg-blue-500/15 border-blue-500/30 text-blue-600",
  },
  {
    id: "f3",
    player: "ton_tactician",
    flag: "🇯🇵",
    action: "Unboxed King's Vault",
    payout: "+50 TON",
    time: "1m",
    icon: "gift" as const,
    color: "bg-amber-500/15 border-amber-500/30 text-amber-600",
  },
  {
    id: "f4",
    player: "pawn_storm",
    flag: "🇩🇪",
    action: "Won Bullet 1+0 match",
    payout: "+$19.00",
    time: "2m",
    icon: "lightning" as const,
    color: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600",
  },
  {
    id: "f5",
    player: "gm_vlad",
    flag: "🇺🇿",
    action: "Withdrew 150 USDT",
    payout: "✓ On-chain",
    time: "4m",
    icon: "arrow-up-right" as const,
    color: "bg-purple-500/15 border-purple-500/30 text-purple-600",
  },
  {
    id: "f6",
    player: "queen_gambit",
    flag: "🇸🇬",
    action: "Reached 2410 ELO",
    payout: "Grandmaster",
    time: "6m",
    icon: "shield-check" as const,
    color: "bg-blue-500/15 border-blue-500/30 text-blue-600",
  },
  {
    id: "f7",
    player: "chess_whale",
    flag: "🇬🇧",
    action: "Won Classical 60+0",
    payout: "+$475.00",
    time: "8m",
    icon: "trophy" as const,
    color: "bg-amber-500/15 border-amber-500/30 text-amber-600",
  },
];

// ── Stake tier cards for the Marquee background ───────────────────────────
const STAKES = [
  { label: "Micro Duel", stake: "$1", win: "$1.90", format: "Bullet 1+0", color: "text-fg-muted" },
  { label: "Blitz Starter", stake: "$5", win: "$9.50", format: "Blitz 3+2", color: "text-emerald-600" },
  { label: "Popular 🔥", stake: "$10", win: "$19.00", format: "Blitz 5+0", color: "text-emerald-700" },
  { label: "Arena", stake: "$25", win: "$47.50", format: "Rapid 10+0", color: "text-blue-600" },
  { label: "Championship", stake: "$50", win: "$95.00", format: "Rapid 15+10", color: "text-blue-700" },
  { label: "VIP Table 👑", stake: "$100", win: "$190.00", format: "Classical 30+0", color: "text-purple-600" },
  { label: "Elite 💎", stake: "$250", win: "$475.00", format: "Classical 30+0", color: "text-amber-600" },
  { label: "Whales 🐋", stake: "$500", win: "$950.00", format: "Classical 60+0", color: "text-amber-700" },
];

// ── Affiliate tiers ───────────────────────────────────────────────────────
const TIERS = [
  { level: "Tier 1", label: "Direct recruit", rake: "1.0%", bar: "w-full", color: "bg-emerald-500" },
  { level: "Tier 2", label: "Network", rake: "0.4%", bar: "w-2/5", color: "bg-emerald-400" },
  { level: "Tiers 3–6", label: "Deep pool", rake: "0.6%", bar: "w-3/5", color: "bg-emerald-300" },
];




// ── Bento background components ─────────────────────────────────────────

function StakesMarqueeBg() {
  return (
    <Marquee
      pauseOnHover
      className="absolute top-6 [mask-image:linear-gradient(to_top,transparent_35%,#000_90%)]"
    >
      {STAKES.map((s, i) => (
        <figure
          key={i}
          className="relative w-36 cursor-pointer overflow-hidden rounded-xl border border-line/70 bg-surface/80 p-3.5 mx-1.5 backdrop-blur-sm transition-all duration-300 hover:bg-surface hover:border-fg-muted/30 hover:shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold text-[15px] tabular-nums ${s.color}`}>{s.stake}</span>
            <span className="font-mono text-[9px] text-fg-muted bg-inset border border-line px-1.5 py-0.5 rounded-full">{s.format}</span>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] text-fg-muted font-mono">{s.label}</p>
            <p className="font-bold text-emerald-600 text-[13px] tabular-nums">→ {s.win}</p>
          </div>
        </figure>
      ))}
    </Marquee>
  );
}

function LiveFeedBg() {
  return (
    <div className="absolute top-4 right-0 left-0 h-[220px] overflow-hidden [mask-image:linear-gradient(to_top,transparent_10%,#000_90%)]">
      <AnimatedList delay={1800} maxItems={4}>
        {LIVE_FEED.map((item) => (
          <figure
            key={item.id}
            className="relative mx-3 overflow-hidden rounded-xl border border-line bg-surface/90 p-2.5 shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg border ${item.color}`}>
                <Icon name={item.icon} size={14} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[12px] font-semibold text-fg-default">
                    {item.flag} {item.player}
                  </span>
                  <span className="shrink-0 font-mono text-[10px] text-fg-muted">{item.time} ago</span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="truncate text-[11px] text-fg-muted">{item.action}</span>
                  <span className="shrink-0 font-mono font-bold text-emerald-600 text-[12px]">{item.payout}</span>
                </div>
              </div>
            </div>
          </figure>
        ))}
      </AnimatedList>
    </div>
  );
}

function VaultOrbitBg() {
  return (
    <div className="absolute top-0 right-0 left-0 flex h-[200px] items-center justify-center overflow-hidden [mask-image:linear-gradient(to_top,transparent_15%,#000_85%)]">
      <div className="z-10 flex size-10 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 shadow-sm">
        <Icon name="gift" size={20} />
      </div>
      <OrbitingCircles radius={40} duration={10} iconSize={24} path>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-sm">💎</span>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-sm">⚡</span>
      </OrbitingCircles>
      <OrbitingCircles radius={62} reverse duration={16} iconSize={24} path>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-sm">👑</span>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-sm">🏆</span>
        <span className="flex size-6 items-center justify-center rounded-full border border-line bg-surface shadow-xs text-sm">🎁</span>
      </OrbitingCircles>
    </div>
  );
}




// ── Card bodies ────────────────────────────────────────────────────────────

function VaultBody() {
  return (
    <div className="space-y-1.5 rounded-xl bg-inset p-3.5 border border-line text-caption font-mono">
      {[
        { dot: "bg-amber-400", name: "King's Dominion", value: "1,000 TON", valueClass: "text-amber-600 font-bold" },
        { dot: "bg-purple-400", name: "Queen's Treasury", value: "Rare 3D Pieces", valueClass: "text-purple-600 font-semibold" },
        { dot: "bg-blue-400",   name: "Knight's Gambit", value: "2× XP Boosters", valueClass: "text-blue-600 font-semibold" },
      ].map((row) => (
        <div key={row.name} className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-fg-default font-sans font-medium">
            <span className={`size-2 shrink-0 rounded-full ${row.dot}`} />
            {row.name}
          </span>
          <span className={`text-[11px] ${row.valueClass}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function AffiliateBody() {
  return (
    <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption">
      {TIERS.map((t) => (
        <div key={t.level}>
          <div className="flex items-center justify-between mb-1 font-mono">
            <span className="text-fg-muted">{t.level} — {t.label}</span>
            <span className="font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">{t.rake}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-inset border border-line overflow-hidden">
            <div className={`h-full rounded-full ${t.bar} ${t.color} transition-all duration-700`} />
          </div>
        </div>
      ))}
      <div className="border-t border-line pt-2.5 flex items-center justify-between font-semibold">
        <span className="font-sans text-fg-default text-[12px]">Total Referral Pool</span>
        <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-full">
          2.0% of every pot
        </span>
      </div>
    </div>
  );
}

function ComparisonBody() {
  return (
    <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption">
      <div className="flex items-start gap-2.5 rounded-lg bg-surface/80 p-2.5 border border-line/60">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 font-bold text-[10px] mt-0.5">✕</span>
        <div className="min-w-0">
          <span className="font-medium text-fg-default text-[12px] block">Legacy Chess</span>
          <span className="text-[11px] text-fg-muted leading-tight block mt-0.5">Zero prizes · Paywalls &amp; ads · No ownership</span>
        </div>
      </div>
      <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/5 p-2.5 border border-emerald-500/20">
        <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 font-bold text-[10px] mt-0.5">✓</span>
        <div className="min-w-0">
          <span className="font-semibold text-emerald-700 text-[12px] block">Web3Chess Arena</span>
          <span className="text-[11px] text-emerald-800/80 leading-tight block mt-0.5">95% Winner pot · Daily TON vaults · 1-tap Telegram</span>
        </div>
      </div>
    </div>
  );
}

function LiveFeedBody() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-inset p-3 border border-line text-caption font-mono">
      <div className="flex items-center gap-1.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-fg-muted text-[11px]">Matches decided</span>
      </div>
      <span className="font-bold text-emerald-600 text-[12px]">
        <NumberTicker value={3840} />+ today
      </span>
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────

export function RewardsBento() {
  return (
    <BentoGrid className="auto-rows-[20rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

      {/* ── Card 1 (2-col): Live arena feed ── */}
      <BentoCard
        name="Live arena activity"
        description="Real players settling on-chain around the clock."
        icon="lightning"
        badge={<Badge tone="accent" icon="lightning">Live Arena</Badge>}
        headerContent={
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-time
          </span>
        }
        className="md:col-span-2 lg:col-span-2"
        background={<LiveFeedBg />}
        href="/how-it-works"
        cta="See how payouts work"
      >
        <LiveFeedBody />
      </BentoCard>

      {/* ── Card 2 (1-col): Mystery Vaults with orbiting circles ── */}
      <BentoCard
        name="Win up to 1,000 TON"
        description="Every match earns XP. Open mystery chests for TON jackpots, 2× XP boosters, and rare 3D pieces."
        badge={<Badge tone="accent" icon="gift">Mystery Vaults</Badge>}
        headerContent={
          <span className="font-mono text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            Daily Drops
          </span>
        }
        className="lg:col-span-1"
        background={<VaultOrbitBg />}
        href="/how-it-works"
        cta="Explore Mystery Boxes"
      >
        <VaultBody />
      </BentoCard>

      {/* ── Card 3 (1-col): Stakes Marquee ── */}
      <BentoCard
        name="Play at any stake level"
        description="From $1 micro-duels to $500 whale classics — 95% of the pot goes to the winner."
        badge={<Badge tone="accent" icon="lightning">95% Winner Payout</Badge>}
        headerContent={
          <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Instant on-chain
          </span>
        }
        className="lg:col-span-1"
        background={<StakesMarqueeBg />}
        href="/wagers"
        cta="See all stake tiers"
      />

      {/* ── Card 4 (1-col): Affiliate engine ── */}
      <BentoCard
        name="Earn 2% lifetime rake"
        description="Share once. Collect passive USDT commissions across 6 referral tiers forever."
        badge={<Badge tone="accent" icon="users-three">Affiliate Engine</Badge>}
        headerContent={
          <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            Passive Rake
          </span>
        }
        className="lg:col-span-1"
        href="/how-it-works"
        cta="How referrals work"
      >
        <AffiliateBody />
      </BentoCard>

      {/* ── Card 5 (1-col): Web3 vs legacy comparison ── */}
      <BentoCard
        name="Chess that actually pays"
        description="Compare how Web3Chess transforms standard chess into a high-reward competitive arena."
        badge={<Badge tone="neutral" icon="lightning">The Modern Edge</Badge>}
        headerContent={
          <span className="font-mono text-[11px] text-fg-muted bg-surface border border-line px-2 py-0.5 rounded-full">
            Web3 vs Web2
          </span>
        }
        className="lg:col-span-1"
        href="/fair-play"
        cta="Our fair-play promise"
      >
        <ComparisonBody />
      </BentoCard>

    </BentoGrid>
  );
}
