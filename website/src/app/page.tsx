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
import { KingMark } from "@/components/icons";
import { home } from "@/content/home";
import { BLOG_POSTS } from "@/content/blog";
import { SITE, SETTLEMENT } from "@/lib/config";
import { jsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Chess in Telegram — Play, Train & Compete",
  SITE.description,
  "",
);

const facts = [
  { value: "0", unit: "downloads", label: "Made for Telegram" },
  { value: "10", unit: "app languages", label: "Your game. Your language." },
  { value: "1", unit: "USDT minimum", label: "Choose your match stake" },
  {
    value: `${SETTLEMENT.winnerPercent}%`,
    unit: "winner share",
    label: "Of the combined match pot",
  },
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        url: SITE.url,
        logo: `${SITE.url}/icon.svg`,
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
      <main id="main">
        <section className="shell-wide hero-section">
          <div className="hero-copy">
            <div className="hero-intro">
              <Badge tone="accent" icon="telegram-logo">Chess. Now in Telegram.</Badge>
              <h1 className="poster hero-title">
                Skill is the
                <br />
                <span className="hero-emphasis">only edge</span>
              </h1>
            </div>
            <div className="hero-details">
              <p className="max-w-[38ch] text-lead text-fg-muted">
                Your favorite game. A whole new arena. Train for free, find your
                next rival, and put your chess skills to the test.
              </p>
              <div className="flex flex-wrap gap-3">
                <PlayButton size="lg" />
                <ButtonLink
                  href="#challenge"
                  variant="secondary"
                  className="min-h-14"
                >
                  Try a chess challenge
                  <Icon name="arrow-up-right" size={18} />
                </ButtonLink>
              </div>
              <p className="flex items-center gap-2 text-caption text-fg-muted">
                <Icon name="check-circle" size={16} />
                No download · Free A.I. practice · Human matches from 1 USDT
              </p>
              <p className="text-caption text-fg-muted">
                Wager matches: 18+. You can lose your stake.
              </p>
            </div>
          </div>
          <div className="hero-visual">
            <ChessSculpture />
          </div>
        </section>

        <section
          className="shell-wide facts-section"
          aria-label="Web3Chess at a glance"
        >
          <dl className="grid grid-cols-2 gap-y-6 md:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.unit} className="fact-item">
                <dt className="text-caption text-fg-muted">{fact.label}</dt>
                <dd className="mt-2 flex flex-wrap items-baseline gap-x-2">
                  <span className="poster text-stat">{fact.value}</span>
                  <span className="font-mono text-caption">{fact.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-caption text-fg-muted">
            Settlement: {SETTLEMENT.platformFeePercent}% platform fee +{" "}
            {SETTLEMENT.referralFeePercent}% referral allocation. Wager matches
            involve real money.{" "}
            <a href="/wagers" className="link-inline">
              See the full breakdown
            </a>
            .
          </p>
        </section>

        <section id="challenge" className="shell-wide section-y">
          <div className="section-index">
            <span>01 / A little tactical instinct</span>
            <span>White to move</span>
          </div>
          <MoveOfTheDay />
        </section>

        <section id="play" className="shell-wide section-y">
          <div className="section-index">
            <span>02 / From chat to checkmate</span>
            <span>Built around your day</span>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <span className="eyebrow">Your next match</span>
              <h2 className="editorial-title">
                Less waiting.
                <br />
                More playing.
              </h2>
              <p className="max-w-[42ch] text-lead text-fg-muted">
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

        <section className="shell-wide section-y">
          <div data-surface="ink" className="rounded-block p-7 sm:p-12 lg:p-14">
            <div className="section-index">
              <span>03 / The game comes first</span>
              <Icon name="strategy" size={20} />
            </div>
            <div className="grid gap-8 md:grid-cols-[1.15fr_1fr] md:items-end">
              <h2 className="poster text-heading-xl">
                You can’t buy
                <br />a better bishop.
              </h2>
              <p className="max-w-[42ch] text-lead text-fg-muted">
                Every piece follows the same rules. Your preparation, your
                decisions, and your clock management make the difference.
              </p>
            </div>
            <div className="mt-10 grid gap-6 border-t border-line pt-8 md:grid-cols-3">
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

        <section id="academy" className="shell-wide section-y">
          <div className="section-index">
            <span>04 / Build your board vision</span>
            <span>Practice is always free</span>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <span className="eyebrow">The Academy</span>
              <h2 className="editorial-title">
                Make your next
                <br />
                move a better one.
              </h2>
              <p className="max-w-[42ch] text-lead text-fg-muted">
                Learn opening principles. Spot the fork. Find the endgame plan.
                Build confidence with lessons, puzzles, and A.I. practice inside
                Telegram.
              </p>
              <ButtonLink href="/academy" variant="secondary">
                Explore the Academy
                <Icon name="arrow-right" size={18} />
              </ButtonLink>
            </div>
            <div className="grid gap-3">
              {home.academy.tracks.map((track, index) => (
                <Card
                  key={track.name}
                  className="flex items-center gap-4 p-5! sm:p-6!"
                >
                  <span className="font-mono text-caption text-fg-muted">
                    0{index + 1}
                  </span>
                  <h3 className="flex-1 text-title">{track.name}</h3>
                  <span className="hidden font-mono text-overline text-fg-muted sm:block">
                    {track.level}
                  </span>
                  <Icon name="book-open-text" size={20} />
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="wagers" className="shell-wide section-y">
          <div className="section-index">
            <span>05 / Know the numbers</span>
            <span>18+ wager matches</span>
          </div>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Card>
              <WagerDemo />
            </Card>
            <div className="space-y-5">
              <span className="eyebrow">Equal stakes. Clear math.</span>
              <h2 className="editorial-title">
                No mystery
                <br />
                in the match pot.
              </h2>
              <p className="max-w-[42ch] text-lead text-fg-muted">
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
          </div>
        </section>

        <section id="blog" className="shell-wide section-y">
          <div className="section-index">
            <span>06 / The chess journal</span>
            <span>Read. Think. Repeat.</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <h2 className="editorial-title">
              A little knowledge.
              <br />A better position.
            </h2>
            <ButtonLink href="/blog" variant="secondary">
              All stories
              <Icon name="arrow-up-right" size={18} />
            </ButtonLink>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        <section id="philosophy" className="shell-wide section-y">
          <Card className="grid items-center gap-8 md:grid-cols-[1fr_.45fr]">
            <div className="space-y-4">
              <span className="eyebrow">Know when to call it a game</span>
              <h2 className="editorial-title">
                A good player knows
                <br />
                when to take a break.
              </h2>
              <p className="max-w-[58ch] text-body text-fg-muted">
                Enjoy the competition. Set limits before you play, never chase
                losses, and come back with a clear head. A.I. practice is always
                there when you want a game without a stake.
              </p>
            </div>
            <div
              className="flex h-44 items-center justify-center"
              aria-hidden="true"
            >
              <KingMark className="topple h-36 w-auto text-fg" />
            </div>
          </Card>
        </section>

        <section id="faq" className="shell-wide section-y">
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Before your first move</span>
              <h2 className="editorial-title">
                Good questions.
                <br />
                Clear answers.
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
