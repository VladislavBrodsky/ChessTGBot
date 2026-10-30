import Link from "next/link";
import { Badge, HeroContext } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { HeroPaymentCaption } from "@/components/HeroPaymentCaption";
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
import { PlayOfferStrip } from "@/components/PlayOfferStrip";
import { BorderBeam } from "@/components/magicui/border-beam";
import { MetaLine } from "@/components/ui/MetaLine";
import { AnimatedList } from "@/components/magicui/animated-list";
import { UsdtIcon } from "@/components/UsdtIcon";

import { ShowcaseSkeleton } from "@/components/ShowcaseSkeleton";
import { RewardsBento } from "@/components/RewardsBento";
import { ArenaSection, InfrastructureSection } from "@/components/MarketingSections";
import { FirstThreeChallenge } from "@/components/FirstThreeChallenge";
import { AppScreens } from "@/components/AppScreens";

const ChessEcosystemOrbit = dynamic(
  () => import("@/components/ChessEcosystemOrbit").then((m) => m.ChessEcosystemOrbit),
  { loading: () => <ShowcaseSkeleton kind="ecosystem" /> },
);
const GlobeShowcase = dynamic(
  () => import("@/components/GlobeShowcase").then((m) => m.GlobeShowcase),
  { loading: () => <ShowcaseSkeleton kind="globe" /> },
);
import { home } from "@/content/home";
import { getPublishedPosts } from "@/content/blog";
import { SITE, SETTLEMENT, winnerReceives } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Play Chess Online in Telegram & Win Real Crypto",
  "Play chess inside Telegram with Web3Chess. Practice free against Free Coach, a computer opponent, explore 100 tactical levels, and learn the rules for optional USDT chess matches.",
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
    "play chess vs computer online",
    "usdt chess wager",
    "web3 chess",
  ],
);

// Re-render regularly so newly scheduled articles reach the home page on time.
export const revalidate = 60;

const FEATURE_STRIP = [
  { amount: "Free Coach", text: "Practice against the computer", dot: "bg-win-fill", tone: "text-fg-win" },
  { amount: "3 games", text: "Earn one free Mystery Box", dot: "bg-caution-soft", tone: "text-fg-caution" },
  { amount: "In-app rewards", text: "XP, XP boost, or profile border", dot: "bg-premium-soft", tone: "text-fg-premium" },
  { amount: "100 levels", text: "Learn chess tactics in the Academy", dot: "bg-fg-muted", tone: "text-fg-muted" },
  { amount: "95% of pot", text: "Winner share in an optional wager match", dot: "bg-win-fill", tone: "text-fg-win" },
] as const;

const FAIR_PILLARS = [
  {
    icon: "cpu" as const,
    tag: "Server game state",
    title: "Authoritative server moves",
    body: "The game server validates moves and records match results, keeping the authoritative state outside the browser.",
    metric: "Server-validated moves",
  },
  {
    icon: "users-three" as const,
    tag: "Rated opponents",
    title: "Fair ELO matchmaking",
    body: "Choose a time control and available wager tier before entering an online match. Check the match terms before committing a stake.",
    metric: "Time controls · Stakes · Results",
  },
  {
    icon: "scales" as const,
    tag: "Clear pot split",
    title: "Instant 95% pot settlement",
    body: "Both players commit equal USDT before play. After a decided result, the winner receives 95% of the combined pot in their app balance.",
    metric: `${SETTLEMENT.winnerPercent}% Victor · ${SETTLEMENT.platformFeePercent}% Platform · ${SETTLEMENT.referralFeePercent}% Affiliate`,
  },
];

const ACADEMY_TRACKS = [
  { name: "Origins & Motivation", desc: "Board geometry · Core rules", tag: "Start here", icon: "graduation-cap" as const },
  { name: "Opening Principles", desc: "Center control · King safety", tag: "Develop", icon: "strategy" as const },
  { name: "Tactical Patterns", desc: "Forks · Pins · Skewers · Nets", tag: "Calculate", icon: "lightning" as const },
  { name: "Endgame Magic", desc: "King activity · Passed pawns", tag: "Convert", icon: "crown-simple" as const },
];

