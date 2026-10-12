import { Badge } from "@/components/ui/Badge";
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
import { pageMetadata, jsonLd, breadcrumbData, faqData, howToData } from "@/lib/seo";

export const metadata = pageMetadata(
  "Chess Rules for Beginners: Step-by-Step Guide",
  "Learn how to play chess step by step. Complete beginner rules: piece movements, castling, en passant, checkmate, stalemate, and chess clocks.",
  "/rules",
  [
    "chess rules for beginners",
    "how to play chess step by step",
    "how does checkmate work",
    "how does a chess clock work",
    "what is a draw in chess",
    "how does stalemate work in chess",
    "how to castle in chess",
    "en passant explained simply",
    "chess time controls explained",
    "what happens when chess clock runs out",
  ],
);

const rulesFaqs = [
  {
    question: "How does checkmate work in chess?",
    answer:
      "Checkmate occurs when a player's king is under direct attack (in check) and there are no legal moves to escape. Escape options are: moving the king to an unattacked square, capturing the attacking piece, or blocking the attack with another piece. If none are possible, it is checkmate and the game immediately ends in victory.",
  },
  {
    question: "How does stalemate work in chess?",
    answer:
      "Stalemate occurs when the player whose turn it is to move is NOT in check, but has zero legal moves remaining anywhere on the board. Stalemate immediately ends the game in a draw (half a point for each player), regardless of how many pieces the opponent still has.",
  },
  {
    question: "How do you castle in chess?",
    answer:
      "Castling is a special move where the king moves two squares toward a rook, and the rook hops over to the square the king skipped. Requirements: neither piece has moved yet, all squares between them are empty, the king is not in check, and the king does not pass through or land on an attacked square.",
  },
  {
    question: "How does en passant work in chess?",
    answer:
      "En passant ('in passing') allows a pawn to capture an enemy pawn that moves forward two squares from its starting square, landing adjacent to yours. You capture it diagonally as if it had only moved forward one square. The capture must be made on the very next turn, or the right to capture en passant is permanently lost.",
  },
  {
    question: "What happens when a chess clock runs out?",
    answer:
      "When a player's clock reaches 0:00 (called 'flagging'), they lose the match on time—provided the opponent has sufficient material to deliver checkmate. If the opponent has insufficient material (such as a bare king or king and knight), the game ends in a draw according to FIDE Article 6.9.",
  },
] as const;

