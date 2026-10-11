import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { ChessSculpture } from "@/components/ChessSculpture";
import { MoveOfTheDay } from "@/components/MoveOfTheDay";
import { WagerDemo } from "@/components/WagerDemo";
import { MatchPreview } from "@/components/MatchPreview";
import { BlogCard } from "@/components/BlogCard";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/icons";
import { ArenaBento } from "@/components/ArenaBento";
import { TextAnimate } from "@/components/magicui/text-animate";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { Marquee } from "@/components/magicui/marquee";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
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
                  href="#challenge"
                  variant="ghost"
                >
                  Solve a free puzzle
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

        <section id="challenge" className="shell-wide home-section" aria-labelledby="challenge-title">
          <div className="section-index">
            <span>01 / Prove your tactical vision</span>
            <span>Three winning positions</span>
          </div>
          <MoveOfTheDay />
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

        {/* ── BENTO SHOWCASE: Real Crypto, Mystery Boxes, Tournaments & Academy ── */}
        <section id="features" className="shell-wide home-section" aria-labelledby="features-heading">
          <div className="section-index">
            <span>02 / The Web3Chess ecosystem</span>
            <span>Play, earn, and unbox</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="features-heading" className="editorial-title">
                Built for competitive chess and real crypto rewards
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                From micro-stakes PvP to high-roller tables, seasonal leaderboards, and 1,000 TON mystery jackpots — every move counts.
              </p>
            </div>
            <ButtonLink href="/how-it-works" variant="secondary">
              See how matchmaking works
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          </div>
          <ArenaBento />
        </section>

        <section id="play" className="shell-wide home-section" aria-labelledby="play-heading">
          <div className="section-index">
            <span>03 / Matchmaking on your schedule</span>
            <span>Bullet, blitz &amp; rapid</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="play-heading" className="editorial-title">
                Less waiting. More playing
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Pick your time control. Choose your stake. Close the app and keep chatting — Telegram instantly pings you the second an opponent is ready.
              </p>
              <ButtonLink href="/how-it-works" variant="secondary">
                Explore time controls
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
            <MatchPreview />
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
                  body: "The backend validates every legal move and maintains the tamper-proof match state.",
                },
                {
                  icon: "users-three" as const,
                  title: "Fair ELO matchmaking",
                  body: "Get paired against opponents of equal skill, time control, and matching stake.",
                },
                {
                  icon: "scales" as const,
                  title: "95% transparent settlement",
                  body: "Know the exact pot split, timeout rules, and payout mechanics before you place a stake.",
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
            <Card>
              <ol className="academy-track-list">
              {home.academy.tracks.map((track, index) => (
                <li key={track.name}>
                  <span className="font-mono text-caption text-fg-muted">
                    0{index + 1}
                  </span>
                  <h3 className="text-title">{track.name}</h3>
                  <span className="text-caption text-fg-muted">
                    {track.level}
                  </span>
                </li>
              ))}
              </ol>
            </Card>
          </div>
        </section>

        <section id="wagers" className="shell-wide home-section" aria-labelledby="wagers-heading">
          <div className="section-index">
            <span>06 / Transparent pot math</span>
            <span>Equal stakes · 18+</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="wagers-heading" className="editorial-title">
                No mystery in the match pot
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Both players stake the exact same amount. A decided match instantly credits {SETTLEMENT.winnerPercent}% of the combined pot to the winner’s balance.
              </p>
              <p className="text-body-sm text-fg-muted">
                Withdrawals to your personal wallet are confirmed with one tap in the bot chat. Track completed transfers on Tonviewer with full on-chain transparency.
              </p>
              <ButtonLink href="/wagers" variant="secondary">
                Calculate your match winnings
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
              <p className="text-caption text-fg-muted">
                Wager matches involve real money and you can lose your stake. Play responsibly. 18+.
              </p>
            </div>
            <Card>
              <WagerDemo />
            </Card>
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
            <Badge tone="accent" icon="trophy" className="mb-4 relative z-10">
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
