import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { AnimatedList } from "@/components/magicui/animated-list";

const liveFeed = [
  {
    id: "live-1",
    player: "@CryptoMorphy",
    action: "Won 3+2 Blitz match",
    payout: "+$47.50 USDT",
    time: "1m ago",
    badge: "Blitz 3+2",
    icon: "lightning" as const,
  },
  {
    id: "live-2",
    player: "@Magnus_TON",
    action: "Won 5+3 Rapid match",
    payout: "+$95.00 USDT",
    time: "3m ago",
    badge: "Rapid 5+3",
    icon: "trophy" as const,
  },
  {
    id: "live-3",
    player: "@ton_tactician",
    action: "Unboxed King’s Vault",
    payout: "+50 TON",
    time: "5m ago",
    badge: "Jackpot Drop",
    icon: "gift" as const,
  },
  {
    id: "live-4",
    player: "@pawn_storm",
    action: "Won 1+0 Bullet match",
    payout: "+$19.00 USDT",
    time: "7m ago",
    badge: "Bullet 1+0",
    icon: "lightning" as const,
  },
  {
    id: "live-5",
    player: "@gm_vlad",
    action: "Confirmed withdrawal",
    payout: "$150.00 USDT",
    time: "11m ago",
    badge: "Telegram Bot",
    icon: "arrow-up-right" as const,
  },
  {
    id: "live-6",
    player: "@queen_gambit",
    action: "Climbed to 2410 ELO",
    payout: "Grandmaster Tier",
    time: "14m ago",
    badge: "Season 1",
    icon: "shield-check" as const,
  },
];