export default function RulesPage() {
  return (
    <div>
      <Nav />
      <main id="main" className="shell-wide page-flow">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                breadcrumbData([
                  { name: "Home", path: "" },
                  { name: "Chess Rules Guide", path: "/rules" },
                ]),
                faqData(rulesFaqs),
                howToData({
                  name: "How to Play Chess Step by Step",
                  description:
                    "Official rules of chess for beginners: piece movement, special rules, checkmate, and clocks.",
                  steps: [
                    {
                      name: "Learn the Board & Piece Movements",
                      text: "Set up the 64-square board with light square in the bottom right corner. Understand how pawns, knights, bishops, rooks, queens, and kings move.",
                    },
                    {
                      name: "Master Special Rules",
                      text: "Learn castling for king safety, en passant pawn captures, and pawn promotion upon reaching the 8th rank.",
                    },
                    {
                      name: "Understand Checkmate vs Stalemate",
                      text: "Deliver checkmate by trapping the enemy king. Avoid stalemate when you have a winning material advantage.",
                    },
                    {
                      name: "Play with Clocks and Time Controls",
                      text: "Manage time controls such as Bullet (1+0), Blitz (3+2), or Rapid (10+0) with server-synchronized timers.",
                    },
                  ],
                }),
              ],
            }),
          }}
        />

        <PageHero
          eyebrow="Official FIDE Rules"
          title={
            <>
              Chess rules
              <br />
              for beginners
            </>
          }
          lead="Learn how to play chess step by step. Master piece movements, castling, en passant, checkmate, stalemate, and how chess clocks work."
          visual={<ChessSculpture variant="academy" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" label="Practise free in Telegram" trackingLocation="rules_hero" />
            <ButtonLink href="/academy" variant="secondary">
              Solve beginner puzzles
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
          <p className="text-caption text-fg-muted">
            100% free rules guide · Zero paywalls · FIDE standard laws
          </p>
        </PageHero>

        {/* ── Section 1: Piece Movements Step-by-Step ── */}
        <section id="step-by-step" aria-labelledby="movement-heading">
          <div className="section-index">
            <span>01 / Fundamentals</span>
            <span>How to play chess step by step</span>
          </div>
          <h2 id="movement-heading" className="editorial-title mb-6">
            How each chess piece moves
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                piece: "Pawn",
                icon: "shield-check" as const,
                rule: "Moves forward 1 square (or 2 on its first move). Captures 1 square diagonally forward. Promotes upon reaching the 8th rank.",
                tip: "The soul of chess · Controls key central outposts",
              },
              {
                piece: "Knight",
                icon: "lightning" as const,
                rule: "Moves in an 'L-shape' (2 squares in one direction, then 1 square perpendicular). The only piece that can jump over others.",
                tip: "Tricky forks · Excels in closed, congested positions",
              },
              {
                piece: "Bishop",
                icon: "strategy" as const,
                rule: "Moves any number of vacant squares diagonally. Always stays on squares of its starting color (light-square or dark-square).",
                tip: "Long-range sniper · Controls open diagonals",
              },
              {
                piece: "Rook",
                icon: "lock" as const,
                rule: "Moves any number of vacant squares horizontally or vertically along ranks and files. Powerful in open files and endgames.",
                tip: "Major piece (5 points) · Dominates the 7th rank",
              },
              {
                piece: "Queen",
                icon: "crown-simple" as const,
                rule: "Combines the power of a rook and bishop. Moves any number of vacant squares horizontally, vertically, or diagonally.",
                tip: "Most powerful piece (9 points) · Protect her early on",
              },
              {
                piece: "King",
                icon: "medal" as const,
                rule: "Moves exactly 1 square in any direction. The most vital piece: must never move into check. Checkmate ends the match.",
                tip: "Priceless piece · Active fighter in the endgame",
              },
            ].map((item) => (
              <Card key={item.piece} className="flex flex-col justify-between p-5 bg-surface border border-line">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <Badge tone="accent">
                      {item.piece}
                    </Badge>
                    <Icon name={item.icon} size={18} className="text-fg-muted" />
                  </div>
                  <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                    {item.piece} Movement
                  </h3>
                  <p className="text-body-sm text-fg-muted leading-relaxed">
                    {item.rule}
                  </p>
                </div>
                <div className="pt-3 mt-4 border-t border-line text-caption font-mono text-fg-muted">
                  {item.tip}
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 2: Special Moves (Castling & En Passant) ── */}
        <section id="special-moves" aria-labelledby="special-heading">
          <div className="section-index">
            <span>02 / Special moves</span>
            <span>Castling &amp; en passant</span>
          </div>
          <h2 id="special-heading" className="editorial-title mb-6">
            How to castle in chess &amp; en passant explained simply
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <BorderBeam size={260} duration={12} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="shield-check">
                    King Safety Move
                  </Badge>
                  <span className="font-mono text-caption text-emerald-600 font-semibold">
                    Kingside &amp; Queenside
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  How to Castle in Chess
                </h3>
                <p className="text-body text-fg-muted mb-4 leading-relaxed">
                  Castling is the only move where you move two pieces in a single turn. The king moves two squares toward a rook, and that rook hops over the king to the adjacent square.
                </p>

                <div className="space-y-2 border-t border-line pt-3 font-mono text-caption text-fg-muted">
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Neither the king nor the castling rook has moved yet.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>All squares between the king and rook are empty.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>The king is not currently in check, and does not cross or land on attacked squares.</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="lightning">
                    Pawn Rule
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-semibold">
                    In Passing
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  En Passant Explained Simply
                </h3>
                <p className="text-body text-fg-muted mb-4 leading-relaxed">
                  When an enemy pawn moves two squares forward from its starting rank and lands directly beside your pawn on the 5th rank (4th for Black), you can capture it diagonally behind it as if it had only moved one square.
                </p>

                <div className="space-y-2 border-t border-line pt-3 font-mono text-caption text-fg-muted">
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Applies strictly to pawns on the adjacent file.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Must be played on the immediate next turn, or the right is forfeited.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="check" size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Prevents pawns from bypassing enemy control squares untouched.</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Section 3: Checkmate, Stalemate & Draws ── */}
        <section id="checkmate-stalemate" aria-labelledby="endgame-heading">
          <div className="section-index">
            <span>03 / Game outcomes</span>
            <span>Checkmate, stalemate &amp; draws</span>
          </div>
          <h2 id="endgame-heading" className="editorial-title mb-6">
            How checkmate, stalemate &amp; draws work in chess
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-6 bg-surface border border-line">
              <Badge tone="accent" className="mb-3">Victory (1 - 0)</Badge>
              <h3 className="text-heading-sm font-medium mb-2">How Checkmate Works</h3>
              <p className="text-body-sm text-fg-muted leading-relaxed">
                Checkmate happens when a king is placed in check (under attack) and has no legal escape: it cannot move away, cannot block the checking line, and cannot capture the attacker. The game ends instantly in victory.
              </p>
            </Card>

            <Card className="p-6 bg-surface border border-line">
              <Badge tone="neutral" className="mb-3">Draw (½ - ½)</Badge>
              <h3 className="text-heading-sm font-medium mb-2">How Stalemate Works</h3>
              <p className="text-body-sm text-fg-muted leading-relaxed">
                Stalemate occurs when the player whose turn it is is NOT in check, but has zero legal moves anywhere on the board. Stalemate is a draw. Be careful not to accidentally stalemate an opponent when up material!
              </p>
            </Card>

            <Card className="p-6 bg-surface border border-line">
              <Badge tone="neutral" className="mb-3">Draw Conditions</Badge>
              <h3 className="text-heading-sm font-medium mb-2">What is a Draw in Chess</h3>
              <p className="text-body-sm text-fg-muted leading-relaxed">
                Draws also occur via threefold repetition (same position occurs 3 times), the 50-move rule (50 moves without a capture or pawn push), mutual agreement, or insufficient mating material (e.g. King vs King).
              </p>
            </Card>
          </div>
        </section>

        {/* ── Section 4: Chess Clocks & Time Controls ── */}
        <section id="clocks-time" aria-labelledby="clocks-heading">
          <div className="section-index">
            <span>04 / Time management</span>
            <span>Chess clocks &amp; flagging</span>
          </div>
          <h2 id="clocks-heading" className="editorial-title mb-6">
            How chess clocks &amp; time controls work
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6 bg-surface border border-line">
              <div className="flex items-center justify-between gap-3 mb-3">
                <Badge tone="accent" icon="clock">Time Controls</Badge>
                <span className="font-mono text-caption text-fg-muted">Bullet · Blitz · Rapid</span>
              </div>
              <h3 className="text-heading-sm font-medium mb-2">Chess Time Controls Explained</h3>
              <p className="text-body-sm text-fg-muted leading-relaxed mb-4">
                Each player has an individual clock that counts down only when it is their turn to move. In Web3Chess, choose from standard FIDE paces:
              </p>
              <ul className="space-y-2 text-caption font-mono text-fg-muted border-t border-line pt-3">
                <li><strong>1+0 Bullet:</strong> 1 minute total per player. Lightning pace.</li>
                <li><strong>3+2 Blitz:</strong> 3 minutes + 2 seconds added per move. Standard competitive format.</li>
                <li><strong>5+0 Blitz:</strong> 5 minutes flat. High tactical intensity.</li>
                <li><strong>10+0 Rapid:</strong> 10 minutes total. Strategic room for calculation.</li>
              </ul>
            </Card>

            <Card className="p-6 bg-surface border border-line">
              <div className="flex items-center justify-between gap-3 mb-3">
                <Badge tone="neutral" icon="lightning">Flagging</Badge>
                <span className="font-mono text-caption text-amber-600 font-semibold">0:00 Timeout</span>
              </div>
              <h3 className="text-heading-sm font-medium mb-2">What Happens When Clock Runs Out</h3>
              <p className="text-body-sm text-fg-muted leading-relaxed mb-4">
                When your timer hits 0:00, you are &quot;flagged&quot;. The match result depends on the remaining board material:
              </p>
              <div className="space-y-2.5 text-caption font-mono text-fg-muted border-t border-line pt-3">
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span><strong>Opponent has mating material:</strong> You lose the game on time.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><strong>Opponent has insufficient material:</strong> The game is declared a Draw (FIDE 6.9).</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* ── Section 5: Frequently Asked Questions ── */}
        <section id="faq" aria-labelledby="rules-faq-heading">
          <div className="section-index">
            <span>05 / Rules FAQ</span>
            <span>Clear answers for beginners</span>
          </div>
          <h2 id="rules-faq-heading" className="editorial-title mb-6">
            Frequently asked chess rules questions
          </h2>

          <div className="space-y-3">
            {rulesFaqs.map((faq) => (
              <Card key={faq.question} className="p-5 bg-surface border border-line">
                <h3 className="text-heading-xs font-semibold text-fg-default mb-2">
                  {faq.question}
                </h3>
                <p className="text-body-sm text-fg-muted leading-relaxed">
                  {faq.answer}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Section 6: Next Steps / Practice CTA ── */}
        <section className="shell-wide my-8">
          <Card className="p-8 text-center bg-surface border border-line flex flex-col items-center">
            <Badge tone="accent" icon="graduation-cap" className="mb-4">
              Put Rules Into Practice
            </Badge>
            <h2 className="poster text-heading-lg max-w-[24ch]">
              Ready to test your chess rules knowledge?
            </h2>
            <p className="mt-3 max-w-[46ch] text-body text-fg-muted">
              Solve interactive tactical puzzles in the Academy or play unlimited free practice games against Stockfish 16 AI in Telegram.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <PlayButton size="lg" pulsating trackingLocation="rules_cta" />
              <ButtonLink href="/academy" variant="secondary">
                Enter Tactics Academy
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
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
