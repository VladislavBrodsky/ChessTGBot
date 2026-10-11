import { Eyebrow, Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/magicui/border-beam";
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
import { pageMetadata, jsonLd, breadcrumbData } from "@/lib/seo";

export const metadata = pageMetadata(
  "Free Chess Practice & Tactics",
  "Solve free chess puzzles, study opening principles and tactical patterns, then practise against A.I. in the Web3Chess Telegram Mini App.",
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
        className="shell-wide page-flow"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd(breadcrumbData([
              { name: "Home", path: "" },
              { name: "Chess Academy", path: "/academy" },
            ])),
          }}
        />
        <PageHero
          eyebrow="Free chess academy"
          title={
            <>
              See more.
              <br />
              Play better
            </>
          }
          lead="Build your board vision. Learn an idea, solve a puzzle, and try it in free A.I. practice."
          visual={<ChessSculpture variant="academy" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" label="Train in Telegram" />
            <ButtonLink href="#challenge" variant="ghost">
              Solve a free puzzle
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
          <p className="text-caption text-fg-muted">
            Free lessons, puzzles, and A.I. practice. Choose Academy after opening the Mini App.
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
          className="section-split"
        >
          <div>
            <span className="eyebrow">A plan you understand</span>
            <h2 id="opening-heading" className="editorial-title mt-5">
              Make the first moves make sense
            </h2>
            <p className="mt-5 max-w-[42ch] section-lead text-fg-muted">
              Start with the Italian Game: control the center, develop your
              pieces, and prepare to castle. Learn the idea behind a move before
              memorizing a line.
            </p>
            <ol className="opening-steps mt-6" aria-label="The ideas behind the Italian Game">
              <li><span className="font-mono">1. e4</span><p><strong>Claim the center.</strong> Give your bishop and queen room to develop.</p></li>
              <li><span className="font-mono">2. Nf3</span><p><strong>Develop with purpose.</strong> Bring out the knight and attack the pawn on e5.</p></li>
              <li><span className="font-mono">3. Bc4</span><p><strong>Activate the bishop.</strong> Aim at f7 and prepare to castle.</p></li>
            </ol>
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
          <h2 id="tracks-heading" className="editorial-title mb-6">
            From the first move to the final square
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Track 01: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="graduation-cap">
                    Track 01
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Start here
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Origins & Motivation
                </h3>
                <p className="text-body text-fg-muted mb-4">
                  {descriptions[0]}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>Board geometry · Core rules</span>
              </div>
            </Card>

            {/* Track 02: 2 cols with BorderBeam */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={14} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="strategy">
                    Track 02
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Develop with purpose
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Opening Principles
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  {descriptions[1]}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Center control · King safety · Sound plans</span>
              </div>
            </Card>

            {/* Track 03: 2 cols with BorderBeam */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={14} colorFrom="#f59e0b" colorTo="#10b981" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="lightning">
                    Track 03
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Calculate tactics
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Tactical Patterns
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  {descriptions[2]}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Forks · Pins · Skewers · Mating nets</span>
              </div>
            </Card>

            {/* Track 04: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="crown-simple">
                    Track 04
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Convert advantages
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Endgame Magic
                </h3>
                <p className="text-body text-fg-muted mb-4">
                  {descriptions[3]}
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-purple-500" />
                <span>King activity · Passed pawns · Precision</span>
              </div>
            </Card>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <PlayButton variant="ghost" label="Browse lessons in Telegram" />
            <p className="text-caption text-fg-muted">Open the Mini App, then choose Academy.</p>
          </div>
        </section>
        <section aria-labelledby="guides-heading">
          <div className="section-index">
            <span>03 / Take a useful idea into your next game</span>
            <span>Two practical guides</span>
          </div>
          <h2 id="guides-heading" className="editorial-title mb-6">
            Learn it. Then try it
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col items-start">
              <h3 className="text-heading-sm font-medium">Opening principles for beginners</h3>
              <p className="mt-3 text-body text-fg-muted">
                Control the center, develop with purpose, and keep your king safe before memorizing long variations.
              </p>
              <div className="mt-auto pt-6">
              <ButtonLink href="/blog/opening-mastery-tactics" variant="secondary">
                Read the opening guide
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
              </div>
            </Card>
            <Card className="flex flex-col items-start">
              <h3 className="text-heading-sm font-medium">Blitz chess time management</h3>
              <p className="mt-3 text-body text-fg-muted">
                Learn when to calculate deeply and when to choose a sound move quickly under a three-minute clock.
              </p>
              <div className="mt-auto pt-6">
              <ButtonLink href="/blog/the-3-minute-blitz-blueprint-tactics-time-management" variant="secondary">
                Read the blitz guide
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
              </div>
            </Card>
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>Your training partner</Eyebrow>
          <div className="mt-5 grid items-end gap-8 lg:grid-cols-[1fr_.7fr]">
            <div>
              <h2 className="poster text-heading-xl">
                Try the idea.
                <br />
                Learn from the game
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
                label="Start A.I. practice"
              />
              <p className="text-caption text-fg-muted">
                Choose A.I. practice in the Mini App. Practice builds skills;
                it does not guarantee a result in a player match.
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
