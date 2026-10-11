import { Eyebrow } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PlayButton } from "@/components/PlayButton";
import { PageHero } from "@/components/PageHero";
import { InfoGrid } from "@/components/InfoGrid";
import { MatchPreview } from "@/components/MatchPreview";
import { ChessSculpture } from "@/components/ChessSculpture";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { pageMetadata, jsonLd, breadcrumbData } from "@/lib/seo";
import { ArenaBento } from "@/components/ArenaBento";

export const metadata = pageMetadata(
  "Play Chess in Telegram — How It Works",
  "Open chess inside Telegram or in your browser, try free A.I. practice, and learn how invitations, time controls, and optional USDT matches work.",
  "/how-it-works",
);
const steps = [
  {
    title: "Open your new arena",
    body: "Tap Play in Telegram. Web3Chess opens as a Mini App, with your Telegram profile ready to get started.",
    note: "No separate app download",
  },
  {
    title: "Pick your pace",
    body: "Choose your time control and match stake. Practise against A.I. for free, or join a player match with a USDT stake.",
    note: "Bullet, blitz, or rapid",
  },
  {
    title: "Meet your next rival",
    body: "Matchmaking considers your rating, time control, and stake. You can close the Mini App while you wait; the bot notifies you when an opponent is found.",
    note: "Notifications arrive in Telegram",
  },
  {
    title: "Make every move count",
    body: "Play on the board while the server validates legal moves and tracks the game state. Your match result appears in the app; any decided wager is settled to the platform balance.",
    note: "Balance credit and withdrawal are separate",
  },
];

const questions = [
  {
    question: "Can I play chess inside Telegram without another download?",
    answer: "Yes. Open Web3Chess from its Telegram link and the board runs as a Mini App. You need Telegram, but there is no separate chess app to install.",
  },
  {
    question: "Can I practise chess for free?",
    answer: "Yes. The website puzzles and A.I. practice are free. Player matches currently use optional USDT stakes; read the match terms before joining one.",
  },
  {
    question: "How do I play chess with a friend?",
    answer: "Open the game lobby and choose Create Invite Link, then send the link to your friend in Telegram. Friend matches currently require a stake of at least 1 USDT, sufficient balances on both sides, and wager eligibility.",
  },
  {
    question: "Can I play on a computer?",
    answer: "Yes. The browser route opens a Telegram sign-in flow on desktop. You can also scan the Telegram QR code from a computer with your phone.",
  },
] as const;
export default function HowItWorksPage() {
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide page-flow"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(breadcrumbData([
              { name: "Home", path: "" },
              { name: "How it works", path: "/how-it-works" },
            ])),
          }}
        />
        <PageHero
          eyebrow="From chat to checkmate"
          title={
            <>
              One tap.
              <br />
              Your next rival
            </>
          }
          lead="Chess fits right into your Telegram day. Open the board, choose your pace, and let the next game begin."
          visual={<ChessSculpture variant="howItWorks" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" />
            <ButtonLink href="/academy" variant="ghost">
              Practise first
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
          <p className="text-caption text-fg-muted">
            Free A.I. practice · Human matches from 1 USDT · 18+ wagers
          </p>
        </PageHero>
        <section
          aria-labelledby="tempo-heading"
          className="section-split"
        >
          <div>
            <span className="eyebrow">A game that fits your day</span>
            <h2 id="tempo-heading" className="editorial-title mt-5">
              Find your tempo
            </h2>
            <p className="mt-5 max-w-[42ch] section-lead text-fg-muted">
              A quick burst of bullet or a little more thinking time? Explore
              the time controls, then choose your match in Telegram.
            </p>
          </div>
          <MatchPreview />
        </section>
        <section aria-labelledby="journey-heading">
          <div className="section-index">
            <span>01 / The player journey</span>
            <span>Four simple steps</span>
          </div>
          <h2 id="journey-heading" className="editorial-title mb-6">
            An opening anyone can learn
          </h2>
          <InfoGrid ordered items={steps.map((step) => ({
            title: step.title, body: step.body, note: step.note,
          }))} />
        </section>
        <section id="ecosystem" aria-labelledby="ecosystem-heading">
          <div className="section-index">
            <span>02 / The Web3Chess ecosystem</span>
            <span>Features, rewards &amp; game modes</span>
          </div>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h2 id="ecosystem-heading" className="editorial-title">
                Built for competitive chess and real crypto rewards
              </h2>
              <p className="max-w-[48ch] section-lead text-fg-muted mt-2">
                From micro-stakes PvP to high-roller tables, seasonal leaderboards, and 1,000 TON mystery jackpots — every move counts.
              </p>
            </div>
            <ButtonLink href="/wagers" variant="secondary">
              Stakes &amp; payout rules
              <Icon name="arrow-right" size={18} />
            </ButtonLink>
          </div>
          <ArenaBento />
        </section>
        <section aria-labelledby="questions-heading">
          <div className="section-index">
            <span>03 / Before your first move</span>
            <span>Clear answers</span>
          </div>
          <h2 id="questions-heading" className="editorial-title mb-6">
            Play your way
          </h2>
          <InfoGrid items={questions.map(({ question, answer }) => ({ title: question, body: answer }))} />
          <ButtonLink href="/play" variant="secondary" className="mt-6">
            Choose Telegram or browser
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>Before you sit down</Eyebrow>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <h2 className="poster text-heading-xl">
                Know the rules.
                <br />
                Enjoy the game
              </h2>
              <p className="mt-5 max-w-[48ch] text-body text-fg-muted">
                Connection issues do not guarantee a paused clock. Reconnect
                promptly, check the in-app rules, and use the bot chat for
                support when you need help.
              </p>
            </div>
            <ButtonLink href="/fair-play" variant="secondary">
              Read fair play &amp; match rules
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
        </section>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
