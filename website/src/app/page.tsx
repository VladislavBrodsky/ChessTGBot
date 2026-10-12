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
import { ChessEcosystemOrbit } from "@/components/ChessEcosystemOrbit";
import { GlobeShowcase } from "@/components/GlobeShowcase";
import { RewardsBento } from "@/components/RewardsBento";
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

              {/* ── 3 Sleek Feature Guarantees ── */}
              <div className="space-y-2.5">
                {[
                  {
                    icon: "lock" as const,
                    title: "Automated Match Escrow",
                    body: "Both stakes lock before move 1. 95% of the pot credits instantly upon checkmate or clock flag.",
                    badge: "Instant Payout",
                    badgeColor: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20",
                    iconColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
                  },
                  {
                    icon: "shield-check" as const,
                    title: "Stockfish 16 Anti-Cheat",
                    body: "Moves audited in real-time for timing variance and engine correlation. Instant stake refund on foul play.",
                    badge: "Live Telemetry",
                    badgeColor: "text-blue-700 bg-blue-500/10 border-blue-500/20",
                    iconColor: "text-blue-600 bg-blue-500/10 border-blue-500/20",
                  },
                  {
                    icon: "lightning" as const,
                    title: "FIDE-Grade Latency Clocks",
                    body: "Authoritative server timekeeping with network latency compensation. Zero ping advantage or disconnect stalls.",
                    badge: "Zero Ping Abuse",
                    badgeColor: "text-purple-700 bg-purple-500/10 border-purple-500/20",
                    iconColor: "text-purple-600 bg-purple-500/10 border-purple-500/20",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3.5 rounded-2xl border border-line bg-surface p-3.5 transition-all hover:bg-surface-inset/60 hover:border-fg-muted/30 shadow-2xs"
                  >
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border mt-0.5 ${item.iconColor}`}>
                      <Icon name={item.icon} size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-fg-default text-[13px]">
                          {item.title}
                        </span>
                        <span className={`hidden sm:inline-flex font-mono text-[10px] font-semibold border px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[12px] text-fg-muted leading-relaxed mt-0.5">
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Refined Proof Metrics Strip ── */}
              <div className="flex items-center divide-x divide-line rounded-2xl border border-line bg-inset p-1 text-center font-mono">
                <div className="flex-1 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-fg-muted block font-sans">Active Rivals</span>
                  <span className="poster text-heading-xs text-fg-default font-bold flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    3,840+
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium block">In live duels</span>
                </div>
                <div className="flex-1 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-fg-muted block font-sans">Avg Queue</span>
                  <span className="poster text-heading-xs text-fg-default font-bold block mt-0.5">&lt; 2.4s</span>
                  <span className="text-[10px] text-fg-muted block">Auto-pairing</span>
                </div>
                <div className="flex-1 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider text-fg-muted block font-sans">Global Reach</span>
                  <span className="poster text-heading-xs text-fg-default font-bold block mt-0.5">120+</span>
                  <span className="text-[10px] text-fg-muted block">Countries</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PlayButton size="md" pulsating />
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

            {/* Frameless Chess & Crypto Ecosystem Orbit Showcase */}
            <ChessEcosystemOrbit />
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