export function ArenaBento() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* ── BENTO 1: Real Crypto PvP Wagers (Hero 2-Col Card) ── */}
      <Card className="flex flex-col justify-between md:col-span-2 p-6 lg:p-8 bg-surface border border-line relative overflow-hidden group">
        <BorderBeam size={320} duration={14} colorFrom="#10b981" colorTo="#059669" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <Badge tone="accent" icon="lightning">
              Real-time PvP Arena
            </Badge>
            <span className="font-mono text-caption text-fg-muted">
              From 1 USDT · 95% Winner Payout
            </span>
          </div>
          <h3 className="text-heading-md font-medium tracking-tight mb-3">
            Real crypto chess with instant Telegram matchmaking
          </h3>
          <p className="text-body text-fg-muted max-w-[55ch] mb-6">
            Put your tactical mind to work. Choose Bullet, Blitz, or Rapid, set your stake, and play rivals worldwide. Both players commit equal USDT — the winner claims 95% of the combined pot directly to their platform balance.
          </p>
        </div>

        {/* Live Match Settlement Visualization with NumberTicker */}
        <div className="relative z-10 rounded-2xl border border-line bg-inset p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 mb-3 text-caption text-fg-muted">
            <span className="flex items-center gap-1.5 font-semibold text-fg-default">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Blitz Match 3+2
            </span>
            <span className="font-mono">Match ID #48291 · Decided</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            <div className="p-2 sm:p-3 rounded-xl bg-surface border border-line">
              <span className="text-overline uppercase text-fg-muted block mb-1">Player Stake</span>
              <span className="poster text-heading-sm">
                <NumberTicker value={25} prefix="$" decimalPlaces={2} />
              </span>
              <span className="text-caption text-fg-muted block">Equal stake</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-surface border border-line">
              <span className="text-overline uppercase text-fg-muted block mb-1">Combined Pot</span>
              <span className="poster text-heading-sm">
                <NumberTicker value={50} prefix="$" decimalPlaces={2} />
              </span>
              <span className="text-caption text-fg-muted block">Locked in pot</span>
            </div>
            <div className="p-2 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950">
              <span className="text-overline uppercase font-bold text-emerald-700 block mb-1">Winner Payout</span>
              <span className="poster text-heading-sm text-emerald-600">
                <NumberTicker value={47.5} prefix="+$" decimalPlaces={2} />
              </span>
              <span className="text-caption font-semibold text-emerald-700 block">95% instant payout</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── BENTO 2: Mystery Boxes with 1,000 TON Jackpots & Orbiting Circles ── */}
      <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
        <BorderBeam size={240} duration={10} colorFrom="#f59e0b" colorTo="#d97706" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge tone="accent" icon="gift">
              Mystery Vaults
            </Badge>
            <span className="font-mono text-caption text-fg-muted">Daily Drops</span>
          </div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-2">
            Win up to 1,000 TON in Mystery Boxes
          </h3>
          <p className="text-body-sm text-fg-muted mb-3">
            Turn your earned XP into real rewards. Unlock mystery chests with chances to unbox TON prizes, 2× XP boosts, and exclusive 3D board pieces.
          </p>

          {/* Orbiting Vault Reward Visualization */}
          <div className="relative my-3 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-inset border border-line">
            <div className="z-10 flex size-9 items-center justify-center rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 shadow-xs">
              <Icon name="gift" size={18} />
            </div>

            <OrbitingCircles radius={38} duration={12} iconSize={22} path>
              <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-[11px]">
                💎
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-[11px]">
                ⚡
              </span>
            </OrbitingCircles>

            <OrbitingCircles radius={56} reverse duration={18} iconSize={22} path>
              <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-[11px]">
                👑
              </span>
              <span className="flex size-5 items-center justify-center rounded-full bg-surface border border-line shadow-xs text-[11px]">
                🏆
              </span>
            </OrbitingCircles>
          </div>
        </div>

        {/* Vault Tier Badges with NumberTicker */}
        <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption relative z-10">
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" />
              King’s Dominion Chest
            </span>
            <span className="font-bold text-fg-default">
              <NumberTicker value={1000} suffix=" TON" /> Jackpot
            </span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-yellow-400" />
              Queen’s Treasury Chest
            </span>
            <span className="font-bold text-fg-default">1-Month Premium + Drops</span>
          </div>
          <div className="flex items-center justify-between font-medium">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-slate-400" />
              Knight’s Gambit Chest
            </span>
            <span className="font-bold text-fg-default">2× XP Boosts &amp; Skins</span>
          </div>
        </div>
      </Card>

      {/* ── BENTO 3: Live Global Leaderboards & Tournaments ── */}
      <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge tone="neutral" icon="trophy">
              Global ELO Rankings
            </Badge>
            <span className="font-mono text-caption text-fg-muted">Season 1</span>
          </div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-2">
            Climb the leaderboard. Claim weekly prizes
          </h3>
          <p className="text-body-sm text-fg-muted mb-5">
            Every rated victory builds your ELO ranking and pushes you up the global ladder. Grandmasters and top seasonal performers earn exclusive tournament invitations and prize distributions.
          </p>
        </div>

        {/* Leaderboard Micro Ticker */}
        <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption font-mono">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-fg-default">#1 GM_Morphy · 2480 ELO</span>
            <span className="font-bold text-emerald-600">
              <NumberTicker value={2450} prefix="+$" suffix=" USDT" />
            </span>
          </div>
          <div className="flex items-center justify-between text-fg-muted">
            <span>#2 Magnus_99 · 2415 ELO</span>
            <span className="font-semibold text-fg-default">
              <NumberTicker value={1890} prefix="+$" suffix=" USDT" />
            </span>
          </div>
          <div className="flex items-center justify-between text-fg-muted">
            <span>#3 PawnStorm · 2380 ELO</span>
            <span className="font-semibold text-fg-default">
              <NumberTicker value={1240} prefix="+$" suffix=" USDT" />
            </span>
          </div>
        </div>
      </Card>

      {/* ── BENTO 4: 6-Tier Referral Affiliate Engine ── */}
      <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge tone="accent" icon="users-three">
              Affiliate Engine
            </Badge>
            <span className="font-mono text-caption text-fg-muted">Passive Crypto</span>
          </div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-2">
            Earn up to 2% lifetime match rake
          </h3>
          <p className="text-body-sm text-fg-muted mb-5">
            Share your personal invite link once and earn lifetime commissions across 6 referral tiers. Every time your network competes, you receive instant USDT cuts deposited directly to your balance.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-inset p-3.5 border border-line text-caption">
          <div className="space-y-0.5">
            <span className="font-semibold text-fg-default block">6 Referral Levels</span>
            <span className="text-fg-muted text-[13px]">Down to your 6th recruit tier</span>
          </div>
          <span className="poster text-stat text-emerald-600">
            <NumberTicker value={2} suffix="%" />
          </span>
        </div>
      </Card>

      {/* ── BENTO 5: 100-Level Academy & Stockfish AI ── */}
      <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <Badge tone="neutral" icon="graduation-cap">
              Tactics Academy
            </Badge>
            <span className="font-mono text-caption text-fg-muted">
              <NumberTicker value={100} /> Levels Free
            </span>
          </div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-2">
            100 tactical levels and Stockfish AI
          </h3>
          <p className="text-body-sm text-fg-muted mb-5">
            Sharpen your openings, forks, pins, and endgame conversions with unlimited free A.I. practice. Train with deep engine analysis before staking a single dollar in real-money PvP.
          </p>
        </div>

        <Link
          href="/academy"
          className="inline-flex items-center justify-between rounded-xl bg-inset p-3.5 border border-line text-caption font-semibold text-fg-default hover:bg-canvas transition-colors"
        >
          <span>Explore Academy tracks</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      </Card>

      {/* ── BENTO 6: Live Arena Activity & Instant Payouts with AnimatedList ── */}
      <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
        <BorderBeam size={240} duration={12} colorFrom="#10b981" colorTo="#3b82f6" />
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge tone="accent" icon="lightning">
              Live Arena Activity
            </Badge>
            <span className="flex items-center gap-1.5 font-mono text-caption text-emerald-600 font-semibold">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </span>
          </div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-1.5">
            Real players. Instant on-chain payouts
          </h3>
          <p className="text-body-sm text-fg-muted mb-3">
            Live matches finishing, pots settled, and mystery chests unboxed around the clock.
          </p>
        </div>

        {/* Live Event Stream via AnimatedList */}
        <div className="relative my-1 w-full h-[180px] overflow-hidden">
          <AnimatedList delay={2400} maxItems={3}>
            {liveFeed.map((item) => (
              <figure
                key={item.id}
                className="relative mx-auto w-full overflow-hidden rounded-xl border border-line bg-inset p-2.5 transition-all duration-200 hover:border-fg-muted/40 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
                    <Icon name={item.icon} size={15} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between text-caption gap-2">
                      <span className="font-semibold text-fg-default truncate text-[13px]">{item.player}</span>
                      <span className="font-mono text-[11px] text-fg-muted shrink-0">{item.time}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] gap-2 mt-0.5">
                      <span className="text-fg-muted truncate">{item.action}</span>
                      <span className="font-bold text-emerald-600 shrink-0 font-mono text-[13px]">{item.payout}</span>
                    </div>
                  </div>
                </div>
              </figure>
            ))}
          </AnimatedList>
          {/* Bottom gradient fade for infinite stream illusion */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface to-transparent" />
        </div>

        <div className="relative z-10 w-full pt-2.5 border-t border-line text-caption text-fg-muted flex items-center justify-between font-mono">
          <span>95% winner pot</span>
          <span className="text-emerald-600 font-semibold">Decided instantly</span>
        </div>
      </Card>
    </div>
  );
}