// Winner credit and net gain come from the shared settlement split, so the ladder can never drift from it.
const STAKE_LADDER = [
  { tier: "Micro Duel", pace: "1 min Bullet", stake: 1, tag: "1-Min Duel" },
  { tier: "Blitz Favorite", pace: "3 min Blitz", stake: 5, tag: "Most Popular" },
  { tier: "Arena Contender", pace: "5 min Blitz", stake: 10, tag: "Active Pool" },
  { tier: "High Roller", pace: "10 min Rapid", stake: 25, tag: "Trending" },
  { tier: "Championship Pot", pace: "3 min Blitz", stake: 50, tag: "+90% Net ROI" },
  { tier: "Grandmaster Table", pace: "15 min Rapid", stake: 100, tag: "VIP Table" },
  { tier: "Whales Arena", pace: "5 min Blitz", stake: 250, tag: "Whales Club" },
];

const TRENDING_GUIDES = [
  { title: "Can You Make Money on Chess.com?", href: "/blog/can-you-make-money-on-chess-com", cat: "Chess Culture" },
  { title: "The Fried Liver Attack: Punish f7", href: "/blog/the-fried-liver-attack-punish-weak-f7-pawns", cat: "Openings" },
  { title: "Dirty Blitz Tricks & Mind Games", href: "/blog/dirty-blitz-tricks-and-psychological-warfare", cat: "Tactics" },
  { title: "Smith-Morra Gambit: Beat Sicilian", href: "/blog/smith-morra-gambit-crush-the-sicilian-defense", cat: "Openings" },
  { title: "Chess Rules for Beginners (Step-by-Step)", href: "/rules", cat: "FIDE Rules" },
  { title: "Chess Cheating Scandals & Telemetry", href: "/blog/chess-cheating-scandals-and-stockfish-telemetry", cat: "Chess News" },
];

