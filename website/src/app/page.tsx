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
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedList } from "@/components/magicui/animated-list";
import { UsdtIcon } from "@/components/UsdtIcon";

import { RewardsBento } from "@/components/RewardsBento";

import { home } from "@/content/home";
import { getPublishedPosts } from "@/content/blog";
import { SITE, SETTLEMENT } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Play Chess in Telegram | Free AI & Player Matches",
  "Play chess in Telegram: start free against the AI, unlock a mystery box after three qualifying games, and explore optional USDT-staked player matches.",
  "",
  [
    "telegram chess bot",
    "play chess in telegram",
    "telegram chess mini app",
    "crypto chess game",
    "play chess for crypto",
    "earn crypto playing chess",
    "free chess puzzles online",
    "online chess tactics trainer",
    "play chess vs stockfish online",
    "usdt chess wager",
    "web3 chess",
  ],
);

// Re-render regularly so newly scheduled articles reach the home page on time.
export const revalidate = 60;

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
        "@type": "SoftwareApplication",
        name: "Web3Chess Telegram Chess Bot",
        applicationCategory: "GameApplication",
        operatingSystem: "Telegram, iOS, Android, Web, macOS, Windows",
        url: `${SITE.url}/play`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
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
              <Badge tone="accent" icon="telegram-logo">Telegram Chess Bot · Live PvP Arena · Real Crypto Stakes</Badge>
              <h1 id="home-title" className="poster hero-title">
                <span className="block whitespace-normal sm:whitespace-nowrap">
                  Play chess in Telegram
                </span>
                <span className="block whitespace-normal sm:whitespace-nowrap">
                  <span className="hero-emphasis inline-block">
                    Unlock a free box
                  </span>
                </span>
              </h1>
              <p className="hero-lead max-w-[42ch] text-fg-muted">
                Start with free AI chess in Telegram. Join the first-three challenge, finish three qualifying games, and open one in-app mystery box. If you choose a USDT-staked player match, review the pot and fees before you play.
              </p>
            </div>
            <div className="hero-details space-y-4">
              <div className="hero-actions flex flex-wrap gap-2.5">
                <PlayButton size="lg" pulsating trackingLocation="hero" />
                <ButtonLink
                  href="/how-it-works"
                  variant="ghost"
                >
                  See how it works
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>

              <p className="text-body-sm text-fg-muted">Free AI practice · one box per account · reward odds shown in the app</p>
            </div>
          </div>
          <div className="hero-visual">
            <ChessSculpture
              footer={<p className="hero-support text-center text-body-sm text-fg-muted">Free AI practice · Optional USDT-staked matches · No download required</p>}
            />
          </div>
        </section>

        <section id="rewards" className="shell-wide home-section" aria-labelledby="rewards-heading">
          <div className="section-index">
            <span>01 / Why players choose Web3Chess</span>
            <span>Free practice · Clear fees</span>
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="rewards-heading" className="editorial-title">
                Start free. Make every game count.
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                Choose free AI practice and earn one in-app mystery box after three qualifying games. USDT-staked player matches are optional, with terms shown before you enter.
              </p>
            </div>
            <ButtonLink href="/how-it-works" variant="secondary">
              Explore game ecosystem
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          </div>

          <RewardsBento />
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
                    {SETTLEMENT.winnerPercent}%
                  </span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Starting stake</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    1
                  </span>
                  <span className="text-label font-semibold">USDT</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Free box unlock</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    3
                  </span>
                  <span className="text-label font-semibold">AI games</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Tactics Academy &amp; AI</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster text-stat tabular-nums">
                    100
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

        <section className="shell-wide home-section" aria-labelledby="fair-heading">
          <div data-surface="ink" className="statement-panel relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Ambient atmospheric lighting */}
            <div className="pointer-events-none absolute -top-20 -right-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 section-index">
              <span>02 / Pure skill. Zero pay-to-win</span>
              <Icon name="shield-check" size={20} />
            </div>
            <div className="relative z-10 grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-end">
              <h2 id="fair-heading" className="poster text-heading-xl">
                You can’t buy
                <br />a better bishop
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Every piece follows identical rules. No pay-to-win cards, no unfair boosts. Only your preparation, your clock management, and your board vision determine who takes the pot.
              </p>
            </div>
            <div className="relative z-10 mt-6 grid gap-4 border-t border-line/40 pt-6 md:mt-10 md:pt-8 md:grid-cols-3">
              {[
                {
                  icon: "cpu" as const,
                  tag: "Stockfish 16 Engine",
                  title: "Authoritative server moves",
                  body: "Stockfish 16 engine validates every single ply deterministically server-side. Zero client-side manipulation, impossible moves, or clock spoofing.",
                  metric: "< 45ms Latency · Deterministic",
                },
                {
                  icon: "users-three" as const,
                  tag: "Verified Rival Only",
                  title: "Fair ELO matchmaking",
                  body: "Compete exclusively against verified rivals within your rating bracket, time control, and wager tier. Anti-smurf rating algorithms protect every match.",
                  metric: "±50 ELO Window · Anti-Smurf",
                },
                {
                  icon: "scales" as const,
                  tag: "Smart Escrow Split",
                  title: "Instant 95% pot settlement",
                  body: "Both players deposit equal USDT before move 1 into smart escrow. Checkmate or resignation instantly credits 95% to the victor on-chain.",
                  metric: "95% Victor · 3% Platform · 2% Affiliate",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5.5 space-y-4 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.07] hover:shadow-[0_12px_35px_-10px_rgba(16,185,129,0.18)] shadow-xs backdrop-blur-xs flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Eyebrow Badge with Glowing Live Dot */}
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        <span className="relative flex size-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
                        </span>
                        {item.tag}
                      </span>
                    </div>

                    {/* Icon + Title on the SAME LINE */}
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
                        <Icon name={item.icon} size={20} />
                      </div>
                      <h3 className="text-[17px] font-semibold text-white tracking-tight leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    {/* Body explanation */}
                    <p className="text-body-sm text-stone-300/85 leading-relaxed">
                      {item.body}
                    </p>
                  </div>

                  {/* Footer Guarantee */}
                  <div className="pt-3 border-t border-white/10 font-mono text-[11px] text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="flex items-center gap-1.5 text-stone-400">
                      <Icon name="shield-check" size={13} className="text-emerald-400 shrink-0" />
                      Guarantee:
                    </span>
                    <span className="text-emerald-400 font-semibold">{item.metric}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative z-10 pt-2">
              <ButtonLink href="/fair-play" variant="secondary" className="mt-8">
                Read our fair play approach
                <Icon name="arrow-up-right" size={18} />
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="academy" className="shell-wide home-section" aria-labelledby="academy-heading">
          <div className="section-index">
            <span>03 / Master your game</span>
            <span>Practice is 100% free</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="academy-heading" className="editorial-title">
                Free chess puzzles online &amp; Stockfish A.I. practice
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
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Badge tone="accent" icon="graduation-cap">
                    100 Tactical Levels
                  </Badge>
                  <span className="font-mono text-caption text-emerald-600 font-semibold">
                    100% Free
                  </span>
                </div>
                <span className="font-mono text-[11px] sm:text-caption text-fg-muted">
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

              <div className="pt-4 mt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-caption font-mono text-fg-muted">
                <span>Stockfish A.I. Practice · Unlimited games</span>
                <span className="text-emerald-600 font-semibold">Zero stake needed</span>
              </div>
            </Card>
          </div>
        </section>

        <section id="wagers" className="shell-wide home-section" aria-labelledby="wagers-heading">
          <div className="section-index">
            <span>04 / Real-stakes PvP payouts</span>
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
                  Play chess for money: USDT stakes and 95% winner pot
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
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-semibold text-fg-default">
                      Popular Stakes &amp; Payouts
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Pools
                    </span>
                  </div>
                  <span className="font-mono text-[11px] sm:text-caption text-emerald-600 font-medium">
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
                              <span className="text-fg-muted text-[12px] hidden sm:inline">
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
            <span>05 / Grandmaster tactics</span>
            <span>Read. Think. Win</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <h2 id="journal-heading" className="editorial-title">
              Online chess tactics, opening traps &amp; speed chess guides
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

          <div className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="eyebrow">Trending Guides &amp; Opening Weapons</span>
              <Link href="/blog" className="text-caption font-mono font-semibold text-fg-link hover:underline inline-flex items-center gap-1">
                Explore all 34 guides
                <Icon name="arrow-right" size={13} />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Can You Make Money on Chess.com?", href: "/blog/can-you-make-money-on-chess-com", cat: "Chess Culture" },
                { title: "The Fried Liver Attack: Punish f7", href: "/blog/the-fried-liver-attack-punish-weak-f7-pawns", cat: "Openings" },
                { title: "Dirty Blitz Tricks & Mind Games", href: "/blog/dirty-blitz-tricks-and-psychological-warfare", cat: "Tactics" },
                { title: "Smith-Morra Gambit: Beat Sicilian", href: "/blog/smith-morra-gambit-crush-the-sicilian-defense", cat: "Openings" },
                { title: "Chess Rules for Beginners (Step-by-Step)", href: "/rules", cat: "FIDE Rules" },
                { title: "Chess Cheating Scandals & Telemetry", href: "/blog/chess-cheating-scandals-and-stockfish-telemetry", cat: "Chess News" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col justify-between p-3.5 rounded-xl border border-line bg-inset/50 hover:bg-surface hover:border-line-strong transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono text-fg-muted uppercase tracking-wider">{item.cat}</span>
                    <Icon name="arrow-up-right" size={14} className="text-fg-muted group-hover:text-fg transition-colors" />
                  </div>
                  <span className="text-body-sm font-medium text-fg group-hover:text-fg-link transition-colors line-clamp-1">
                    {item.title}
                  </span>
                </Link>
              ))}
            </div>
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
          <div
            data-surface="ink"
            className="statement-panel relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] text-center py-10 sm:py-14 flex flex-col items-center"
          >
            {/* Ambient atmospheric lighting */}
            <div className="pointer-events-none absolute -top-20 -left-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
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
              <PlayButton size="lg" pulsating trackingLocation="final_banner" />
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
