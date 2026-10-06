import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PlayButton } from "@/components/PlayButton";
import { MoveOfTheDay } from "@/components/MoveOfTheDay";
import { academyContent } from "@/content/academy";
import { SITE, telegramLink } from "@/lib/config";
import { Icon, type IconName } from "@/icons";

export const metadata: Metadata = {
  title: "Academy & Tactical Training · Web3Chess",
  description:
    "Master speed chess openings, calculate tactical combinations, and spar against Stockfish 17. Free interactive lessons inside Telegram.",
  openGraph: {
    title: "Academy & Tactical Training · Web3Chess",
    description:
      "Turn opening preparation into instant USDT wins. Free interactive chess tactics, endgame courses, and engine sparring.",
    url: `${SITE.url}/academy`,
  },
};

export default function AcademyPage() {
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
            <Icon name="graduation-cap" size={14} />
            Master Training Grounds
          </span>
        </div>

        {/* Hero Section */}
        <section className="space-y-6 max-w-4xl">
          <span className="tag">{academyContent.hero.badge}</span>
          <h1 className="poster text-display-xl text-fg">
            {academyContent.hero.headlineBefore}
            <br />
            {academyContent.hero.headlineAfter}
          </h1>
          <p className="text-lead text-fg-muted max-w-[65ch]">
            {academyContent.hero.lead}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <PlayButton size="lg" label="Open Academy in Telegram" />
            <Link
              href="/wagers"
              className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
            >
              See Wager Stakes
            </Link>
          </div>

          <p className="flex items-center gap-2 font-mono text-caption text-fg-muted">
            <Icon name="check" size={14} />
            {academyContent.hero.ctaNote}
          </p>
        </section>

        {/* Value Proposition Grid */}
        <section aria-label="Academy Pillars" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {academyContent.valueProps.map((prop) => (
            <div
              key={prop.title}
              className="flex flex-col justify-between gap-4 rounded-card bg-surface p-6 sm:p-7"
            >
              <div className="space-y-3">
                <span className="grid size-11 place-items-center rounded-control bg-inset text-fg">
                  <Icon name={prop.icon as IconName} size={20} />
                </span>
                <h2 className="poster text-heading-md">{prop.title}</h2>
              </div>
              <p className="text-body-sm text-fg-muted">{prop.body}</p>
            </div>
          ))}
        </section>

        {/* Interactive Move of the Day Module */}
        <section
          aria-labelledby="motd-heading"
          className="rounded-card bg-surface p-6 sm:p-10 lg:p-12"
        >
          <div className="mb-8 flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="tag">{academyContent.dailyPuzzle.badge}</span>
              <h2 id="motd-heading" className="poster mt-2 text-heading-lg">
                {academyContent.dailyPuzzle.headline}
              </h2>
            </div>
            <span className="hidden rounded-pill bg-inset px-4 py-1.5 font-mono text-caption sm:inline-block">
              Refreshes Daily
            </span>
          </div>

          <MoveOfTheDay />
        </section>

        {/* Tactical Mastery Tracks */}
        <section aria-labelledby="curriculum-heading" className="space-y-8">
          <div className="space-y-2">
            <span className="tag">Structured Curriculum</span>
            <h2 id="curriculum-heading" className="poster text-heading-xl">
              5 Precision Tracks to Dominate the Board
            </h2>
            <p className="text-body text-fg-muted max-w-[65ch]">
              Curated by competitive masters to eliminate the blind spots that cost money in high-speed wager matches.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {academyContent.tracks.map((track) => (
              <div
                key={track.id}
                className="flex flex-col justify-between rounded-card bg-surface p-6 sm:p-8"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="tag">{track.badge}</span>
                    <span className="rounded-pill bg-inset px-3 py-1 font-mono text-overline uppercase text-fg-muted">
                      {track.level}
                    </span>
                  </div>

                  <h3 className="poster text-heading-md">{track.title}</h3>
                  <p className="text-body-sm text-fg-muted">{track.description}</p>

                  <div className="border-t border-line pt-4">
                    <p className="font-mono text-overline uppercase text-fg-muted mb-2">Key Weapons:</p>
                    <ul className="grid gap-1.5 font-mono text-caption text-fg">
                      {track.keyConcepts.map((concept) => (
                        <li key={concept} className="flex items-center gap-2">
                          <span className="size-1 rounded-full bg-black shrink-0" />
                          <span>{concept}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 font-mono text-caption text-fg-muted">
                  <span>{track.lessonsCount} Interactive Lessons</span>
                  <span>{track.tacticsCount} Drills</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Sparring Engine Module */}
        <section className="rounded-block bg-black p-8 sm:p-12 lg:p-16 text-white" data-surface="ink">
          <div className="max-w-3xl space-y-4">
            <span className="tag bg-zinc-800 text-zinc-200">The Sparring Sandbox</span>
            <h2 className="poster text-display">{academyContent.aiSparring.headline}</h2>
            <p className="text-lead text-zinc-400">
              {academyContent.aiSparring.description}
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {academyContent.aiSparring.levels.map((lvl) => (
              <div
                key={lvl.elo}
                className="flex flex-col justify-between rounded-card bg-zinc-900 border border-zinc-800 p-6"
              >
                <div>
                  <span className="poster text-display text-[#fff100]">{lvl.elo}</span>
                  <h3 className="poster mt-2 text-heading-sm text-white">{lvl.name}</h3>
                  <p className="mt-2 text-body-sm text-zinc-400">{lvl.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <span className="font-mono text-caption text-zinc-500 uppercase">100% Free Practice</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-zinc-800 pt-8">
            <div className="space-y-1">
              <p className="poster text-heading-md text-white">Ready to test your opening prep?</p>
              <p className="text-body-sm text-zinc-400">Launch the engine right inside Telegram with zero installation.</p>
            </div>
            <PlayButton size="lg" label="Spar Against A.I." className="bg-[#fff100] text-black hover:bg-[#ffe600]" />
          </div>
        </section>

        {/* Transition to Wagers Banner */}
        <section className="rounded-card bg-surface p-8 sm:p-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="space-y-3 lg:col-span-8">
              <span className="tag">Next Step</span>
              <h2 className="poster text-heading-xl">Tired of playing for fake points?</h2>
              <p className="text-body sm:text-lead text-fg-muted max-w-[55ch]">
                Once your tactical muscle memory is calibrated, sit down at the wager boards. Beat your opponent and take 95% of the pot in real USDT.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4 sm:flex-row lg:flex-col">
              <Link
                href="/wagers"
                className="inline-flex min-h-14 items-center justify-center rounded-control bg-black px-6 text-button text-white transition-opacity hover:opacity-90"
              >
                Explore Wager Stakes
              </Link>
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-6 text-button text-fg transition-colors hover:bg-white"
              >
                Open Telegram App
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
