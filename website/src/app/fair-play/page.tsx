import { Eyebrow, Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/magicui/border-beam";
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
export default function FairPlayPage() {
  return (
    <div>
      <Nav />
      <main
        id="main"
        className="shell-wide page-flow"
      >
        <PageHero
          eyebrow="Respect the board"
          title={
            <>
              Your mind.
              <br />
              Your moves
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
          <h2 id="rules-heading" className="editorial-title mb-6">
            Same board. Same rules
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1: 2 cols */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={12} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="cpu">
                    Authoritative Backend
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Stockfish 16 verification
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  The server keeps the board
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  The backend validates every move against the position and maintains the authoritative game state. Your device renders the board; it cannot force an illegal position or modify the game clock.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Deterministic server validation · Anti-tamper state</span>
              </div>
            </Card>

            {/* Pillar 2: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="clock">
                    Clock Integrity
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Monotonic sync
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  The clock is part of the game
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Play strictly within your selected time control. Server-side timestamps prevent client-side clock tampering, and disconnecting does not artificially pause your match clock.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>Authoritative timers</span>
              </div>
            </Card>

            {/* Pillar 3: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="users-three">
                    Skill Match
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Fair ELO pairing
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Rating-based matchmaking
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Matchmaking pools players by dynamic rating brackets, selected time control, and stake tier so you are paired against opponents of comparable strength.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Dynamic ELO bracket pool</span>
              </div>
            </Card>

            {/* Pillar 4: 2 cols */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={14} colorFrom="#10b981" colorTo="#f59e0b" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="shield-check">
                    Zero Engine Tolerance
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Neural &amp; timing analysis
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Your moves must be your own
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  Chess engines, bots, and outside assistance are prohibited in real matches. Heuristic models inspect move entropy, decision timing distributions, and engine correlation to maintain competitive purity.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Real-time heuristic auditing · Protected prize pools</span>
              </div>
            </Card>
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>A clear distinction</Eyebrow>
          <h2 className="poster mt-5 text-heading-xl">
            Legal moves.
            <br />
            Honest play
          </h2>
          <p className="mt-5 max-w-[60ch] section-lead text-fg-muted">
            Deterministic server validation prevents illegal moves, while multi-layer
            statistical models continuously analyze move timing distributions and engine correlation.
            Every cash prize pool is actively monitored to ensure true competitive integrity.
          </p>
          <p className="mt-5 max-w-[60ch] text-body text-fg-muted">
            If you ever notice suspicious play or wish to request an in-depth review, note
            the match identifier and contact support via the Telegram bot chat. Our integrity team
            audits flagged games using deep multi-engine heuristics.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          <Card className="flex flex-col items-start">
            <Eyebrow>Match results</Eyebrow>
            <h2 className="mt-5 text-heading-sm font-medium">
              Understand the outcome
            </h2>
            <p className="mt-3 text-body text-fg-muted">
              Checkmate, resignation, timeout, and draw rules determine the
              result. Wager settlement is recorded in your platform balance. A
              withdrawal to your wallet is a separate request.
            </p>
            <div className="mt-auto w-full pt-6">
            <ButtonLink href="/wagers" variant="secondary" size="lg">
              Read settlement &amp; withdrawals
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
            <p className="mt-4 min-h-10 text-caption text-fg-muted">
              Wager matches involve real money. You can lose your stake. 18+.
            </p>
            </div>
          </Card>
          <Card className="flex flex-col items-start">
            <Eyebrow>Your next game</Eyebrow>
            <h2 className="mt-5 text-heading-sm font-medium">
              Play with a clear head
            </h2>
            <p className="mt-3 text-body text-fg-muted">
              Set your limits before you join a wager match. If you want to
              experiment or learn without a stake, choose A.I. practice or the
              Academy.
            </p>
            <div className="mt-auto w-full pt-6">
              <PlayButton size="lg" trackingLocation="fair_play_cta" />
              <p className="mt-4 min-h-10 text-caption text-fg-muted">No stake for A.I. practice. Choose it in the Mini App.</p>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
