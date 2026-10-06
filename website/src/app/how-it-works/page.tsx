import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { howItWorksContent } from "@/content/howItWorks";
import { SITE, TIME_CONTROLS } from "@/lib/config";
import { Icon } from "@/icons";

export const metadata: Metadata = {
  title: "How It Works · Architecture & Mechanics",
  description:
    "How Web3Chess combines native Telegram Mini Apps, server-authoritative chess move validation, and instant 95% USDT checkmate payouts.",
  openGraph: {
    title: "How It Works · Web3Chess",
    description:
      "Zero app downloads, asynchronous push matchmaking, and real-time USDT chess wager settlements.",
    url: `${SITE.url}/how-it-works`,
  },
};

export default function HowItWorksPage() {
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
            <Icon name="strategy" size={14} />
            System Architecture
          </span>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <span className="tag">{howItWorksContent.hero.badge}</span>
          <h1 className="poster text-display-xl text-fg">
            {howItWorksContent.hero.headlineBefore}
            <br />
            {howItWorksContent.hero.headlineAfter}
          </h1>
          <p className="text-lead text-fg-muted max-w-[65ch]">
            {howItWorksContent.hero.lead}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <PlayButton size="lg" label="Play in Telegram" />
            <Link
              href="/academy"
              className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
            >
              Train in Academy
            </Link>
          </div>

          <p className="flex items-center gap-2 font-mono text-caption text-fg-muted">
            <Icon name="check" size={14} />
            {howItWorksContent.hero.ctaNote}
          </p>
        </section>

        {/* 4 Steps Journey */}
        <section aria-label="How Web3Chess Works" className="space-y-8">
          <div className="space-y-2">
            <span className="tag">The Player Journey</span>
            <h2 className="poster text-heading-xl">From Telegram Tap to Instant Payout</h2>
            <p className="text-body text-fg-muted max-w-[65ch]">
              Engineered with zero friction so you can focus entirely on your tactical moves.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {howItWorksContent.steps.map((st) => (
              <div
                key={st.step}
                className="flex flex-col justify-between rounded-card bg-surface p-7 sm:p-9"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="tag">{st.tag}</span>
                    <span className="poster text-display text-fg-link">{st.step}</span>
                  </div>

                  <h3 className="poster text-heading-lg">{st.title}</h3>
                  <p className="text-body text-fg-muted">{st.body}</p>

                  <div className="border-t border-line pt-4">
                    <ul className="grid gap-2 font-mono text-caption text-fg">
                      {st.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2">
                          <Icon name="check-circle" size={14} className="shrink-0 text-black" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Time Controls Callout */}
        <section className="rounded-card bg-surface p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-6">
              <span className="tag">Competitive Formats</span>
              <h2 className="poster text-heading-lg">Time Controls for Every Play Style</h2>
              <p className="text-body text-fg-muted">
                Whether you thrive in manic 1-minute bullet scrambles or prefer the deep positional calculation of 10-minute rapid, Web3Chess caters to your tempo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:col-span-6 sm:grid-cols-4">
              {TIME_CONTROLS.map((tc) => {
                const isBullet = tc === "1+0";
                const isBlitz = tc === "3+2" || tc === "5+0";
                return (
                  <div key={tc} className="flex flex-col justify-between rounded-card bg-inset p-5 text-center">
                    <span className="font-mono text-caption text-fg-muted uppercase">
                      {isBullet ? "Bullet" : isBlitz ? "Blitz" : "Rapid"}
                    </span>
                    <span className="poster my-3 text-heading-lg text-fg">{tc}</span>
                    <span className="font-mono text-[11px] text-fg-muted">
                      {isBullet ? "Ultra Fast" : isBlitz ? "Standard" : "Deep Calc"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison Matrix */}
        <section aria-labelledby="comparison-heading" className="space-y-6">
          <div className="space-y-2">
            <span className="tag">Competitive Edge</span>
            <h2 id="comparison-heading" className="poster text-heading-xl">
              {howItWorksContent.comparison.headline}
            </h2>
            <p className="text-body text-fg-muted">
              {howItWorksContent.comparison.subheadline}
            </p>
          </div>

          <div className="overflow-x-auto rounded-card bg-surface p-2 sm:p-4">
            <table className="w-full text-left font-mono text-body-sm">
              <thead>
                <tr className="border-b border-line text-overline uppercase text-fg-muted">
                  <th className="p-4">Feature</th>
                  <th className="p-4 text-black font-bold">Web3Chess</th>
                  <th className="p-4">Old Chess Sites</th>
                  <th className="p-4">Crypto Casinos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {howItWorksContent.comparison.rows.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-canvas">
                    <td className="p-4 font-semibold text-fg">{row.feature}</td>
                    <td className="p-4 font-bold text-fg-win">
                      <span className="inline-flex items-center gap-1.5">
                        <Icon name="check" size={14} />
                        {row.web3chess}
                      </span>
                    </td>
                    <td className="p-4 text-fg-muted">{row.traditional}</td>
                    <td className="p-4 text-fg-muted">{row.casinos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Fair Play & Anti-Cheat Deep Dive Link */}
        <section className="rounded-block bg-black p-8 sm:p-12 lg:p-16 text-white" data-surface="ink">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-4 lg:col-span-8">
              <span className="tag bg-zinc-800 text-zinc-200">Zero-Tolerance Anti-Cheat</span>
              <h2 className="poster text-display">Stockfish 17 Heuristic Telemetry</h2>
              <p className="text-lead text-zinc-400">
                Wagers demand absolute integrity. Our backend server monitors centipawn loss (ACPL) variance and millisecond move timings to guarantee games are fought by human brains alone.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link
                href="/fair-play"
                className="inline-flex min-h-14 items-center justify-center rounded-control bg-white px-6 text-button text-black transition-opacity hover:opacity-90"
              >
                Read Fair Play Protocol
              </Link>
              <Link
                href="/wagers"
                className="inline-flex min-h-14 items-center justify-center rounded-control border border-zinc-700 px-6 text-button text-white transition-colors hover:bg-zinc-900"
              >
                Review Wager Math
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
