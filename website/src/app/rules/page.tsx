import { Badge } from "@/components/ui/Badge";
import { DetailCard, DetailGrid } from "@/components/ui/DetailCard";
import { ChessPieceIcon } from "@/components/ChessPieceIcon";
import { InfoGrid } from "@/components/InfoGrid";
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

          <DetailGrid>
            {[
              {
                piece: "Pawn",
                glyph: "pawn" as const,
                rule: "Moves forward 1 square (or 2 on its first move). Captures 1 square diagonally forward. Promotes upon reaching the 8th rank.",
                tip: "The soul of chess · Controls key central outposts",
              },
              {
                piece: "Knight",
                glyph: "knight" as const,
                rule: "Moves in an 'L-shape' (2 squares in one direction, then 1 square perpendicular). The only piece that can jump over others.",
                tip: "Tricky forks · Excels in closed, congested positions",
              },
              {
                piece: "Bishop",
                glyph: "bishop" as const,
                rule: "Moves any number of vacant squares diagonally. Always stays on squares of its starting color (light-square or dark-square).",
                tip: "Long-range sniper · Controls open diagonals",
              },
              {
                piece: "Rook",
                glyph: "rook" as const,
                rule: "Moves any number of vacant squares horizontally or vertically along ranks and files. Powerful in open files and endgames.",
                tip: "Major piece (5 points) · Dominates the 7th rank",
              },
              {
                piece: "Queen",
                glyph: "queen" as const,
                rule: "Combines the power of a rook and bishop. Moves any number of vacant squares horizontally, vertically, or diagonally.",
                tip: "Most powerful piece (9 points) · Protect her early on",
              },
              {
                piece: "King",
                glyph: "king" as const,
                rule: "Moves exactly 1 square in any direction. The most vital piece: must never move into check. Checkmate ends the match.",
                tip: "Priceless piece · Active fighter in the endgame",
              },
            ].map((item) => (
              <DetailCard
                key={item.piece}
                tone="accent"
                badge={item.piece}
                aside={<span className="piece-tile" aria-hidden="true"><ChessPieceIcon piece={item.glyph} className="size-7" /></span>}
                title={`${item.piece} Movement`}
                meta={item.tip}
              >
                <p>{item.rule}</p>
              </DetailCard>
            ))}
          </DetailGrid>
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
            <DetailCard tone="accent" icon="shield-check" badge="King Safety Move" status="Kingside & Queenside" title="How to Castle in Chess">
              <p>Castling is the only move where you move two pieces in a single turn. The king moves two squares toward a rook, and that rook hops over the king to the adjacent square.</p>
              <ul className="detail-checks">
                <li>
                  <Icon name="check" size={14} />
                  <span>Neither the king nor the castling rook has moved yet.</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>All squares between the king and rook are empty.</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>The king is not currently in check, and does not cross or land on attacked squares.</span>
                </li>
              </ul>
            </DetailCard>
            <DetailCard icon="lightning" badge="Pawn Rule" status="In Passing" title="En Passant Explained Simply">
              <p>When an enemy pawn moves two squares forward from its starting rank and lands directly beside your pawn on the 5th rank (4th for Black), you can capture it diagonally behind it as if it had only moved one square.</p>
              <ul className="detail-checks">
                <li>
                  <Icon name="check" size={14} />
                  <span>Applies strictly to pawns on the adjacent file.</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>Must be played on the immediate next turn, or the right is forfeited.</span>
                </li>
                <li>
                  <Icon name="check" size={14} />
                  <span>Prevents pawns from bypassing enemy control squares untouched.</span>
                </li>
              </ul>
            </DetailCard>
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

          <DetailGrid>
            <DetailCard tone="accent" badge="Victory (1 - 0)" title="How Checkmate Works">
              <p>Checkmate happens when a king is placed in check (under attack) and has no legal escape: it cannot move away, cannot block the checking line, and cannot capture the attacker. The game ends instantly in victory.</p>
            </DetailCard>
            <DetailCard badge="Draw (½ - ½)" title="How Stalemate Works">
              <p>Stalemate occurs when the player whose turn it is is NOT in check, but has zero legal moves anywhere on the board. Stalemate is a draw. Be careful not to accidentally stalemate an opponent when up material!</p>
            </DetailCard>
            <DetailCard badge="Draw Conditions" title="What is a Draw in Chess">
              <p>Draws also occur via threefold repetition (same position occurs 3 times), the 50-move rule (50 moves without a capture or pawn push), mutual agreement, or insufficient mating material (e.g. King vs King).</p>
            </DetailCard>
          </DetailGrid>
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
            <DetailCard tone="accent" icon="clock" badge="Time Controls" status="Bullet · Blitz · Rapid" title="Chess Time Controls Explained">
              <p>Each player has an individual clock that counts down only when it is their turn to move. In Web3Chess, choose from standard FIDE paces:</p>
              <ul className="detail-checks">
                <li><Icon name="clock" size={14} /><span><strong className="text-fg">1+0 Bullet:</strong> 1 minute total per player. Lightning pace.</span></li>
                <li><Icon name="clock" size={14} /><span><strong className="text-fg">3+2 Blitz:</strong> 3 minutes + 2 seconds added per move. Standard competitive format.</span></li>
                <li><Icon name="clock" size={14} /><span><strong className="text-fg">5+0 Blitz:</strong> 5 minutes flat. High tactical intensity.</span></li>
                <li><Icon name="clock" size={14} /><span><strong className="text-fg">10+0 Rapid:</strong> 10 minutes total. Strategic room for calculation.</span></li>
              </ul>
            </DetailCard>
            <DetailCard icon="lightning" badge="Flagging" status="0:00 Timeout" title="What Happens When Clock Runs Out">
              <p>When your timer hits 0:00, you are &quot;flagged&quot;. The match result depends on the remaining board material:</p>
              <ul className="detail-checks">
                <li><Icon name="x" size={14} className="text-fg-loss" /><span><strong className="text-fg">Opponent has mating material:</strong> You lose the game on time.</span></li>
                <li><Icon name="check" size={14} /><span><strong className="text-fg">Opponent has insufficient material:</strong> The game is declared a Draw (FIDE 6.9).</span></li>
              </ul>
            </DetailCard>
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

          <InfoGrid items={rulesFaqs.map(({ question, answer }) => ({ title: question, body: answer }))} />
        </section>

        {/* ── Section 6: Next Steps / Practice CTA ── */}
        <section aria-label="Practise the rules">
          <Card className="flex flex-col items-center border border-line text-center sm:p-10">
            <Badge tone="accent" icon="graduation-cap" className="mb-4">
              Put Rules Into Practice
            </Badge>
            <h2 className="poster text-heading-lg max-w-[24ch]">
              Ready to test your chess rules knowledge?
            </h2>
            <p className="mt-3 max-w-[46ch] text-body text-fg-muted">
              Solve interactive tactical puzzles in the Academy or play unlimited free practice games with Free Coach in Telegram.
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
