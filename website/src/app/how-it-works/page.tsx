import { Eyebrow } from "@/components/ui/Badge";
import { DetailCard, DetailGrid } from "@/components/ui/DetailCard";
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
import { pageMetadata, jsonLd, breadcrumbData, faqData, howToData } from "@/lib/seo";
import { ArenaBento } from "@/components/ArenaBento";

export const metadata = pageMetadata(
  "How to Play Chess in Telegram: Match Guide",
  "Complete guide on how to play chess in Telegram with Web3Chess. Learn how to launch the bot, challenge friends, choose time controls, and play for optional USDT crypto prizes.",
  "/how-it-works",
  [
    "how to play chess in telegram",
    "play chess in telegram",
    "telegram chess bot",
    "telegram chess guide",
    "play chess with friends telegram",
    "telegram chess rules",
    "earn crypto playing chess",
  ],
);

const questions = [
  {
    question: "Can I play chess inside Telegram without another download?",
    answer: "Yes. Web3Chess launches directly inside Telegram as a lightweight Mini App. Tap Play in chat and the full interactive board opens instantly with your Telegram profile — no separate app to install and zero password friction.",
  },
  {
    question: "Can I practise chess for free?",
    answer: "Yes. Interactive board vision puzzles, opening trainers, and Stockfish A.I. practice are 100% free with unlimited games. Real-money player matches use optional USDT stakes starting from 1 USDT.",
  },
  {
    question: "How do I play chess with a friend?",
    answer: "Open the game lobby and tap Create Invite Link, then share it directly in any Telegram chat. Your friend taps the link to enter the match table with matching stakes and real-time synchronized clocks.",
  },
  {
    question: "Can I play on a computer?",
    answer: "Yes. Play on any desktop browser using Telegram Web authentication, or scan the desktop QR code with your mobile camera to launch the board immediately.",
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
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                breadcrumbData([
                  { name: "Home", path: "" },
                  { name: "How to Play Chess in Telegram", path: "/how-it-works" },
                ]),
                faqData(questions),
                howToData({
                  name: "How to Play Chess in Telegram",
                  description: "Step-by-step guide to starting a chess match in Telegram using Web3Chess",
                  steps: [
                    { name: "Launch Web3Chess", text: "Tap Play inside any Telegram chat to open the lightweight Mini App." },
                    { name: "Choose Game Mode", text: "Select free Stockfish AI practice, Tactics Academy, or PvP Arena." },
                    { name: "Pair Opponent or Invite Friends", text: "Match with a global rival or share an invite link in Telegram chat." },
                  ],
                }),
              ],
            }),
          }}
        />
        <PageHero
          eyebrow="From chat to checkmate"
          title={
            <>
              How to play chess
              <br />
              in Telegram
            </>
          }
          lead="Launch the #1 Telegram chess bot, invite friends, and choose your pace. Enjoy free Stockfish A.I. practice or enter live USDT matches in seconds."
          visual={<ChessSculpture variant="howItWorks" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" trackingLocation="how_it_works_hero" />
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
          className="section-split tempo-split"
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
          <DetailGrid>
            <DetailCard span="wide" tone="accent" icon="lightning" badge="Step 01" status="Instant onboarding" title="Open your new arena" meta="One-tap Telegram launch · Zero friction">
              <p>Tap Play in Telegram. Web3Chess opens as a Mini App, with your Telegram profile ready to get started. No passwords, seed phrases, or separate app downloads required.</p>
            </DetailCard>
            <DetailCard icon="coins" badge="Step 02" status="Sub-cent fees" title="Pick your pace" meta="Free A.I. or USDT on GRAM">
              <p>Choose your time control and match stake. Practise against Stockfish A.I. for free, or join a real-money player match with a USDT stake on GRAM rails.</p>
            </DetailCard>
            <DetailCard icon="clock" badge="Step 03" status="Bullet · Blitz · Rapid" title="Meet your next rival" meta="Smart ELO matchmaking">
              <p>Matchmaking considers your rating, time control, and stake. You can close the Mini App while you wait; the bot notifies you in chat the second an opponent is paired.</p>
            </DetailCard>
            <DetailCard span="wide" tone="accent" icon="shield-check" badge="Step 04" status="95% winner payout" title="Make every move count" meta="Instant pot credit · Bot confirmed withdrawal">
              <p>Play on the board while the backend engine validates legal moves and tracks the clock. Decided matches immediately settle 95% of the pot to your balance. Withdraw with one tap in bot chat.</p>
            </DetailCard>
          </DetailGrid>
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
                Start with free AI practice and a first-three-games mystery box. USDT-staked player matches remain optional, with the pot and fees shown before you join.
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
          <div className="statement-cta">
            <h2 className="poster text-heading-xl">
              Know the rules
              <br />
              Enjoy the game
            </h2>
            <div className="statement-cta-copy">
              <p className="text-body">
                Matches run on authoritative server clocks. If your connection
                drops, reconnect promptly — the clock keeps ticking to guarantee
                fair pacing for both sides. Support is available 24/7 in the
                Telegram bot chat.
              </p>
              <ButtonLink href="/fair-play" variant="secondary">
                Read fair play &amp; match rules
                <Icon name="arrow-right" size={16} />
              </ButtonLink>
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