const usd = (value: number) => `$${value.toFixed(2)}`;

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
          <div className="home-hero-context">
            <HeroContext tone="accent" icon="telegram-logo">Telegram Chess Bot · Live PvP Arena · Real Crypto Stakes</HeroContext>
          </div>
          <div className="hero-visual">
            <ChessSculpture footer={<HeroPaymentCaption />} />
          </div>
          <div className="hero-copy">
            <div className="hero-intro">
              <h1 id="home-title" className="poster hero-title">
                <span className="block whitespace-normal sm:whitespace-nowrap">
                  Play chess
                </span>
                <span className="block whitespace-normal sm:whitespace-nowrap">
                  <span className="hero-emphasis inline-block">
                    Win real crypto
                  </span>
                </span>
              </h1>
              <p className="hero-lead max-w-[42ch] text-fg-muted">
                Play chess inside Telegram. Practice free against the Free Coach computer opponent, work through 100 Academy levels, and earn one Mystery Box after three qualifying games. Optional USDT matches pay 95% of the combined pot to the winner’s app balance.
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

              <PlayOfferStrip />
            </div>
          </div>
        </section>

        <section className="shell-wide my-3" aria-label="Ways to play Web3Chess">
          <div className="relative overflow-hidden rounded-full border border-line bg-surface/70 px-2 py-2 backdrop-blur-md [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] sm:[mask-image:linear-gradient(to_right,transparent,black_72px,black_calc(100%-72px),transparent)]">
            <Marquee duration={35} pauseOnHover>
              {FEATURE_STRIP.map((item) => (
                <span key={item.text} className="live-strip-item">
                  <i className={item.dot} aria-hidden="true" />
                  <strong className={item.tone}>{item.amount}</strong>
                  <span>{item.text}</span>
                </span>
              ))}
            </Marquee>
          </div>
        </section>

        <section id="rewards" className="shell-wide home-section" aria-labelledby="rewards-heading">
          <div className="section-index">
            <span>01 / Why players choose Web3Chess</span>
            <span>Free practice · Clear pot split</span>
          </div>

          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="rewards-heading" className="editorial-title">
                Turn your chess rating into real crypto: 95% pot payouts
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                Start with free chess practice and a three-game Mystery Box challenge. If you choose an optional USDT wager match, the winner receives 95% of the combined pot in their app balance.
              </p>
            </div>
            <ButtonLink href="/how-it-works" variant="secondary">
              Explore game ecosystem
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          </div>

          <FirstThreeChallenge />
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
                  <span className="poster fact-figure tabular-nums">
                    <NumberTicker value={SETTLEMENT.winnerPercent} suffix="%" />
                  </span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Starting stake</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster fact-figure tabular-nums">
                    <NumberTicker value={1} />
                  </span>
                  <span className="text-label font-semibold">USDT</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Free box goal</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster fact-figure tabular-nums">
                    <NumberTicker value={3} />
                  </span>
                  <span className="text-label font-semibold">Games</span>
                </dd>
              </div>
              <div className="fact-item">
                <dt className="text-caption text-fg-muted">Tactics Academy &amp; Free Coach</dt>
                <dd className="fact-value flex items-baseline gap-1.5">
                  <span className="poster fact-figure tabular-nums">
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

        {/* Real Mini App screens with sample data, always labelled as examples (see AppScreens). */}
        <section id="app-screens" className="shell-wide home-section" aria-labelledby="app-screens-heading">
          <div className="mb-8">
            <span className="eyebrow">Inside the Mini App</span>
            <h2 id="app-screens-heading" className="editorial-title mt-4">
              What you see when you tap Play
            </h2>
            <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
              Pick a stake in the lobby, play on the board, and check your result. The Academy is one tab away for puzzles and lessons.
            </p>
          </div>
          <AppScreens screens={["lobby", "game", "result", "academy"]} />
        </section>

        <ArenaSection visual={<GlobeShowcase />} />
        <InfrastructureSection visual={<ChessEcosystemOrbit />} />

        <section className="shell-wide home-section" aria-labelledby="fair-heading">
          <div data-surface="ink" className="statement-panel relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            {/* Ambient atmospheric lighting */}
            <div className="pointer-events-none absolute -top-20 -right-20 size-80 rounded-full bg-win-fill/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-fg-muted/10 blur-3xl" aria-hidden="true" />

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
            <ul className="fair-pillars relative z-10">
              {FAIR_PILLARS.map((item) => (
                <li key={item.title} className="fair-pillar">
                  <div className="fair-pillar-head">
                    <span className="fair-pillar-icon"><Icon name={item.icon} size={20} /></span>
                    <span className="fair-pillar-tag">{item.tag}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <MetaLine items={item.metric} />
                </li>
              ))}
            </ul>
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
                Free chess puzzles online &amp; Free Coach practice
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Master opening principles. Spot game-ending forks and pins. Calculate endgame conversions. Train against Free Coach, our computer opponent, anytime without risking crypto.
              </p>
              <ButtonLink href="/academy" variant="secondary">
                Enter the Academy
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
            <Card className="academy-preview border border-line">
              <div className="academy-preview-head">
                <Badge tone="accent" icon="graduation-cap">
                  100 Tactical Levels
                </Badge>
                <MetaLine items={[<span key="free" className="font-semibold text-fg-win">100% Free</span>, "3 Free Coach Levels"]} />
              </div>
              <ul className="academy-preview-list">
                {ACADEMY_TRACKS.map((track) => (
                  <li key={track.name}>
                    <span className="academy-preview-icon"><Icon name={track.icon} size={18} /></span>
                    <div className="min-w-0">
                      <strong>{track.name}</strong>
                      <MetaLine items={track.desc} />
                    </div>
                    <span className="academy-preview-tag">{track.tag}</span>
                  </li>
                ))}
              </ul>
              <div className="academy-preview-foot">
                <MetaLine items="Free Coach practice · Unlimited games" />
                <strong>Zero stake needed</strong>
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

            <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start relative z-10">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <Badge tone="accent" icon="lightning">
                    95% Winner Payout
                  </Badge>
                  <span className="text-caption font-semibold text-fg-win">
                    Fees shown before play
                  </span>
                </div>

                <h2 id="wagers-heading" className="editorial-title">
                  Play chess for money: USDT stakes and 95% winner pot
                </h2>

                <p className="max-w-[44ch] section-lead text-fg-muted">
                  Both players stake equal USDT. No luck or pay-to-win cards — only tactical chess. After a decided result, the winner receives 95% of the combined pot in their app balance.
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

              {/* Stake ladder: amounts derive from SETTLEMENT */}
              <div className="grid gap-3.5 rounded-2xl border border-line bg-inset p-5 sm:p-6">
                <div className="stake-stream-heading">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong>Popular Stakes &amp; Payouts</strong>
                    <Badge tone="accent">Payout examples</Badge>
                  </span>
                  <span>+90% Net ROI on win</span>
                </div>
                <div className="home-payout-stream w-full">
                  <AnimatedList delay={2200} maxItems={4}>
                    {STAKE_LADDER.map((item) => {
                      const win = winnerReceives(item.stake);
                      return (
                        <div key={item.tier} className="stake-row">
                          <span className="stake-row-mark"><UsdtIcon /></span>
                          <div className="stake-row-main">
                            <div className="stake-row-title">
                              <strong>${item.stake} USDT</strong>
                              <span>{item.tier}</span>
                            </div>
                            <MetaLine items={[`Pace: ${item.pace}`, item.tag]} />
                          </div>
                          <div className="stake-row-value">
                            <strong>{usd(win)} USDT</strong>
                            <span>Net: +{usd(win - item.stake)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </AnimatedList>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3 text-caption text-fg-muted">
                  <MetaLine items={["Fee split: " + SETTLEMENT.platformFeePercent + "% platform", SETTLEMENT.referralFeePercent + "% affiliate"]} />
                  <Link href="/wagers" className="link-inline inline-flex min-h-11 items-center gap-1.5 font-semibold text-fg">
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <span className="eyebrow">Trending Guides &amp; Opening Weapons</span>
              <Link href="/blog" className="link-inline inline-flex min-h-11 items-center gap-1.5 text-caption font-semibold">
                Explore all {getPublishedPosts().length} guides
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <ul className="guide-links">
              {TRENDING_GUIDES.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="guide-link">
                    <span className="guide-link-cat">
                      <span>{item.cat}</span>
                      <Icon name="arrow-up-right" size={14} />
                    </span>
                    <span className="guide-link-title">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside id="philosophy" className="shell-wide home-section" aria-labelledby="break-heading">
          <div className="responsible-note">
            <h2 id="break-heading">A grandmaster knows when to take a break</h2>
            <p>Set limits before you play, never chase losses, and return with a clear head. Free Coach practice is always there for a game without a stake.</p>
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
            <div className="pointer-events-none absolute -top-20 -left-20 size-80 rounded-full bg-win-fill/10 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-fg-muted/10 blur-3xl" aria-hidden="true" />
            <BorderBeam size={360} duration={14} colorFrom="#10b981" colorTo="#3b82f6" radius={32} />
            <Badge tone="accent" icon="trophy" className="mb-4 relative z-10 self-center mx-auto">
              The Board Is Set
            </Badge>
            <h2 className="poster text-heading-xl max-w-[20ch] relative z-10">
              Your next rival is waiting in Telegram
            </h2>
            <p className="mt-4 max-w-[46ch] text-body text-fg-muted relative z-10">
              Start with a free practice game. When you are ready, review the rules and choose whether to enter an eligible USDT match.
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
