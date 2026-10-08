import { Eyebrow } from "@/components/ui/Badge";
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
import { SETTLEMENT } from "@/lib/config";
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
        className="shell-wide space-y-16 py-6 md:space-y-20 md:py-10"
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
              The full picture.
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
          className="grid items-center gap-8 md:grid-cols-2"
        >
          <div>
            <span className="eyebrow">See a worked example</span>
            <h2 id="example-heading" className="editorial-title mt-5">
              Do the math
              <br />
              before the match.
            </h2>
            <p className="mt-5 max-w-[44ch] text-lead text-fg-muted">
              Choose an example stake and follow each part of the combined pot.
              The winner’s credit includes their original stake; it is not all
              profit.
            </p>
          </div>
          <Card>
            <WagerDemo />
          </Card>
        </section>
        <section aria-labelledby="split-heading">
          <div className="section-index">
            <span>01 / A decided match</span>
            <span>Every part of the pot</span>
          </div>
          <h2 id="split-heading" className="editorial-title mb-8">
            Equal in. Clear out.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                percent: SETTLEMENT.winnerPercent,
                name: "Winner’s balance",
                body: "Credited to the winner’s platform balance after a decided match. This includes the winner’s original stake.",
              },
              {
                percent: SETTLEMENT.platformFeePercent,
                name: "Platform fee",
                body: "The platform’s share of the combined pot. This is separate from any deposit or withdrawal fee shown in the app.",
              },
              {
                percent: SETTLEMENT.referralFeePercent,
                name: "Referral allocation",
                body: "Allocated by the settlement system to the referral pool. Referral eligibility follows the program rules.",
              },
            ].map((part) => (
              <Card key={part.name}>
                <p className="poster text-display">{part.percent}%</p>
                <h3 className="mt-5 text-heading-sm font-medium">
                  {part.name}
                </h3>
                <p className="mt-3 text-body text-fg-muted">{part.body}</p>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-caption text-fg-muted">
            The example reflects the current settlement implementation. Draws
            follow separate match rules. Wager matches involve real money and
            you can lose your stake. 18+.
          </p>
        </section>
        <section aria-labelledby="balance-heading">
          <div className="section-index">
            <span>02 / How your balance moves</span>
          </div>
          <h2 id="balance-heading" className="editorial-title mb-8">
            From deposit
            <br />
            to your own wallet.
          </h2>
          <ol className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Deposit USDT on TON",
                body: "Use the deposit instructions in the Wallet tab, including your unique reference comment. Check the network, token, address, and displayed fee before sending. A swap or purchase into your personal wallet is not a platform deposit.",
              },
              {
                title: "Play from your platform balance",
                body: "Deposits are credited to a balance held by Web3Chess. Both players commit equal stakes at match start. A decided match settles winnings to the platform balance.",
              },
              {
                title: "Request and confirm a withdrawal",
                body: "Choose your withdrawal details in the app, then follow the bot chat instructions. Standard requests wait for your confirmation; larger requests may require additional review.",
              },
              {
                title: "Track the completed transfer",
                body: "Once a transfer is sent, verify it on Tonviewer using the transaction information. Confirmation, review, and network processing mean withdrawal timing can vary.",
              },
            ].map((step, i) => (
              <li key={step.title}>
                <Card className="h-full">
                  <span className="font-mono text-overline text-fg-muted">
                    0{i + 1}
                  </span>
                  <h3 className="mt-5 text-heading-sm font-medium">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-body text-fg-muted">{step.body}</p>
                </Card>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-body-sm text-fg-muted">
            Web3Chess holds deposits as a platform balance until withdrawal. It
            is not a self-custody wallet.
          </p>
        </section>
        <section data-surface="ink" className="statement-panel">
          <Eyebrow>A better starting point</Eyebrow>
          <div className="mt-5 grid gap-8 md:grid-cols-[1fr_.7fr] md:items-end">
            <div>
              <h2 className="poster text-heading-xl">
                Set your limits.
                <br />
                Keep your perspective.
              </h2>
              <p className="mt-5 max-w-[50ch] text-lead text-fg-muted">
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
