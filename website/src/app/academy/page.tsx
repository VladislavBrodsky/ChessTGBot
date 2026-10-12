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
import { AcademyRoadmap } from "@/components/AcademyRoadmap";
import { pageMetadata, jsonLd, breadcrumbData, faqData } from "@/lib/seo";

const ACADEMY_FAQS = [
  {
    question: "Are all 100 tactical puzzles completely free?",
    answer:
      "Yes. The entire 100-level Academy tactical curriculum is 100% free with zero paywalls, timers, or subscription requirements. You can solve puzzles at your own pace with instant move-validation feedback.",
  },
  {
    question: "Can I practice unlimited games against Stockfish 16?",
    answer:
      "Yes. Web3Chess integrates an authoritative Stockfish 16 engine directly into both the Telegram Mini App and desktop web client. You can practice against multiple engine difficulties with zero stakes or deposit needed.",
  },
  {
    question: "How do chess puzzles help improve blitz and speed chess?",
    answer:
      "Pattern recognition is the foundation of speed chess. Solving tactical puzzles ingrains common forks, pins, skewers, back-rank mates, and deflection patterns into intuition, allowing you to calculate winning tactics in seconds during time scrambles.",
  },
  {
    question: "Do I need to download an app or register an account?",
    answer:
      "No. You can solve puzzles directly on this website, or launch the Telegram Mini App with one tap using your existing Telegram account—zero downloads, zero passwords, and zero friction.",
  },
] as const;

export const metadata = pageMetadata(
  "Free Chess Puzzles Online & Tactics Trainer",
  "Solve free chess puzzles online with instant feedback. Practice 100 tactical levels, master opening traps, and play unlimited games vs Stockfish 16 for free.",
  "/academy",
  [
    "free chess puzzles online",
    "online chess tactics trainer",
    "play chess vs stockfish online",
    "chess puzzles free",
    "chess tactics trainer",
    "learn chess tactics",
    "stockfish 16 chess practice",
    "free chess academy",
  ],
);

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
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                breadcrumbData([
                  { name: "Home", path: "" },
                  { name: "Free Chess Puzzles & Academy", path: "/academy" },
                ]),
                faqData(ACADEMY_FAQS),
              ],
            }),
          }}
        />
        <PageHero
          eyebrow="Free Chess Tactics Academy"
          title={
            <>
              Free chess puzzles
              <br />
              &amp; Stockfish trainer
            </>
          }
          lead="Sharpen your tactical vision. Solve 100 interactive puzzle levels, master opening traps, and play unlimited practice games vs Stockfish 16 for free."
          visual={<ChessSculpture variant="academy" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" label="Train in Telegram" trackingLocation="academy_hero" />
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
            <span>02 / Tactical mastery roadmap</span>
            <span>100-Level Academy Pipeline</span>
          </div>
          <h2 id="tracks-heading" className="editorial-title mb-6">
            From the first move to the final square
          </h2>
          <AcademyRoadmap />
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
        <section aria-labelledby="academy-faq-heading" className="space-y-6">
          <div className="section-index">
            <span>04 / Practice questions</span>
            <span>Puzzles, Stockfish &amp; progress</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Clear training answers</span>
              <h2 id="academy-faq-heading" className="editorial-title">
                Frequently asked questions on chess practice
              </h2>
              <p className="text-body text-fg-muted">
                How our 100 tactical levels, Stockfish 16 engine trainer, and mobile puzzle modes operate.
              </p>
            </div>
            <Card>
              <div>
                {ACADEMY_FAQS.map((item) => (
                  <details
                    key={item.question}
                    name="academy-faq"
                    className="group border-b border-line py-2 last:border-0"
                  >
                    <summary className="faq-question flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-fg marker:hidden">
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-fg-muted transition-transform duration-150 group-open:rotate-45"
                      >
                        <Icon name="plus" size={20} />
                      </span>
                    </summary>
                    <p className="pb-5 pt-1 text-body text-fg-muted">{item.answer}</p>
                  </details>
                ))}
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
                trackingLocation="academy_ai_practice"
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
