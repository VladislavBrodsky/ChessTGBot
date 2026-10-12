import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { ChessSculpture } from "@/components/ChessSculpture";
import { BlogCard } from "@/components/BlogCard";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/icons";
import { TextAnimate } from "@/components/magicui/text-animate";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { IconCloud } from "@/components/magicui/icon-cloud";
import { Globe } from "@/components/magicui/globe";
import { AnimatedList } from "@/components/magicui/animated-list";
import { UsdtIcon } from "@/components/UsdtIcon";
import { home } from "@/content/home";
import { getPublishedPosts } from "@/content/blog";
import { SITE, SETTLEMENT } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Play Chess & Win Real Crypto in Telegram | Web3Chess",
  SITE.description,
  "",
);

// Re-render regularly so newly scheduled articles reach the home page on time.
export const revalidate = 600;

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/brand/w3chess-avatar.png`,
        sameAs: [SITE.telegramChannel, SITE.telegramChat],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: "en",
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "VideoGame",
        name: SITE.name,
        url: SITE.url,
        genre: "Chess",
        gamePlatform: "Telegram",
        description: SITE.description,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "FAQPage",
        mainEntity: home.faq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
  return (
    <div id="top">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
      />
      <Nav />
      <main id="main" className="home-main">
        <section className="shell-wide hero-section" aria-labelledby="home-title">
          <div className="hero-copy">
            <div className="hero-intro">
              <Badge tone="accent" icon="telegram-logo">Live PvP Arena · Real Crypto Stakes</Badge>
              <h1 id="home-title" className="poster hero-title">
                <TextAnimate animation="blurInUp" by="word">
                  Play chess
                </TextAnimate>
                <br />
                <span className="hero-emphasis">
                  <TextAnimate animation="blurInUp" by="word" delay={0.12}>
                    Win real crypto
                  </TextAnimate>
                </span>
              </h1>
              <p className="hero-lead max-w-[42ch] text-fg-muted">
                Challenge rivals worldwide inside Telegram. Stake USDT, outplay your opponent, and take 95% of the pot. Free A.I. practice, 100-level Academy, and Mystery Boxes with up to 1,000 TON in prizes.
              </p>
            </div>
            <div className="hero-details space-y-4">
              <div className="hero-actions flex flex-wrap gap-2.5">
                <PlayButton size="lg" pulsating />
                <ButtonLink
                  href="/how-it-works"
                  variant="ghost"
                >
                  See how it works
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>

              {/* ── MAGIC UI AVATAR CIRCLES: Real-time Social Proof ── */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <AvatarCircles
                  avatarUrls={[
                    { imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80", name: "Grandmaster Anna" },
                    { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80", name: "Blitz King Dave" },
                    { imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&auto=format&fit=crop&q=80", name: "Tactics Pro Sarah" },
                    { imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80", name: "Pawn Hunter Leo" },
                  ]}
                  numPeople={3840}
                  size="sm"
                />
                <div className="text-caption font-medium text-fg-muted flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-fg-default">3,840+</span> active grandmasters
                </div>
              </div>

              <div className="hero-support space-y-2 text-caption text-fg-muted">
                <p className="flex items-center gap-2">
                  <Icon name="lightning" size={16} className="shrink-0 text-amber-500" />
                  Instant on-chain TON payouts · No download required
                </p>
                <p>18+ wager matches · Over $150,000+ distributed to winners · You can lose your stake.</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <ChessSculpture />
          </div>
        </section>

        {/* ── MAGIC UI MARQUEE: Live Crypto Match Wins & Vault Drops ── */}
        <section className="shell-wide my-4" aria-label="Live PvP match activity">
          <div className="rounded-2xl border border-line bg-surface/75 py-2.5 px-3">
            <Marquee duration={35} pauseOnHover>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600">+$47.50 USDT</strong> GM_Morphy won 3+2 Blitz duel
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <strong>1,000 TON</strong> King’s Dominion Mystery Jackpot unlocked
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600">+$95.00 USDT</strong> Magnus_99 won 5+3 Rapid table
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-blue-500" />
                <strong>6-Level Affiliate</strong> Earn up to 2% lifetime match rake
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-purple-500" />
                <strong>Tactics Academy</strong> 100 free levels &amp; Stockfish AI
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-inset px-3 py-1 font-mono text-caption text-fg-default border border-line">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600">+$190.00 USDT</strong> Kasparov_X won 10+0 Classical match
              </span>
            </Marquee>
          </div>
        </section>

        <section id="rewards" className="shell-wide home-section" aria-labelledby="rewards-heading">
          <div className="section-index">
            <span>01 / Why players choose Web3Chess</span>
            <span>Real rewards · Zero house edge</span>
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="rewards-heading" className="editorial-title">
                Turn your chess rating into real crypto
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                Traditional chess pays you in pixels and points. Web3Chess rewards every tactical win with instant USDT payouts, 1,000 TON mystery jackpots, and 6-tier passive match rake.
              </p>
            </div>
            <ButtonLink href="/how-it-works" variant="secondary">
              Explore game ecosystem
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* ── CARD 1: 1,000 TON Mystery Jackpots & Vaults ── */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <BorderBeam size={260} duration={12} colorFrom="#f59e0b" colorTo="#d97706" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge tone="accent" icon="gift">
                    Mystery Vaults
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted">Daily Drops</span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Win up to 1,000 TON in Mystery Boxes
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Every match earns XP. Open Knight, Queen, and King mystery chests with chances to unbox massive TON prizes, 2× XP boosters, and rare 3D pieces.
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption font-mono">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-fg-default font-sans font-medium">
                    <span className="size-2 rounded-full bg-amber-400" />
                    King’s Dominion
                  </span>
                  <span className="font-bold text-amber-600">
                    <NumberTicker value={1000} suffix=" TON" /> Jackpot
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-fg-default font-sans font-medium">
                    <span className="size-2 rounded-full bg-yellow-400" />
                    Queen’s Treasury
                  </span>
                  <span className="font-semibold text-fg-default">Premium + Drops</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-fg-default font-sans font-medium">
                    <span className="size-2 rounded-full bg-slate-400" />
                    Knight’s Gambit
                  </span>
                  <span className="font-semibold text-fg-default">2× XP &amp; Skins</span>
                </div>
              </div>
            </Card>

            {/* ── CARD 2: 6-Tier Viral Affiliate Growth Engine ── */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <BorderBeam size={260} duration={14} colorFrom="#10b981" colorTo="#3b82f6" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge tone="accent" icon="users-three">
                    Affiliate Engine
                  </Badge>
                  <span className="font-mono text-caption text-emerald-600 font-semibold">
                    Passive Crypto
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Earn up to 2% lifetime match rake
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Invite friends to Telegram matches once. Receive lifetime USDT commissions across 6 referral tiers every single time your network competes.
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-fg-muted">Tier 1 Direct Recruits</span>
                  <span className="font-bold text-emerald-600">1.0% Match Rake</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-fg-muted">Tier 2 Sub-Recruits</span>
                  <span className="font-bold text-emerald-600">0.4% Match Rake</span>
                </div>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-fg-muted">Tiers 3–6 Extended</span>
                  <span className="font-bold text-emerald-600">0.6% Match Rake</span>
                </div>
                <div className="border-t border-line pt-2 flex items-center justify-between font-semibold text-fg-default">
                  <span>Total Affiliate Pool</span>
                  <span className="poster text-heading-xs text-emerald-600">2.0% of every pot</span>
                </div>
              </div>
            </Card>

            {/* ── CARD 3: Web2 vs Web3Chess (Conversion Hook) ── */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group md:col-span-2 lg:col-span-1">
              <BorderBeam size={260} duration={10} colorFrom="#8b5cf6" colorTo="#ec4899" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <Badge tone="neutral" icon="lightning">
                    The Modern Edge
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted">Web3 vs Web2</span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Play chess for real crypto rewards
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Compare how Web3Chess transforms standard online chess into a high-reward competitive arena:
                </p>
              </div>

              <div className="space-y-2 rounded-xl bg-inset p-3.5 border border-line text-caption">
                <div className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                  <span className="text-fg-muted">
                    <strong className="text-fg-default font-normal">Legacy Chess:</strong> Zero monetary prizes for casual wins · Monthly subscription paywalls · Intrusive banner ads
                  </span>
                </div>
                <div className="flex items-start gap-2 border-t border-line pt-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="text-fg-muted">
                    <strong className="text-emerald-700 font-semibold">Web3Chess Arena:</strong> 95% instant cashout · One-tap Telegram launch · Daily TON jackpots · 100 free tactics levels
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section
          className="shell-wide facts-section"
          aria-label="Web3Chess at a glance"
        >
          <Card>
            <dl className="facts-grid">
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Winner pot payout</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    <NumberTicker value={SETTLEMENT.winnerPercent} suffix="%" />
                  </span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Starting stake</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    <NumberTicker value={1} />
                  </span>
                  <span className="text-label font-semibold">USDT</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Top mystery prize</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    <NumberTicker value={1000} />
                  </span>
                  <span className="text-label font-semibold">TON</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Tactics Academy &amp; AI</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    <NumberTicker value={100} />
                  </span>
                  <span className="text-label font-semibold">Levels</span>
                </dd>
              </div>
            </dl>
            <div className="facts-summary">
              <p className="text-caption text-fg-muted">
                Combined pot: {SETTLEMENT.winnerPercent}% winner ·{" "}
                {SETTLEMENT.platformFeePercent}% platform fee ·{" "}
                {SETTLEMENT.referralFeePercent}% referral pool.
              </p>
              <Link href="/wagers" className="facts-link link-inline text-caption">
                Stakes &amp; fees
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Card>
        </section>

        <section id="play" className="shell-wide home-section" aria-labelledby="play-heading">
          <div className="section-index">
            <span>02 / Worldwide live matchmaking</span>
            <span>Over 120 countries · Sub-second pairing</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone="accent" icon="shield-check">
                  Fair-Play Verified Arena
                </Badge>
                <span className="font-mono text-caption text-emerald-600 flex items-center gap-1.5 font-semibold">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Global Liquidity · Automated Match Escrow
                </span>
              </div>

              <h2 id="play-heading" className="editorial-title">
                Challenge rivals worldwide. Matched in seconds
              </h2>

              <p className="max-w-[46ch] section-lead text-fg-muted">
                Active grandmasters, blitz tacticians, and rivals across 120+ countries compete around the clock. Every duel is protected by automated match escrow, deterministic move validation, and instant pot settlement.
              </p>

              {/* ── Safe Space & Security Architecture ── */}
              <div className="space-y-2.5">
                {/* 1. Automated Match Escrow */}
                <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-surface-inset/50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 mt-0.5">
                    <Icon name="lock" size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">Automated Match Escrow</span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Locked at Start</span>
                    </div>
                    <p className="text-[12px] text-fg-muted leading-relaxed mt-0.5">
                      Both stakes lock into match escrow before move 1. 95% of the pot credits instantly to the winner’s balance upon checkmate or clock flag.
                    </p>
                  </div>
                </div>

                {/* 2. Stockfish 16 Anti-Cheat Shield */}
                <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-surface-inset/50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 mt-0.5">
                    <Icon name="shield-check" size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">Stockfish 16 Anti-Cheat Shield</span>
                      <span className="font-mono text-[10px] font-semibold text-blue-600 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Real-Time</span>
                    </div>
                    <p className="text-[12px] text-fg-muted leading-relaxed mt-0.5">
                      Every move is audited for millisecond timing variance and engine correlation. Automatic stake refund if unfair play is detected.
                    </p>
                  </div>
                </div>

                {/* 3. Lag-Compensated Clocks */}
                <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3 transition-colors hover:bg-surface-inset/50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-600 mt-0.5">
                    <Icon name="lightning" size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">Lag-Compensated Clocks</span>
                      <span className="font-mono text-[10px] font-semibold text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">FIDE Timing</span>
                    </div>
                    <p className="text-[12px] text-fg-muted leading-relaxed mt-0.5">
                      Centralized authoritative timekeeping with network latency compensation. Zero advantage to artificial ping manipulation or disconnection stalls.
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Global Proof Grid */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-line bg-inset p-3 text-center font-mono">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-fg-muted block font-sans">Active Rivals</span>
                  <span className="poster text-heading-xs text-fg-default font-bold flex items-center justify-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <NumberTicker value={3840} />+
                  </span>
                  <span className="text-[10px] text-emerald-600 block font-medium">In live duels</span>
                </div>
                <div className="space-y-0.5 border-x border-line">
                  <span className="text-[10px] uppercase text-fg-muted block font-sans">Average Queue</span>
                  <span className="poster text-heading-xs text-fg-default font-bold">
                    &lt; 2.4s
                  </span>
                  <span className="text-[10px] text-fg-muted block font-medium">Auto-pairing</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase text-fg-muted block font-sans">Global Reach</span>
                  <span className="poster text-heading-xs text-fg-default font-bold">
                    120+
                  </span>
                  <span className="text-[10px] text-fg-muted block font-medium">Countries</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PlayButton size="md" pulsating />
                <ButtonLink href="/how-it-works" variant="secondary">
                  Explore game ecosystem
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>
            </div>

            {/* ── 3D INTERACTIVE GLOBE SHOWCASE CARD ── */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line rounded-2xl relative overflow-hidden group min-h-[520px]">
              {/* Radar Terminal Header */}
              <div className="w-full flex items-center justify-between gap-2 mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-caption text-fg-default font-semibold">
                    Global PvP Radar
                  </span>
                  <span className="font-mono text-[11px] text-fg-muted hidden sm:inline">
                    120+ active nodes
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Icon name="shield-check" size={13} />
                  Escrow Protected
                </span>
              </div>

              {/* 3D Globe Visualizer with Radar Concentric Rings */}
              <div className="relative flex items-center justify-center w-full my-auto py-2 overflow-hidden">
                {/* Background Radar Rings */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="size-[360px] rounded-full border border-line/50 opacity-60" />
                  <div className="size-[260px] rounded-full border border-dashed border-line/40 opacity-50" />
                  <div className="size-[160px] rounded-full border border-line/30 opacity-40" />
                </div>

                <Globe className="max-w-[440px]" />

                {/* Floating Live Match Chips (Glass HUD) */}
                <div className="pointer-events-none absolute top-2 left-2 z-10 flex items-center gap-2 rounded-xl border border-line/80 bg-surface/90 px-3 py-1.5 font-mono text-[11px] shadow-sm backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-fg-default">Dubai ⚔️ London</span>
                  <span className="text-fg-muted">·</span>
                  <span className="font-bold text-emerald-600 font-sans">$50 USDT</span>
                </div>

                <div className="pointer-events-none absolute top-2 right-2 z-10 hidden sm:flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/90 px-2.5 py-1.5 font-mono text-[11px] shadow-sm backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  <span className="text-fg-muted">Anti-Cheat:</span>
                  <span className="font-semibold text-emerald-600">Stockfish 16</span>
                </div>

                <div className="pointer-events-none absolute bottom-3 right-2 z-10 flex items-center gap-2 rounded-xl border border-line/80 bg-surface/90 px-3 py-1.5 font-mono text-[11px] shadow-sm backdrop-blur-md">
                  <span className="size-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-fg-default">Tokyo ⚔️ New York</span>
                  <span className="text-fg-muted">·</span>
                  <span className="font-bold text-emerald-600 font-sans">$100 USDT</span>
                </div>

                <div className="pointer-events-none absolute bottom-3 left-2 z-10 hidden sm:flex items-center gap-1.5 rounded-xl border border-line/80 bg-surface/90 px-2.5 py-1.5 font-mono text-[11px] text-fg-muted shadow-sm backdrop-blur-md">
                  <Icon name="lightning" size={13} className="text-amber-500" />
                  <span>3m Blitz Match</span>
                </div>
              </div>

              {/* Radar Terminal Footer */}
              <div className="w-full pt-3.5 border-t border-line text-caption text-fg-muted flex flex-wrap items-center justify-between gap-2 font-mono relative z-10">
                <span className="flex items-center gap-1.5">
                  <Icon name="arrow-counter-clockwise" size={13} className="text-fg-muted" />
                  Drag to rotate globe
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    Automated Escrow
                  </span>
                  <span className="text-fg-default font-semibold">Sub-25ms WebSocket</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── 3D WEB3 & TON ECOSYSTEM CLOUD ── */}
        <section id="infrastructure" className="shell-wide home-section" aria-labelledby="infrastructure-heading">
          <div className="section-index">
            <span>03 / Web3 &amp; TON infrastructure</span>
            <span>Zero friction · Instant on-chain rails</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone="accent" icon="cpu">
                  Direct Telegram Rails
                </Badge>
                <span className="font-mono text-caption text-fg-muted font-medium">
                  Sub-second finality
                </span>
              </div>

              <h2 id="infrastructure-heading" className="editorial-title">
                Play seamlessly with TON and USDT
              </h2>

              <p className="max-w-[44ch] section-lead text-fg-muted">
                No seed phrases to export, no browser extensions. Web3Chess launches with one tap directly inside Telegram, connects to your TON wallet, and settles match pots directly to your balance.
              </p>

              <div className="grid gap-3 pt-2 text-body-sm text-fg-muted">
                <div className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span><strong>USDT on TON:</strong> Instant deposits with sub-cent network fees.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span><strong>Telegram profile:</strong> Zero registration friction or passwords.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span><strong>One-tap withdrawals:</strong> Confirmed securely via Telegram bot chat.</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <PlayButton size="md" pulsating />
                <ButtonLink href="/how-it-works" variant="secondary">
                  See how it works
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>
            </div>

            {/* 3D Interactive Web3 Sphere Card */}
            <Card className="flex flex-col items-center justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <BorderBeam size={300} duration={14} colorFrom="#3b82f6" colorTo="#10b981" />

              <div className="w-full flex items-center justify-between gap-2 mb-2 relative z-10">
                <span className="font-mono text-caption text-fg-muted">Supported Protocols</span>
                <span className="font-mono text-caption font-semibold text-emerald-600">60 FPS 3D</span>
              </div>

              <div className="py-2 flex justify-center items-center w-full relative z-10">
                <IconCloud
                  size={260}
                  slugs={[
                    "telegram",
                    "ton",
                    "tether",
                    "ethereum",
                    "bitcoin",
                    "walletconnect",
                    "solana",
                    "polygon",
                    "web3dotjs",
                  ]}
                />
              </div>

              <div className="w-full pt-3 border-t border-line text-caption text-fg-muted flex items-center justify-between font-mono relative z-10">
                <span>Drag to spin 3D sphere</span>
                <span className="text-fg-default font-semibold">Web3 Ecosystem</span>
              </div>
            </Card>
          </div>
        </section>

        <section className="shell-wide home-section" aria-labelledby="fair-heading">
          <div data-surface="ink" className="statement-panel">
            <div className="section-index">
              <span>04 / Pure skill. Zero pay-to-win</span>
              <Icon name="shield-check" size={20} />
            </div>
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-end">
              <h2 id="fair-heading" className="poster text-heading-xl">
                You can’t buy
                <br />a better bishop
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Every piece follows identical rules. No pay-to-win cards, no unfair boosts. Only your preparation, your clock management, and your board vision determine who takes the pot.
              </p>
            </div>
            <div className="mt-6 grid gap-6 border-t border-line pt-6 md:mt-10 md:pt-8 md:grid-cols-3">
              {[
                {
                  icon: "cpu" as const,
                  title: "Authoritative server moves",
                  body: "Stockfish 16 engine validates every move deterministically. No client-side manipulation or illegal board states.",
                },
                {
                  icon: "users-three" as const,
                  title: "Fair ELO matchmaking",
                  body: "Compete exclusively against verified rivals of matching rating, time control, and stake tier.",
                },
                {
                  icon: "scales" as const,
                  title: "Instant 95% pot settlement",
                  body: "Transparent split: 95% to the victor, 3% platform fee, 2% referral pool. Zero hidden deductions.",
                },
              ].map((item) => (
                <div key={item.title} className="space-y-3">
                  <Icon name={item.icon} size={24} className="text-fg-link" />
                  <h3 className="text-title">{item.title}</h3>
                  <p className="text-body-sm text-fg-muted">{item.body}</p>
                </div>
              ))}
            </div>
            <ButtonLink href="/fair-play" variant="secondary" className="mt-8">
              Read our fair play approach
              <Icon name="arrow-up-right" size={18} />
            </ButtonLink>
          </div>
        </section>

        <section id="academy" className="shell-wide home-section" aria-labelledby="academy-heading">
          <div className="section-index">
            <span>05 / Master your game</span>
            <span>Practice is 100% free</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="academy-heading" className="editorial-title">
                100 tactical levels and Stockfish A.I. practice
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Master opening principles. Spot game-ending forks and pins. Calculate endgame conversions. Train against the Stockfish AI engine anytime without risking crypto.
              </p>
              <ButtonLink href="/academy" variant="secondary">
                Enter the Academy
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <BorderBeam size={280} duration={14} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Badge tone="accent" icon="graduation-cap">
                    100 Tactical Levels
                  </Badge>
                  <span className="font-mono text-caption text-emerald-600 font-semibold">
                    100% Free
                  </span>
                </div>
                <span className="font-mono text-caption text-fg-muted">
                  Stockfish 16 Engine
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    num: "01",
                    name: "Origins & Motivation",
                    desc: "Board geometry · Core rules",
                    tag: "Start here",
                    icon: "graduation-cap" as const,
                    color: "text-blue-600 bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    num: "02",
                    name: "Opening Principles",
                    desc: "Center control · King safety",
                    tag: "Develop",
                    icon: "strategy" as const,
                    color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                  },
                  {
                    num: "03",
                    name: "Tactical Patterns",
                    desc: "Forks · Pins · Skewers · Nets",
                    tag: "Calculate",
                    icon: "lightning" as const,
                    color: "text-amber-600 bg-amber-500/10 border-amber-500/20",
                  },
                  {
                    num: "04",
                    name: "Endgame Magic",
                    desc: "King activity · Passed pawns",
                    tag: "Convert",
                    icon: "crown-simple" as const,
                    color: "text-purple-600 bg-purple-500/10 border-purple-500/20",
                  },
                ].map((track) => (
                  <div
                    key={track.name}
                    className="flex items-center justify-between p-3 rounded-xl border border-line bg-inset/75 transition-colors hover:bg-surface"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${track.color}`}>
                        <Icon name={track.icon} size={16} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-fg-default text-[13px] truncate">
                          {track.name}
                        </span>
                        <span className="text-[11px] text-fg-muted font-mono truncate">
                          {track.desc}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-fg-muted bg-surface border border-line px-2 py-0.5 rounded-full">
                      {track.tag}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-line flex items-center justify-between text-caption font-mono text-fg-muted">
                <span>Stockfish A.I. Practice · Unlimited games</span>
                <span className="text-emerald-600 font-semibold">Zero stake needed</span>
              </div>
            </Card>
          </div>
        </section>

        <section id="wagers" className="shell-wide home-section" aria-labelledby="wagers-heading">
          <div className="section-index">
            <span>06 / Real-stakes PvP payouts</span>
            <span>95% winner pot · 18+</span>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8 lg:p-10">
            <BorderBeam size={340} duration={12} colorFrom="#10b981" colorTo="#059669" />

            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start relative z-10">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge tone="accent" icon="lightning">
                    95% Winner Payout
                  </Badge>
                  <span className="font-mono text-caption text-emerald-600 flex items-center gap-1.5 font-semibold">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    Lowest rake in Web3
                  </span>
                </div>

                <h2 id="wagers-heading" className="editorial-title">
                  Turn tactical mastery into real crypto
                </h2>

                <p className="max-w-[44ch] section-lead text-fg-muted">
                  Both players stake equal USDT. No luck, no house edge, no pay-to-win cards — only pure tactical chess. The winner claims 95% of the combined pot instantly on-chain.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <ButtonLink href="/wagers" variant="secondary">
                    Calculate your match winnings
                    <Icon name="arrow-right" size={18} />
                  </ButtonLink>
                  <ButtonLink href="/fair-play" variant="ghost">
                    Settlement rules
                    <Icon name="shield-check" size={16} />
                  </ButtonLink>
                </div>

                <p className="text-caption text-fg-muted">
                  Wager matches involve real crypto. You can lose your stake. Play within your limits. 18+.
                </p>
              </div>

              {/* Dynamic Viral Wager & Prize Matrix powered by AnimatedList */}
              <div className="relative rounded-2xl border border-line bg-inset p-5 sm:p-6 overflow-hidden space-y-3.5">
                <BorderBeam size={280} duration={12} colorFrom="#10b981" colorTo="#3b82f6" />
                <div className="relative z-10 flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-semibold text-fg-default">
                      Popular Stakes &amp; Payouts
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Pools
                    </span>
                  </div>
                  <span className="font-mono text-caption text-emerald-600 font-medium">
                    +90% Net ROI on win
                  </span>
                </div>

                {/* AnimatedList stream of diverse stakes & prizes */}
                <div className="relative z-10 w-full h-[276px] overflow-hidden">
                  <AnimatedList delay={2200} maxItems={4}>
                    {[
                      {
                        tier: "Micro Duel",
                        pace: "Bullet 1+0",
                        stake: 1,
                        win: 1.90,
                        net: "+$0.90",
                        tag: "1-Min Duel",
                        tagColor: "bg-surface border-line text-fg-muted",
                      },
                      {
                        tier: "Blitz Favorite",
                        pace: "Blitz 3+2",
                        stake: 5,
                        win: 9.50,
                        net: "+$4.50",
                        tag: "Most Popular 🔥",
                        tagColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
                      },
                      {
                        tier: "Arena Contender",
                        pace: "Blitz 5+0",
                        stake: 10,
                        win: 19.00,
                        net: "+$9.00",
                        tag: "Active Pool ⚡",
                        tagColor: "bg-blue-500/15 border-blue-500/30 text-blue-700",
                      },
                      {
                        tier: "High Roller",
                        pace: "Rapid 10+0",
                        stake: 25,
                        win: 47.50,
                        net: "+$22.50",
                        tag: "Trending 🚀",
                        tagColor: "bg-amber-500/15 border-amber-500/30 text-amber-700",
                      },
                      {
                        tier: "Championship Pot",
                        pace: "Blitz 3+2",
                        stake: 50,
                        win: 95.00,
                        net: "+$45.00",
                        tag: "+90% Net ROI",
                        tagColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
                      },
                      {
                        tier: "Grandmaster Table",
                        pace: "Rapid 15+10",
                        stake: 100,
                        win: 190.00,
                        net: "+$90.00",
                        tag: "VIP Table 👑",
                        tagColor: "bg-purple-500/15 border-purple-500/30 text-purple-700",
                      },
                      {
                        tier: "Whales Arena",
                        pace: "Blitz 5+3",
                        stake: 250,
                        win: 475.00,
                        net: "+$225.00",
                        tag: "Whales Club 💎",
                        tagColor: "bg-emerald-500/15 border-emerald-500/30 text-emerald-700",
                      },
                    ].map((item) => (
                      <div
                        key={item.tier}
                        className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface/90 transition-all duration-200 hover:scale-[101%] hover:border-fg-muted/40 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#26A17B]/15 border border-[#26A17B]/30 text-[#26A17B]">
                            <UsdtIcon className="size-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-fg-default text-[13px]">
                                ${item.stake} USDT
                              </span>
                              <span className="text-fg-muted text-[12px]">
                                ({item.tier})
                              </span>
                              <span className={`rounded-full border px-1.5 py-0.2 text-[10px] font-semibold ${item.tagColor}`}>
                                {item.tag}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-fg-muted">
                              Pace: {item.pace}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ps-2">
                          <span className="font-mono font-bold text-emerald-600 block text-[13px]">
                            ${item.win.toFixed(2)} USDT
                          </span>
                          <span className="text-[11px] font-mono text-fg-muted">
                            Net: {item.net}
                          </span>
                        </div>
                      </div>
                    ))}
                  </AnimatedList>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-inset to-transparent z-20" />
                </div>

                <div className="relative z-10 flex items-center justify-between border-t border-line pt-3 text-caption text-fg-muted font-mono">
                  <span>Fee split: 3% platform · 2% affiliate</span>
                  <Link href="/wagers" className="text-fg-link hover:underline inline-flex items-center gap-1 font-sans font-semibold">
                    Full math breakdown
                    <Icon name="arrow-right" size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="blog" className="shell-wide home-section" aria-labelledby="journal-heading">
          <div className="section-index">
            <span>07 / Grandmaster tactics</span>
            <span>Read. Think. Win</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <h2 id="journal-heading" className="editorial-title">
              A little knowledge. A winning position
            </h2>
            <ButtonLink href="/blog" variant="secondary">
              All stories
              <Icon name="arrow-up-right" size={18} />
            </ButtonLink>
          </div>
          <div className="home-story-grid grid gap-4">
            {getPublishedPosts().slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <aside id="philosophy" className="shell-wide home-section" aria-labelledby="break-heading">
          <div className="responsible-note">
            <h2 id="break-heading">A grandmaster knows when to take a break</h2>
            <p>Set limits before you play, never chase losses, and return with a clear head. Free A.I. practice is always there for a game without a stake.</p>
          </div>
        </aside>

        <section id="faq" className="shell-wide home-section" aria-labelledby="faq-heading">
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Before your first move</span>
              <h2 id="faq-heading" className="editorial-title">
                Good questions. Clear answers
              </h2>
              <p className="text-body text-fg-muted">
                The essentials on practice, stakes, deposits, and fair play.
              </p>
            </div>
            <Card>
              <Faq />
            </Card>
          </div>
        </section>

        {/* ── HIGH-CONVERTING FINAL CTA BLOCK ── */}
        <section className="shell-wide home-section">
          <div data-surface="ink" className="statement-panel relative overflow-hidden text-center py-10 sm:py-14 flex flex-col items-center">
            <BorderBeam size={360} duration={14} colorFrom="#10b981" colorTo="#3b82f6" />
            <Badge tone="accent" icon="trophy" className="mb-4 relative z-10 self-center mx-auto">
              The Board Is Set
            </Badge>
            <h2 className="poster text-heading-xl max-w-[20ch] relative z-10">
              Your next rival is waiting in Telegram
            </h2>
            <p className="mt-4 max-w-[46ch] text-body text-fg-muted relative z-10">
              Join thousands of players competing for real crypto daily. Practice for free or enter real-stakes PvP matches in seconds.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-10">
              <PlayButton size="lg" pulsating />
              <ButtonLink href="/how-it-works" variant="secondary">
                See how it works
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
