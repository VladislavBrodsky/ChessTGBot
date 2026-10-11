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
import { home } from "@/content/home";
import { getPublishedPosts } from "@/content/blog";
import { SITE, SETTLEMENT } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Chess in Telegram — Play, Train & Compete",
  SITE.description,
  "",
);

const facts = [
  { value: "Free", unit: "", label: "A.I. practice" },
  { value: "10", unit: "", label: "App languages" },
  { value: "1", unit: "USDT", label: "Minimum stake" },
  {
    value: `${SETTLEMENT.winnerPercent}%`,
    unit: "",
    label: "Winner’s share",
  },
];

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
              <Badge tone="accent" icon="telegram-logo">Chess. Now in Telegram.</Badge>
              <h1 id="home-title" className="poster hero-title">
                Skill is the
                <br />
                <span className="hero-emphasis">only edge</span>
              </h1>
              <p className="hero-lead max-w-[38ch] text-fg-muted">
                Train for free. Find your next rival. Make your next move inside Telegram.
              </p>
            </div>
            <div className="hero-details">
              <div className="hero-actions flex flex-wrap gap-2.5">
                <PlayButton size="lg" />
                <ButtonLink
                  href="#challenge"
                  variant="ghost"
                >
                  Try a free puzzle
                  <Icon name="arrow-right" size={18} />
                </ButtonLink>
              </div>
              <div className="hero-support space-y-2 text-caption text-fg-muted">
                <p className="flex items-center gap-2">
                  <Icon name="check-circle" size={16} className="shrink-0" />
                  Free A.I. practice · No download
                </p>
                <p>18+ wager matches · You can lose your stake.</p>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <ChessSculpture />
          </div>
        </section>

        <section id="challenge" className="shell-wide home-section" aria-labelledby="challenge-title">
          <div className="section-index">
            <span>01 / Your move, right now</span>
            <span>Three free positions</span>
          </div>
          <MoveOfTheDay />
        </section>

        <section
          className="shell-wide facts-section"
          aria-label="Web3Chess at a glance"
        >
          <Card>
            <dl className="facts-grid">
              {facts.map((fact) => (
                <div key={fact.label} className="fact-item">
                  <dt className="text-caption text-fg-muted">{fact.label}</dt>
                  <dd className="fact-value flex items-baseline gap-1.5">
                    <span className="poster text-stat tabular-nums">{fact.value}</span>
                    {fact.unit && <span className="text-label font-semibold">{fact.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="facts-summary">
              <p className="text-caption text-fg-muted">
                Combined pot: {SETTLEMENT.winnerPercent}% winner ·{" "}
                {SETTLEMENT.platformFeePercent}% platform fee ·{" "}
                {SETTLEMENT.referralFeePercent}% referral pool.
              </p>
              <Link href="/wagers" className="facts-link link-inline text-caption">
                Stakes & fees
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </Card>
        </section>

        <section id="play" className="shell-wide home-section" aria-labelledby="play-heading">
          <div className="section-index">
            <span>02 / From chat to checkmate</span>
            <span>Built around your day</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="play-heading" className="editorial-title">
                Less waiting. More playing.
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Pick a pace. Choose a stake. Keep chatting while we find your
                opponent. Telegram tells you when the board is ready.
              </p>
              <ButtonLink href="/how-it-works" variant="secondary">
                See how it works
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
            <MatchPreview />
          </div>
        </section>

        <section className="shell-wide home-section" aria-labelledby="fair-heading">
          <div data-surface="ink" className="statement-panel">
            <div className="section-index">
              <span>03 / The game comes first</span>
              <Icon name="strategy" size={20} />
            </div>
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-end">
              <h2 id="fair-heading" className="poster text-heading-xl">
                You can’t buy
                <br />a better bishop.
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Every piece follows the same rules. Your preparation, your
                decisions, and your clock management make the difference.
              </p>
            </div>
            <div className="mt-6 grid gap-6 border-t border-line pt-6 md:mt-10 md:pt-8 md:grid-cols-3">
              {[
                {
                  icon: "cpu" as const,
                  title: "Moves checked on the server",
                  body: "The backend validates legal moves and keeps the authoritative game state.",
                },
                {
                  icon: "users-three" as const,
                  title: "A rival near your rating",
                  body: "Matchmaking considers rating, time control, and the selected stake.",
                },
                {
                  icon: "scales" as const,
                  title: "The rules, in plain sight",
                  body: "Know how timeouts, match results, and settlement work before you play.",
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
            <span>04 / Build your board vision</span>
            <span>Practice is always free</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="academy-heading" className="editorial-title">
                Make your next move a better one.
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Learn opening principles. Spot the fork. Find the endgame plan.
                Build confidence with lessons, puzzles, and A.I. practice inside
                Telegram.
              </p>
              <ButtonLink href="/academy" variant="secondary">
                Explore the Academy
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
            <span>05 / Know the numbers</span>
            <span>18+ wager matches</span>
          </div>
          <div className="section-split">
            <div className="space-y-5">
              <h2 id="wagers-heading" className="editorial-title">
                No mystery in the match pot.
              </h2>
              <p className="max-w-[42ch] section-lead text-fg-muted">
                Both players contribute the same stake. A decided match credits{" "}
                {SETTLEMENT.winnerPercent}% of the combined pot to the winner’s
                platform balance.
              </p>
              <p className="text-body-sm text-fg-muted">
                Withdrawing is a separate step: confirm the request in Telegram,
                then track the transfer to your wallet. Deposits are held as a
                platform balance.
              </p>
              <ButtonLink href="/wagers" variant="secondary">
                Understand stakes &amp; withdrawals
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
              <p className="text-caption text-fg-muted">
                Wager matches involve real money and you can lose your stake.
                Play responsibly. 18+.
              </p>
            </div>
            <Card>
              <WagerDemo />
            </Card>
          </div>
        </section>

        <section id="blog" className="shell-wide home-section" aria-labelledby="journal-heading">
          <div className="section-index">
            <span>06 / The chess journal</span>
            <span>Read. Think. Repeat.</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <h2 id="journal-heading" className="editorial-title">
              A little knowledge. A better position.
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
            <h2 id="break-heading">A good player knows when to take a break.</h2>
            <p>Set limits before you play, never chase losses, and return with a clear head. Free A.I. practice is always there for a game without a stake.</p>
          </div>
        </aside>

        <section id="faq" className="shell-wide home-section" aria-labelledby="faq-heading">
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Before your first move</span>
              <h2 id="faq-heading" className="editorial-title">
                Good questions. Clear answers.
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
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
