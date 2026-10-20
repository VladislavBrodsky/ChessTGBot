import { Eyebrow } from "@/components/ui/Badge";
import { DetailCard, DetailGrid } from "@/components/ui/DetailCard";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { PageHero } from "@/components/PageHero";
import { WagerDemo } from "@/components/WagerDemo";
import { ChessSculpture } from "@/components/ChessSculpture";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { SettlementBreakdown } from "@/components/SettlementBreakdown";
import { pageMetadata, jsonLd, breadcrumbData, faqData } from "@/lib/seo";

const WAGERS_FAQS = [
  {
    question: "Is playing chess for real money legal?",
    answer:
      "Rules for real-money chess vary by location. Check the platform's eligibility terms and the requirements that apply where you live before joining a USDT match.",
  },
  {
    question: "How do USDT match stakes and 95% pot payouts work?",
    answer:
      "Both players commit equal USDT stakes from their app balances before play. In decided matches, 95% of the combined pot is credited to the winner's app balance (+90% net gain on the winner's stake).",
  },
  {
    question: "What happens if a match ends in a draw or stalemate?",
    answer:
      "In decided draws (by stalemate, threefold repetition, 50-move rule, or mutual agreement), both players receive 100% of their staked capital returned to their balance. There is zero house fee deduction on drawn matches.",
  },
  {
    question: "How fast are crypto withdrawals on GRAM rails?",
    answer:
      "Withdrawal timing depends on processing and network confirmation. Follow the status in Wallet; eligible requests may require a confirmation step in the Telegram bot before payout.",
  },
  {
    question: "Can I practice for free before wagering real stakes?",
    answer:
      "Yes. The Web3Chess Academy offers 100 tactical puzzle levels and unlimited practice matches against the Stockfish 16 engine completely free with zero deposit requirement.",
  },
] as const;

export const metadata = pageMetadata(
  "Play Chess for Money: Real USDT Stakes",
  "Explore optional USDT chess matches with clear stakes and fees. In a decided match, the winner receives 95% of the combined pot in their app balance.",
  "/wagers",
  [
    "play chess for money",
    "play chess for money online",
    "play chess for crypto",
    "usdt chess wager",
    "real money chess online",
    "chess cash games",
    "earn crypto playing chess",
    "crypto chess stakes",
    "web3 chess betting",
  ],
);
export default function WagersPage() {
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
                  { name: "Play Chess for Money", path: "/wagers" },
                ]),
                faqData(WAGERS_FAQS),
              ],
            }),
          }}
        />
        <PageHero
          eyebrow="Real-Money Chess · 18+"
          title={
            <>
              Play chess for money
              <br />
              with USDT stakes
            </>
          }
          lead="Equal stakes and clear fees. In a decided match, the winner receives 95% of the combined pot in their app balance. Review the rules and eligibility before wagering."
          visual={<ChessSculpture variant="wagers" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" trackingLocation="wagers_hero" />
            <ButtonLink href="/academy" variant="ghost">
              Practise free first
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
          <p className="text-caption text-fg-muted">
            You can lose your stake. Check the in-app fees and local eligibility
            before playing.
          </p>
        </PageHero>
        <section aria-labelledby="example-heading">
          <div className="section-index">
            <span>01 / See a worked example</span>
            <span>Worked pot &amp; fee breakdown</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
            <div>
              <h2 id="example-heading" className="editorial-title">
                Do the math before the match
              </h2>
              <p className="mt-3 max-w-[56ch] section-lead text-fg-muted">
                Select any stake tier to model the combined prize pool. In decided matches, 95% of the total pot is credited directly to the winner’s balance, yielding a +90% net gain on your stake.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-caption text-fg-muted">
              <Icon name="check-circle" size={16} className="text-fg-win" />
              <span>Transparent 95/5 settlement</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 items-stretch" data-interactive-workspace>
            <WagerDemo />
            <SettlementBreakdown />
          </div>

          <p className="mt-4 text-caption text-fg-muted text-center sm:text-left">
            Applies to decided matches. Draws follow separate match rules.
            You can lose your stake. 18+.
          </p>
        </section>
        <section aria-labelledby="balance-heading">
          <div className="section-index">
            <span>02 / How your balance moves</span>
            <span>From GRAM transfer to wallet payout</span>
          </div>
          <h2 id="balance-heading" className="editorial-title mb-6">
            From deposit to your own wallet
          </h2>

          <DetailGrid>
            <DetailCard span="wide" tone="accent" icon="wallet" badge="Deposit Rails" status="Sub-cent network gas" title="Deposit USDT on GRAM" meta="USDT on GRAM · Instant credit with ref comment">
              <p>Use the deposit instructions in the Wallet tab, including your unique reference comment. Check the network, token, address, and displayed fee before sending. Fast finality credits in seconds.</p>
            </DetailCard>
            <DetailCard icon="lightning" badge="Match Escrow" status="95% pot credit" title="Match escrow & settlement" meta="Locked pot settlement">
              <p>Both rivals commit matching stakes into match escrow at start. The decided victor claims 95% of the total pot instantly upon checkmate, resignation, or timeout.</p>
            </DetailCard>
            <DetailCard icon="paper-plane-tilt" badge="Telegram Confirmation" status="1-tap HMAC verification" title="Request & confirm withdrawal" meta="Bot chat confirmation">
              <p>Choose your withdrawal details in the app, then tap Confirm in the Telegram bot chat. Standard requests process immediately to your wallet.</p>
            </DetailCard>
            <DetailCard span="wide" tone="accent" icon="shield-check" badge="On-Chain Audit" status="Tonviewer verification" title="Track the completed transfer" meta="Verifiable on Tonviewer · Public ledger finality">
              <p>Once a transfer is broadcast, verify it on Tonviewer using the immutable blockchain hash. Web3Chess holds platform balances securely until withdrawal.</p>
            </DetailCard>
          </DetailGrid>
        </section>
        <section aria-labelledby="wagers-faq-heading" className="space-y-6">
          <div className="section-index">
            <span>03 / Transparent answers</span>
            <span>Wagers, legality &amp; payouts</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[.65fr_1fr]">
            <div className="space-y-4">
              <span className="eyebrow">Everything you need to know</span>
              <h2 id="wagers-faq-heading" className="editorial-title">
                Common questions on real-stakes chess
              </h2>
              <p className="text-body text-fg-muted">
                How pot settlements, pure-skill legal frameworks, and non-custodial crypto withdrawals operate.
              </p>
            </div>
            <Card>
              <div>
                {WAGERS_FAQS.map((item) => (
                  <details
                    key={item.question}
                    name="wagers-faq"
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
          <Eyebrow>A better starting point</Eyebrow>
          <div className="statement-cta">
            <h2 className="poster text-heading-xl">
              Set your limits
              <br />
              Keep your perspective
            </h2>
            <div className="statement-cta-copy">
              <p className="text-body">
                Only play with a stake you can afford to lose. Never chase
                losses. If you want to train or try a new idea, free A.I.
                practice is always an option.
              </p>
              <ButtonLink href="/academy" variant="secondary">
                Explore free practice
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
