import { Eyebrow } from "@/components/ui/Badge";
import { DetailCard, DetailGrid } from "@/components/ui/DetailCard";
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
import { pageMetadata, jsonLd, breadcrumbData, faqData } from "@/lib/seo";

const FAIR_PLAY_FAQS = [
  {
    question: "How does Web3Chess validate legal chess moves?",
    answer:
      "Every move is sent to the backend, which checks it against the current position with a chess rules library before applying it. Client WebViews only render display boards—no client code can modify pieces, execute illegal moves, or manipulate clock state.",
  },
  {
    question: "How does Web3Chess handle chess bots and external engines?",
    answer:
      "Engines, bots, and outside help are banned in real matches. There is no automated engine detection today: server validation proves a move is legal, not that it was unaided. Wager matchmaking never pairs two accounts on the same IP address, a referrer with their own referral, or your last five wager opponents. If you suspect an opponent, report the game so it can be reviewed.",
  },
  {
    question: "What happens if a player disconnects during a match?",
    answer:
      "The server keeps both clocks, with no lag compensation and no pause for a dropped connection. If a player disconnects, their clock continues ticking down. If they reconnect before time expires, the match resumes from the current position. If their clock reaches 0:00, the game ends on time: a loss, or a draw if the opponent has too little material to checkmate.",
  },
  {
    question: "How do I report suspected cheating or unfair play?",
    answer:
      "Note the match ID and contact platform support directly via the Telegram bot. The server stores the full move list and result of every finished game, so a reported game can be reviewed move by move.",
  },
] as const;

export const metadata = pageMetadata(
  "Fair Play & Anti-Cheat Rules: Server Move Validation",
  "Learn how Web3Chess protects matches with server-side move validation, tamper-proof clocks, anti-collusion wager pairing, and clear rules against engine use.",
  "/fair-play",
  [
    "online chess anti cheating rules",
    "how online chess validates legal moves",
    "fair play chess rules",
    "skill based chess",
    "tamper proof chess clocks",
    "web3 chess integrity",
  ],
);
export default function FairPlayPage() {
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
                  { name: "Fair Play & Anti-Cheat", path: "/fair-play" },
                ]),
                faqData(FAIR_PLAY_FAQS),
              ],
            }),
          }}
        />
        <PageHero
          eyebrow="Integrity &amp; Anti-Cheat"
          title={
            <>
              Fair play &amp;
              <br />
              anti-cheat rules
            </>
          }
          lead="Great chess needs clear rules, tamper-proof clocks, and honest opponents. The server validates every move and keeps both clocks, so no client can force an illegal position."
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

          <DetailGrid>
            <DetailCard span="wide" tone="accent" icon="cpu" badge="Authoritative Backend" status="Server move validation" title="The server keeps the board" meta="Deterministic server validation · Anti-tamper state">
              <p>The backend validates every move against the position and maintains the authoritative game state. Your device renders the board; it cannot force an illegal position or modify the game clock.</p>
            </DetailCard>
            <DetailCard icon="clock" badge="Clock Integrity" status="Server timestamps" title="The clock is part of the game" meta="Authoritative timers">
              <p>Play strictly within your selected time control. Server-side timestamps prevent client-side clock tampering, and disconnecting does not artificially pause your match clock.</p>
            </DetailCard>
            <DetailCard icon="users-three" badge="Skill Match" status="Fair ELO pairing" title="Rating-based matchmaking" meta="Dynamic ELO bracket pool">
              <p>Matchmaking pools players by dynamic rating brackets, selected time control, and stake tier so you are paired against opponents of comparable strength.</p>
            </DetailCard>
            <DetailCard span="wide" tone="accent" icon="shield-check" badge="Zero Engine Tolerance" status="Banned in real matches" title="Your moves must be your own" meta="Rule enforcement · Anti-collusion pairing">
              <p>Chess engines, bots, and outside assistance are prohibited in real matches. Server validation proves a move is legal, not that it was unaided, so report any game you suspect and it can be reviewed from the stored move list.</p>
            </DetailCard>
          </DetailGrid>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>A clear distinction</Eyebrow>
          <div className="statement-cta">
            <h2 className="poster text-heading-xl">
              Legal moves
              <br />
              Honest play
            </h2>
            <div className="statement-cta-copy">
              <p className="section-lead">
                Deterministic server validation prevents illegal moves, while wager matchmaking
                refuses to pair accounts on the same IP address, referral-linked accounts, and recent
                opponents. Engine assistance is banned in every real match, with or without a stake.
              </p>
              <p className="text-body">
                If you ever notice suspicious play or wish to request an in-depth review, note
                the match identifier and contact support via the Telegram bot chat. Flagged games are
                reviewed from the move list the server stored for that match.
              </p>
            </div>
          </div>
        </section>
        <section aria-labelledby="fair-play-faq-heading" className="space-y-6">
          <div className="section-index">
            <span>02 / Integrity FAQs</span>
            <span>Anti-cheat, clocks &amp; disputes</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Clear integrity answers</span>
              <h2 id="fair-play-faq-heading" className="editorial-title">
                Frequently asked questions on fair play
              </h2>
              <p className="text-body text-fg-muted">
                How server-side move validation, anti-collusion pairing, and tamper-proof clocks protect players.
              </p>
            </div>
            <Card>
              <div>
                {FAIR_PLAY_FAQS.map((item) => (
                  <details
                    key={item.question}
                    name="fair-play-faq"
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
              experiment or learn without a stake, choose Free Coach practice or the
              Academy.
            </p>
            <div className="mt-auto w-full pt-6">
              <PlayButton size="lg" trackingLocation="fair_play_cta" />
              <p className="mt-4 min-h-10 text-caption text-fg-muted">No stake for Free Coach practice. Choose it in the Mini App.</p>
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
