import { Eyebrow, Badge } from "@/components/ui/Badge";
import { BorderBeam } from "@/components/magicui/border-beam";
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
import { pageMetadata, jsonLd, breadcrumbData } from "@/lib/seo";

export const metadata = pageMetadata(
  "USDT Chess Matches — Stakes, Fees & Withdrawals",
  "Understand Web3Chess wager matches: equal USDT stakes, the 95% winner share, platform balances, and withdrawal confirmation in Telegram.",
  "/wagers",
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
            __html: jsonLd(breadcrumbData([
              { name: "Home", path: "" },
              { name: "USDT chess matches", path: "/wagers" },
            ])),
          }}
        />
        <PageHero
          eyebrow="Know the numbers · 18+"
          title={
            <>
              Your stake.
              <br />
              The full picture
            </>
          }
          lead="Equal stakes. Clear fees. Understand the pot, your balance, and withdrawals before you play."
          visual={<ChessSculpture variant="wagers" />}
        >
          <div className="page-hero-actions flex flex-wrap gap-3">
            <PlayButton size="lg" />
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
        <section
          aria-labelledby="example-heading"
          className="wager-workspace"
        >
          <div className="wager-intro">
            <div className="section-index"><span>01 / See a worked example</span></div>
            <h2 id="example-heading" className="editorial-title mt-5">
              Do the math before the match
            </h2>
            <p className="mt-5 max-w-[44ch] section-lead text-fg-muted">
              Choose an example stake and follow each part of the combined pot.
              The winner’s credit includes their original stake; it is not all
              profit.
            </p>
          </div>
          <Card className="wager-calculator">
            <WagerDemo />
          </Card>
          <div className="wager-split" aria-label="Combined pot allocation">
            <SettlementBreakdown />
            <p className="mt-4 text-caption text-fg-muted">
              Applies to decided matches. Draws follow separate match rules.
              You can lose your stake. 18+.
            </p>
          </div>
        </section>
        <section aria-labelledby="balance-heading">
          <div className="section-index">
            <span>02 / How your balance moves</span>
            <span>Non-custodial deposit to wallet</span>
          </div>
          <h2 id="balance-heading" className="editorial-title mb-6">
            From deposit to your own wallet
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Treasury Step 1: 2 cols */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={12} colorFrom="#3b82f6" colorTo="#10b981" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="wallet">
                    Deposit Rails
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Sub-cent network gas
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Deposit USDT on TON
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  Use the deposit instructions in the Wallet tab, including your unique reference comment. Check the network, token, address, and displayed fee before sending. Fast finality credits in seconds.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>USDT on TON · Instant credit with ref comment</span>
              </div>
            </Card>

            {/* Treasury Step 2: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="lightning">
                    Match Escrow
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    95% pot credit
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Play from platform balance
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Both rivals commit equal stakes at match start. The decided victor claims 95% of the combined pot directly to their balance.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-blue-500" />
                <span>Locked pot settlement</span>
              </div>
            </Card>

            {/* Treasury Step 3: 1 col */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-1">
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="neutral" icon="paper-plane-tilt">
                    Telegram Confirmation
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    1-tap HMAC verification
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Request &amp; confirm withdrawal
                </h3>
                <p className="text-body-sm text-fg-muted mb-4">
                  Choose your withdrawal details in the app, then tap Confirm in the Telegram bot chat. Standard requests process immediately to your wallet.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-amber-500" />
                <span>Non-custodial release</span>
              </div>
            </Card>

            {/* Treasury Step 4: 2 cols */}
            <Card className="flex flex-col justify-between p-6 bg-surface border border-line relative overflow-hidden group lg:col-span-2">
              <BorderBeam size={280} duration={14} colorFrom="#10b981" colorTo="#059669" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <Badge tone="accent" icon="shield-check">
                    On-Chain Audit
                  </Badge>
                  <span className="font-mono text-caption text-fg-muted font-medium">
                    Tonviewer verification
                  </span>
                </div>
                <h3 className="text-heading-sm font-medium tracking-tight mb-2">
                  Track the completed transfer
                </h3>
                <p className="text-body text-fg-muted max-w-[50ch] mb-4">
                  Once a transfer is broadcast, verify it on Tonviewer using the immutable blockchain hash. Web3Chess holds platform balances securely until withdrawal.
                </p>
              </div>
              <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line text-caption font-mono text-fg-muted">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span>Verifiable on Tonviewer · Public ledger finality</span>
              </div>
            </Card>
          </div>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>A better starting point</Eyebrow>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_.7fr] lg:items-end">
            <div>
              <h2 className="poster text-heading-xl">
                Set your limits.
                <br />
                Keep your perspective
              </h2>
              <p className="mt-5 max-w-[50ch] text-body text-fg-muted">
                Only play with a stake you can afford to lose. Never chase
                losses. If you want to train or try a new idea, free A.I.
                practice is always an option.
              </p>
            </div>
            <ButtonLink href="/academy" variant="secondary">
              Explore free practice
              <Icon name="arrow-right" size={16} />
            </ButtonLink>
          </div>
        </section>
      </main>
      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
