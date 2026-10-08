import { Eyebrow } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PageHero } from "@/components/PageHero";
import { ChessSculpture } from "@/components/ChessSculpture";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Fair Play & Chess Match Rules",
  "Learn how Web3Chess validates moves, handles match clocks, and expects players to compete without outside assistance.",
  "/fair-play",
);
const pillars = [
  {
    icon: "cpu" as const,
    title: "The server keeps the board",
    body: "The backend validates moves against the position and maintains the authoritative game state. Your device displays the game; it does not decide which moves are legal.",
  },
  {
    icon: "clock" as const,
    title: "The clock is part of the game",
    body: "Play within your selected time control. Reconnect promptly if you lose connection: leaving the app is not a guarantee that your clock pauses.",
  },
  {
    icon: "users-three" as const,
    title: "Matchmaking considers your rating",
    body: "Your rating, selected time control, and stake help determine the matchmaking pool. Ratings are a guide to pairing, not a guarantee of equal strength.",
  },
  {
    icon: "shield-check" as const,
    title: "Your moves must be your own",
    body: "Do not use chess engines, outside analysis, or another person to choose moves during a player match. Free A.I. practice is a separate training mode.",
  },
];
export default function FairPlayPage() {
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide space-y-16 py-6 md:space-y-20 md:py-10"
      >
        <PageHero
          eyebrow="Respect the board"
          title={
            <>
              Your mind.
              <br />
              Your moves.
            </>
          }
          lead="Great chess needs clear rules and honest opponents. Here’s how the game is validated, and what we expect from everyone at the board."
          visual={<ChessSculpture variant="fairPlay" />}
        >
          <ButtonLink href="#fair-play-rules" variant="secondary">
            Read the essentials
            <Icon name="arrow-right" size={16} />
          </ButtonLink>
        </PageHero>
        <section id="fair-play-rules" aria-labelledby="rules-heading">
          <div className="section-index">
            <span>01 / The essentials</span>
            <span>Fair play starts with you</span>
          </div>
          <h2 id="rules-heading" className="editorial-title mb-8">
            Same board. Same rules.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pillars.map((pillar) => (
              <Card key={pillar.title}>
                <span className="grid size-12 place-items-center rounded-media bg-inset">
                  <Icon name={pillar.icon} size={24} />
                </span>
                <h3 className="mt-6 text-heading-sm font-medium">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-body text-fg-muted">{pillar.body}</p>
              </Card>
            ))}
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>A clear distinction</Eyebrow>
          <h2 className="poster mt-5 text-heading-xl">
            Legal moves.
            <br />
            Honest play.
          </h2>
          <p className="mt-5 max-w-[60ch] text-lead text-fg-muted">
            Server validation catches illegal moves. It does not, on its own,
            prove that a player has avoided outside assistance. We do not
            promise that any online chess platform can eliminate cheating.
          </p>
          <p className="mt-5 max-w-[60ch] text-body text-fg-muted">
            If you notice suspicious play or a result you want reviewed, keep
            the match identifier and contact support through the bot chat. Avoid
            public accusations based on one strong move.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <Eyebrow>Match results</Eyebrow>
            <h2 className="mt-5 text-heading-sm font-medium">
              Understand the outcome
            </h2>
            <p className="mt-3 text-body text-fg-muted">
              Checkmate, resignation, timeout, and draw rules determine the
              result. Wager settlement is recorded in your platform balance. A
              withdrawal to your wallet is a separate request.
            </p>
            <ButtonLink href="/wagers" variant="secondary" className="mt-6">
              Read settlement &amp; withdrawals
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
            <p className="mt-4 text-caption text-fg-muted">
              Wager matches involve real money. You can lose your stake. 18+.
            </p>
          </Card>
          <Card>
            <Eyebrow>Your next game</Eyebrow>
            <h2 className="mt-5 text-heading-sm font-medium">
              Play with a clear head
            </h2>
            <p className="mt-3 text-body text-fg-muted">
              Set your limits before you join a wager match. If you want to
              experiment or learn without a stake, choose A.I. practice or the
              Academy.
            </p>
            <PlayButton size="lg" className="mt-6" />
          </Card>
        </section>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
