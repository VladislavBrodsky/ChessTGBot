import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { ChessSculpture } from "@/components/ChessSculpture";
import { BlogCard } from "@/components/BlogCard";
import { Faq } from "@/components/Faq";
import dynamic from "next/dynamic";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/icons";
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { LiveSocialProof } from "@/components/LiveSocialProof";
import { BorderBeam } from "@/components/magicui/border-beam";
import { AnimatedList } from "@/components/magicui/animated-list";
import { UsdtIcon } from "@/components/UsdtIcon";

import { RewardsBento } from "@/components/RewardsBento";

const ChessEcosystemOrbit = dynamic(
  () =>
    import("@/components/ChessEcosystemOrbit").then(
      (m) => m.ChessEcosystemOrbit,
    ),
  {
    loading: () => (
      <div className="relative flex flex-col items-center justify-center w-full py-2 min-h-[350px] sm:min-h-[420px]">
        <div className="size-16 sm:size-20 rounded-2xl bg-surface border border-line/40 opacity-50 animate-pulse" />
        <div className="absolute size-56 sm:size-72 rounded-full border border-dashed border-line/30 opacity-40 animate-pulse pointer-events-none" />
      </div>
    ),
  },
);

const GlobeShowcase = dynamic(
  () => import("@/components/GlobeShowcase").then((m) => m.GlobeShowcase),
  {
    loading: () => (
      <div className="relative flex flex-col items-center justify-center select-none w-full py-2 min-h-[420px] sm:min-h-[460px]">
        <div className="size-64 sm:size-80 rounded-full bg-surface border border-line/40 opacity-40 animate-pulse max-w-[80vw] max-h-[80vw]" />
      </div>
    ),
  },
);
import { home } from "@/content/home";
import { getPublishedPosts } from "@/content/blog";
import { SITE, SETTLEMENT } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Play Chess Online in Telegram & Win Real Crypto",
  "Play chess inside Telegram with Web3Chess. Challenge players worldwide in the #1 Telegram chess bot: free Stockfish A.I. practice, 100 tactical puzzles, and real USDT cash duels.",
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
                    Win real crypto
                  </span>
                </span>
              </h1>
              <p className="hero-lead max-w-[42ch] text-fg-muted">
                Challenge rivals worldwide inside Telegram with the #1 Telegram chess bot. Stake USDT, outplay your opponent, and take 95% of the pot. Free Stockfish A.I. practice, 100-level Academy, and Mystery Boxes with up to 1,000 GRAM in prizes.
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

              {/* ── Real-time Social Proof & Match Activity ── */}
              <LiveSocialProof />

              <div className="hero-support flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-caption text-fg-muted">
                <div className="inline-flex items-center gap-1.5 flex-wrap">
                  <Icon name="lightning" size={15} className="shrink-0 text-amber-500" />
                  <span className="shrink-0">Instant on-chain</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold shrink-0">
                    {/* Eye-catching GRAM Currency Badge */}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#0098EA]/10 border border-[#0098EA]/30 text-[#0098EA] text-[11px] font-mono font-bold shadow-2xs">
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-[#0098EA] text-white shadow-xs">
                        <svg viewBox="0 0 32 32" fill="none" className="size-2.5" aria-hidden="true">
                          <path
                            d="M16 6.5L7.5 11.5L16 25.5L24.5 11.5L16 6.5ZM14.8 8.8L16 8.1L17.2 8.8L21.5 11.3L16 12.7L10.5 11.3L14.8 8.8ZM9.8 12.8L15.3 14.2V22.4L9.8 12.8ZM16.7 22.4V14.2L22.2 12.8L16.7 22.4Z"
                            fill="white"
                          />
                        </svg>
                      </span>
                      GRAM
                    </span>
                    <span className="text-fg-muted">&amp;</span>
                    {/* Eye-catching USDT Currency Badge */}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#26A17B]/10 border border-[#26A17B]/30 text-[#047857] text-[11px] font-mono font-bold shadow-2xs">
                      <span className="flex size-3.5 items-center justify-center rounded-full bg-[#26A17B] text-white shadow-xs">
                        <svg viewBox="0 0 32 32" fill="none" className="size-2.5" aria-hidden="true">
                          <path
                            d="M17.9 12.3v-2h6.1V7H8v3.3h6.1v2C7.9 12.6 3 13.9 3 15.5c0 1.6 4.9 2.9 11.1 3.2v7.3h3.8v-7.3c6.2-.3 11.1-1.6 11.1-3.2 0-1.6-4.9-2.9-11.1-3.2zm-1.9 4.6c-5 0-9.2-.8-10-1.9.8-1.1 5-1.9 10-1.9s9.2.8 10 1.9c-.8 1.1-5 1.9-10 1.9z"
                            fill="white"
                          />
                        </svg>
                      </span>
                      USDT
                    </span>
                    <span className="text-fg-default">payouts</span>
                  </span>
                </div>
                <span className="text-line hidden sm:inline">·</span>
                <span className="shrink-0">No download required</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <ChessSculpture />
          </div>
        </section>

        {/* ── MAGIC UI MARQUEE: Live Crypto Match Wins & Vault Drops ── */}
        <section className="shell-wide my-3" aria-label="Live PvP match activity">
          <div className="relative rounded-full border border-line bg-surface/70 py-2 px-3 overflow-hidden shadow-2xs backdrop-blur-md [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_72px,black_calc(100%-72px),transparent)]">
            {/* Smooth optical edge fades */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-4 sm:w-16 bg-gradient-to-r from-surface via-surface/80 to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-4 sm:w-16 bg-gradient-to-l from-surface via-surface/80 to-transparent z-10" />

            <Marquee duration={35} pauseOnHover>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600 font-bold">+$47.50 USDT</strong>
                <span className="text-fg-muted">·</span>
                <span>GM_Morphy won 3+2 Blitz duel</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <strong className="text-amber-600 font-bold">1,000 GRAM</strong>
                <span className="text-fg-muted">·</span>
                <span>King’s Dominion Mystery Jackpot unlocked</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600 font-bold">+$95.00 USDT</strong>
                <span className="text-fg-muted">·</span>
                <span>Magnus_99 won 5+3 Rapid table</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-blue-500" />
                <strong className="text-blue-600 font-bold">2.0% Rake</strong>
                <span className="text-fg-muted">·</span>
                <span>6-Tier Affiliate passive commissions credited</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-purple-500" />
                <strong className="text-purple-600 font-bold">95 USDT</strong>
                <span className="text-fg-muted">·</span>
                <span>@gm_vlad on-chain withdrawal settled (3.8s)</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface border border-line/80 px-3.5 py-1 font-mono text-caption text-fg-default shadow-2xs shrink-0 mx-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-emerald-600 font-bold">+$190.00 USDT</strong>
                <span className="text-fg-muted">·</span>
                <span>Kasparov_X won 10+0 Classical match</span>
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
                Turn your chess rating into real crypto: 95% pot payouts
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                Traditional chess pays you in pixels and points. Web3Chess rewards every tactical win with instant USDT payouts, 1,000 GRAM mystery jackpots, and 6-tier passive match rake.
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
                  <span className="text-label font-semibold">GRAM</span>
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
            <span>120+ countries · Sub-second pairing</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              {/* Refined Eyebrow */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Badge tone="accent" icon="lightning">
                  Global Arena
                </Badge>
                <span className="font-mono text-caption text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Sub-second pairing across 120+ nations
                </span>
              </div>

              {/* Headline */}
              <h2 id="play-heading" className="editorial-title">
                Challenge rivals worldwide.<br />
                <span className="text-fg-muted font-normal">Matched in seconds</span>
              </h2>

              {/* Punchy Value Prop Lead */}
              <p className="max-w-[48ch] text-body text-fg-muted">
                Stake USDT with confidence. Automated escrow locks both deposits until checkmate, with Stockfish 16 move telemetry and millisecond FIDE clock sync.
              </p>

              {/* ── 3 Sleek Compact Security Pillars (Horizontal 3-column, zero carditis) ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="rounded-2xl border border-line bg-surface p-4 transition-all hover:bg-surface-inset/60 shadow-2xs">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mb-2.5">
                    <Icon name="lock" size={16} />
                  </div>
                  <h3 className="font-semibold text-fg-default text-[13px] leading-snug">
                    Instant Escrow
                  </h3>
                  <p className="text-[12px] text-fg-muted mt-1 leading-relaxed">
                    Stakes lock at move 1. 95% pot released automatically upon checkmate.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4 transition-all hover:bg-surface-inset/60 shadow-2xs">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 mb-2.5">
                    <Icon name="shield-check" size={16} />
                  </div>
                  <h3 className="font-semibold text-fg-default text-[13px] leading-snug">
                    Anti-Cheat Engine
                  </h3>
                  <p className="text-[12px] text-fg-muted mt-1 leading-relaxed">
                    Stockfish 16 audits move timing and correlation. Instant refund on foul play.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-surface p-4 transition-all hover:bg-surface-inset/60 shadow-2xs">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 mb-2.5">
                    <Icon name="lightning" size={16} />
                  </div>
                  <h3 className="font-semibold text-fg-default text-[13px] leading-snug">
                    FIDE Server Clocks
                  </h3>
                  <p className="text-[12px] text-fg-muted mt-1 leading-relaxed">
                    Authoritative server timestamps with lag compensation. Zero ping abuse.
                  </p>
                </div>
              </div>

              {/* ── Airy Proof Metrics Bar (Inline, borderless) ── */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-6 pt-2 font-mono text-caption text-fg-muted border-t border-line/60">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="poster text-heading-xs text-fg-default font-bold">3,840+</span>
                  <span className="text-[11px] text-fg-muted">in duels</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-line" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <span className="poster text-heading-xs text-fg-default font-bold">&lt; 2.4s</span>
                  <span className="text-[11px] text-fg-muted">avg queue</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-line" aria-hidden="true" />
                <div className="flex items-center gap-1.5">
                  <span className="poster text-heading-xs text-fg-default font-bold">120+</span>
                  <span className="text-[11px] text-fg-muted">countries</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PlayButton size="md" pulsating trackingLocation="facts_banner" />
                <ButtonLink href="/how-it-works" variant="secondary">
                  How matchmaking works
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>
            </div>

            {/* ── 3D INTERACTIVE GLOBE & LIVE DUEL ARENA HUD ── */}
            <GlobeShowcase />
          </div>
        </section>


        {/* ── 3D WEB3 & GRAM ECOSYSTEM CLOUD ── */}
        <section id="infrastructure" className="shell-wide home-section" aria-labelledby="infrastructure-heading">
          <div className="section-index">
            <span>03 / Web3 &amp; GRAM infrastructure</span>
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
                Play seamlessly with GRAM and USDT
              </h2>

              <p className="max-w-[44ch] section-lead text-fg-muted">
                No seed phrases to export, no browser extensions. Web3Chess launches with one tap directly inside Telegram, connects to your GRAM wallet, and settles match pots directly to your balance.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface/90 p-3.5 shadow-2xs transition-all hover:border-emerald-500/40 hover:shadow-xs">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <Icon name="lightning" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">USDT on GRAM Rail</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        &lt; 3.2s · $0.005 Gas
                      </span>
                    </div>
                    <p className="text-body-xs text-fg-muted mt-1 leading-relaxed">
                      Instant non-custodial deposits and automated match pot escrow with sub-cent network fees on GRAM blockchain.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface/90 p-3.5 shadow-2xs transition-all hover:border-blue-500/40 hover:shadow-xs">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    <Icon name="telegram-logo" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">Native Telegram App</span>
                      <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        Zero Passwords
                      </span>
                    </div>
                    <p className="text-body-xs text-fg-muted mt-1 leading-relaxed">
                      Launch in 1 tap from any Telegram chat. Zero registration friction, no seed phrase backups, no browser extensions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface/90 p-3.5 shadow-2xs transition-all hover:border-purple-500/40 hover:shadow-xs">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    <Icon name="shield-check" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-fg-default text-[13px]">HMAC-Secured Payouts</span>
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                        Instant On-Chain
                      </span>
                    </div>
                    <p className="text-body-xs text-fg-muted mt-1 leading-relaxed">
                      Withdraw directly to your personal wallet in seconds, authenticated with 1-tap HMAC nonces inside Telegram bot chat.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-3">
                <PlayButton size="md" pulsating trackingLocation="infrastructure" />
                <ButtonLink href="/how-it-works" variant="secondary">
                  See how it works
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>
            </div>

            {/* Frameless Chess & Crypto Ecosystem Orbit Showcase */}
            <ChessEcosystemOrbit />
          </div>
        </section>

        <section className="shell-wide home-section" aria-labelledby="fair-heading">
          <div data-surface="ink" className="statement-panel relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Ambient atmospheric lighting */}
            <div className="pointer-events-none absolute -top-20 -right-20 size-80 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />

            <div className="relative z-10 section-index">
              <span>04 / Pure skill. Zero pay-to-win</span>
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
            <span>05 / Master your game</span>
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
            <span>07 / Grandmaster tactics</span>
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
