import { Eyebrow } from "@/components/ui/Badge";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PageHero } from "@/components/PageHero";
import { ChessSculpture } from "@/components/ChessSculpture";
import { FogBoard } from "@/components/FogBoard";
import { MoveOfTheDay } from "@/components/MoveOfTheDay";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { home } from "@/content/home";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Chess Academy — Openings, Tactics & Free Practice",
  "Build your chess skills with opening principles, tactical patterns, endgame lessons, and free A.I. practice inside Telegram.",
  "/academy",
);
const descriptions = [
  "Get comfortable with the board, the pieces, and the ideas that make chess worth learning.",
  "Control the center, develop your pieces, and bring your king to safety. Build an opening plan you understand.",
  "Recognize forks, pins, skewers, and mating patterns. Practise looking for checks, captures, and threats.",
  "Learn how to activate your king, create passed pawns, and make a small advantage count.",
];
export default function AcademyPage() {
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide space-y-16 py-6 md:space-y-20 md:py-10"
      >
        <PageHero
          eyebrow="The Web3Chess Academy"
          title={
            <>
              See more.
              <br />
              Play better.
            </>
          }
          lead="Build your board vision. Learn an idea, solve a puzzle, and try it in free A.I. practice."
          visual={<ChessSculpture variant="academy" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" label="Open the Academy" />
            <ButtonLink href="#challenge" variant="ghost">
              Try a challenge
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
          <p className="text-caption text-fg-muted">
            No stake for practice · No app download
          </p>
        </PageHero>
        <section id="challenge" aria-label="Try a chess challenge">
          <div className="section-index">
            <span>01 / Test your board vision</span>
            <span>A preview of tactical practice</span>
          </div>
          <MoveOfTheDay />
          <p className="mt-4 text-caption text-fg-muted">
            These website challenges are practice examples. Open the Mini App
            for the daily puzzle and your saved progress.
          </p>
        </section>
        <section
          aria-labelledby="opening-heading"
          className="grid items-center gap-8 md:grid-cols-2"
        >
          <div>
            <span className="eyebrow">A plan you understand</span>
            <h2 id="opening-heading" className="editorial-title mt-5">
              Make the first
              <br />
              moves make sense.
            </h2>
            <p className="mt-5 max-w-[42ch] text-lead text-fg-muted">
              Start with the Italian Game: control the center, develop your
              pieces, and prepare to castle. Learn the idea behind a move before
              memorizing a line.
            </p>
          </div>
          <Card className="mx-auto w-full max-w-100">
            <div className="mb-4 flex items-center justify-between">
              <Eyebrow>Opening principles</Eyebrow>
              <span className="font-mono text-caption">3. Bc4</span>
            </div>
            <FogBoard
              position="r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3"
              label="Italian Game after 1. e4 e5 2. Nf3 Nc6 3. Bc4. Black to move."
              showNotation
            />
            <p className="mt-4 text-caption text-fg-muted">
              Black to move. An opening example, not a forced winning line.
            </p>
          </Card>
        </section>
        <section aria-labelledby="tracks-heading">
          <div className="section-index">
            <span>02 / Find your next lesson</span>
            <span>Four mastery tracks</span>
          </div>
          <h2 id="tracks-heading" className="editorial-title mb-8">
            From the first move
            <br />
            to the final square.
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {home.academy.tracks.map((track, i) => (
              <Card key={track.name}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-overline text-fg-muted">
                    TRACK 0{i + 1}
                  </span>
                  <Icon
                    name={
                      i === 0
                        ? "globe"
                        : i === 1
                          ? "strategy"
                          : i === 2
                            ? "target"
                            : "crown-simple"
                    }
                    size={24}
                  />
                </div>
                <h3 className="mt-6 text-heading-sm font-medium">
                  {track.name}
                </h3>
                <p className="mt-3 text-body text-fg-muted">
                  {descriptions[i]}
                </p>
                <p className="mt-6 border-t border-line pt-4 font-mono text-caption">
                  {track.level}
                </p>
              </Card>
            ))}
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>Your training partner</Eyebrow>
          <div className="mt-5 grid items-end gap-8 md:grid-cols-[1fr_.7fr]">
            <div>
              <h2 className="poster text-heading-xl">
                Try the idea.
                <br />
                Learn from the game.
              </h2>
              <p className="mt-5 max-w-[45ch] text-body text-fg-muted">
                Test a new opening or tactical pattern against the A.I. Pick a
                difficulty in the app and learn from every move.
              </p>
            </div>
            <div className="space-y-4">
              <PlayButton
                size="lg"
                variant="onDark"
                label="Start free practice"
              />
              <p className="text-caption text-fg-muted">
                Practice builds skills. It does not guarantee a result in a
                player match.
              </p>
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
