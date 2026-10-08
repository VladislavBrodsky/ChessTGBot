import { Badge, Eyebrow } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PlayButton } from "@/components/PlayButton";
import { PageHero } from "@/components/PageHero";
import { MatchPreview } from "@/components/MatchPreview";
import { ChessSculpture } from "@/components/ChessSculpture";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { pageMetadata, jsonLd } from "@/lib/seo";
import { SITE } from "@/lib/config";

export const metadata = pageMetadata(
  "How to Play Chess in Telegram",
  "Open Web3Chess, choose a time control and stake, and find your next opponent. A simple guide to matches, free practice, and results.",
  "/how-it-works",
);
const steps = [
  {
    number: "01",
    icon: "paper-plane-tilt" as const,
    title: "Open your new arena",
    body: "Tap Play in Telegram. Web3Chess opens as a Mini App, with your Telegram profile ready to get started.",
    note: "No separate app download",
  },
  {
    number: "02",
    icon: "clock" as const,
    title: "Pick your pace",
    body: "Choose your time control and match stake. Practise against A.I. for free, or join a player match with a USDT stake.",
    note: "Bullet, blitz, or rapid",
  },
  {
    number: "03",
    icon: "users-three" as const,
    title: "Meet your next rival",
    body: "Matchmaking considers your rating, time control, and stake. You can close the Mini App while you wait; the bot notifies you when an opponent is found.",
    note: "Notifications arrive in Telegram",
  },
  {
    number: "04",
    icon: "strategy" as const,
    title: "Make every move count",
    body: "Play on the board while the server validates legal moves and tracks the game state. Your match result appears in the app; any decided wager is settled to the platform balance.",
    note: "Balance credit and withdrawal are separate",
  },
];
export default function HowItWorksPage() {
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide space-y-16 py-6 md:space-y-20 md:py-10"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: SITE.url,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "How it works",
                  item: SITE.url + "/how-it-works",
                },
              ],
            }),
          }}
        />
        <PageHero
          eyebrow="From chat to checkmate"
          title={
            <>
              One tap.
              <br />
              Your next rival.
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
          className="grid items-center gap-8 md:grid-cols-2"
        >
          <div>
            <span className="eyebrow">A game that fits your day</span>
            <h2 id="tempo-heading" className="editorial-title mt-5">
              Find your tempo.
            </h2>
            <p className="mt-5 max-w-[42ch] text-lead text-fg-muted">
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
          <h2 id="journey-heading" className="editorial-title mb-8">
            An opening anyone can learn.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map((step) => (
              <Card key={step.number}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-overline text-fg-muted">
                    STEP {step.number}
                  </span>
                  <Icon name={step.icon} size={24} />
                </div>
                <h3 className="mt-6 text-heading-sm font-medium">
                  {step.title}
                </h3>
                <p className="mt-3 text-body text-fg-muted">{step.body}</p>
                <p className="mt-6 border-t border-line pt-4 text-caption font-semibold">
                  {step.note}
                </p>
              </Card>
            ))}
          </div>
        </section>
        <section aria-labelledby="paths-heading">
          <div className="section-index">
            <span>02 / Your way to play</span>
          </div>
          <h2 id="paths-heading" className="editorial-title mb-8">
            Warm up. Then decide.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <Badge icon="cpu">Free practice</Badge>
              <h3 className="mt-5 text-heading-md font-semibold">
                Room to experiment
              </h3>
              <p className="mt-3 text-body text-fg-muted">
                Learn a pattern, work through an Academy lesson, or test an
                opening against the A.I. No stake is required.
              </p>
              <ButtonLink href="/academy" variant="secondary" className="mt-6">
                Explore training
                <Icon name="arrow-up-right" size={16} />
              </ButtonLink>
            </Card>
            <Card>
              <Badge icon="users-three">Player matches · 18+</Badge>
              <h3 className="mt-5 text-heading-md font-semibold">
                Equal stakes, shared rules
              </h3>
              <p className="mt-3 text-body text-fg-muted">
                Choose a USDT stake before entering matchmaking. Both players
                commit the same amount. Read the settlement rules and fees
                first.
              </p>
              <ButtonLink href="/wagers" variant="secondary" className="mt-6">
                Understand wager matches
                <Icon name="arrow-up-right" size={16} />
              </ButtonLink>
              <p className="mt-4 text-caption text-fg-muted">
                You can lose your stake. Play within your limits.
              </p>
            </Card>
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>Before you sit down</Eyebrow>
          <div className="mt-5 grid gap-6 md:grid-cols-[1fr_.7fr] md:items-end">
            <div>
              <h2 className="poster text-heading-xl">
                Know the rules.
                <br />
                Enjoy the game.
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
