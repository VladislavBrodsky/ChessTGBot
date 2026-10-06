import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { WagerDemo } from "@/components/WagerDemo";
import { wagersContent } from "@/content/wagers";
import { SITE, telegramLink } from "@/lib/config";
import { Icon, type IconName } from "@/icons";

export const metadata: Metadata = {
  title: "Wagers & Economics · Real USDT Chess",
  description:
    "Play real-stakes chess matches with transparent 95% winner payouts, 1 USDT minimum stakes, and instant TON wallet withdrawals.",
  openGraph: {
    title: "Wagers & Economics · Web3Chess",
    description:
      "Skill is the only edge. 95% winner pot, 3% platform fee, 2% referral pool. Instant settlements in USDT.",
    url: `${SITE.url}/wagers`,
  },
};

export default function WagersPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Nav />

      <main className="shell-wide space-y-16 py-8 md:space-y-20 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-surface px-4 py-2 font-mono text-overline uppercase text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>

          <span className="tag">
            <Icon name="coins" size={14} />
            Skill-Based Settlement
          </span>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <span className="tag">{wagersContent.hero.badge}</span>
          <h1 className="poster text-display-xl text-fg">
            {wagersContent.hero.headlineBefore}
            <br />
            {wagersContent.hero.headlineAfter}
          </h1>
          <p className="text-lead text-fg-muted max-w-[65ch]">
            {wagersContent.hero.lead}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <PlayButton size="lg" label="Play for USDT" />
            <Link
              href="/academy"
              className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
            >
              Practice Free First
            </Link>
          </div>

          <p className="flex items-center gap-2 font-mono text-caption text-fg-muted">
            <Icon name="check" size={14} />
            {wagersContent.hero.ctaNote}
          </p>
        </section>

        {/* Live Interactive Wager Calculator */}
        <section aria-labelledby="calc-heading" className="space-y-8">
          <div className="space-y-2">
            <span className="tag">Interactive Settlement Math</span>
            <h2 id="calc-heading" className="poster text-heading-xl">
              Transparent Payout Breakdown
            </h2>
            <p className="text-body text-fg-muted max-w-[65ch]">
              Select a stake to see the exact mathematical distribution of every wager match in real time.
            </p>
          </div>

          <div className="rounded-card bg-surface p-7 sm:p-10 lg:p-12 max-w-3xl">
            <WagerDemo />
          </div>
        </section>

        {/* Wager Tiers Grid */}
        <section aria-labelledby="tiers-heading" className="space-y-8">
          <div className="space-y-2">
            <span className="tag">Division Brackets</span>
            <h2 id="tiers-heading" className="poster text-heading-xl">
              Choose Your Adrenaline Tier
            </h2>
            <p className="text-body text-fg-muted max-w-[65ch]">
              From casual 1 USDT warmups to high-octane 25 USDT master matches, find the tier matching your bankroll.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wagersContent.tiers.map((t) => (
              <div
                key={t.tier}
                className="flex flex-col justify-between rounded-card bg-surface p-6 sm:p-7"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tag">{t.badge}</span>
                    <span className="font-mono text-body-sm font-semibold text-fg">{t.stake}</span>
                  </div>

                  <div>
                    <h3 className="poster text-heading-md">{t.tier}</h3>
                    <p className="mt-1 font-mono text-caption text-fg-muted">{t.recommendedFor}</p>
                  </div>

                  <p className="text-body-sm text-fg-muted">{t.desc}</p>

                  <div className="border-t border-line pt-4 space-y-2 font-mono text-body-sm">
                    <div className="flex justify-between text-fg-muted">
                      <span>Total Pot:</span>
                      <span className="text-fg font-semibold">{t.pot}</span>
                    </div>
                    <div className="flex justify-between text-fg-win font-bold">
                      <span>Winner Takes:</span>
                      <span>{t.winnerTakes}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line">
                  <a
                    href={telegramLink("arena")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-control bg-inset py-3 font-mono text-caption font-semibold text-fg transition-colors hover:bg-black hover:text-white"
                  >
                    Queue at {t.stake}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Economics Breakdown: 95% / 3% / 2% */}
        <section className="rounded-block bg-black p-8 sm:p-12 lg:p-16 text-white" data-surface="ink">
          <div className="max-w-3xl space-y-4">
            <span className="tag bg-zinc-800 text-zinc-200">Zero Hidden Deductions</span>
            <h2 className="poster text-display">{wagersContent.economics.headline}</h2>
            <p className="text-lead text-zinc-400">
              {wagersContent.economics.subheadline}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {wagersContent.economics.points.map((pt) => (
              <div
                key={pt.title}
                className="flex flex-col justify-between rounded-card bg-zinc-900 border border-zinc-800 p-6 sm:p-8"
              >
                <div>
                  <span className="poster text-stat text-[#fff100]">{pt.percent}</span>
                  <h3 className="poster mt-3 text-heading-md text-white">{pt.title}</h3>
                  <p className="mt-2 text-body-sm text-zinc-400">{pt.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust, Payouts & Security Grid */}
        <section aria-labelledby="trust-heading" className="space-y-8">
          <div className="space-y-2">
            <span className="tag">Treasury & Security</span>
            <h2 id="trust-heading" className="poster text-heading-xl">
              How Money Moves on Web3Chess
            </h2>
            <p className="text-body text-fg-muted max-w-[65ch]">
              Deposits, match stakes, winnings, and withdrawals are recorded with cryptographic precision.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {wagersContent.trustPoints.map((tp) => (
              <div key={tp.title} className="rounded-card bg-surface p-7 sm:p-8 space-y-3">
                <span className="grid size-11 place-items-center rounded-control bg-inset text-fg">
                  <Icon name={tp.icon as IconName} size={20} />
                </span>
                <h3 className="poster text-heading-md">{tp.title}</h3>
                <p className="text-body-sm text-fg-muted">{tp.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Responsible Gaming & 18+ Warning */}
        <section className="rounded-card border-2 border-line-strong bg-surface p-8 sm:p-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="grid size-14 shrink-0 place-items-center rounded-control bg-red-100 text-red-600">
              <Icon name="info" size={28} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="tag bg-red-100 text-red-800">18+ Required</span>
                <span className="font-mono text-caption text-fg-muted">Responsible Gaming Policy</span>
              </div>
              <p className="text-body font-medium text-fg">
                {wagersContent.riskNotice}
              </p>
              <p className="font-mono text-caption text-fg-muted">
                Always set a loss threshold before entering matches. If you feel tilted or fatigue sets in, step away and train in the Academy for free.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
