import Link from "next/link";
import { Check, Clock, Gift, Globe, Shield, Sparkles, Swords, Trophy, Wallet, ArrowUpRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { PlayButton } from "@/components/PlayButton";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { FogBoard } from "@/components/FogBoard";
import { WagerDemo } from "@/components/WagerDemo";
import { MoveOfTheDay } from "@/components/MoveOfTheDay";
import { BlogCard } from "@/components/BlogCard";
import { Faq } from "@/components/Faq";
import { KingMark } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { home } from "@/content/home";
import { BLOG_POSTS } from "@/content/blog";
import { SITE, TIME_CONTROLS } from "@/lib/config";
import { qrSvg } from "@/lib/qr";
import { telegramLink } from "@/lib/config";

const PROGRESSION_ICONS = [Sparkles, Trophy, Gift, Swords, Shield, Globe] as const;

/** Opera Game final position — verified mate with chess.js. */
const OPERA_FEN = "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17";

export default async function HomePage() {
  const footerQr = await qrSvg(telegramLink());

  return (
    <div id="top">
      <Nav />

      <main id="main">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="shell-main pb-16 pt-6 text-center md:pt-12">
          <h1 className="text-display text-fg">
            <span className="sr-only">{home.hero.headlinePlain}</span>
            <span aria-hidden="true">
              {home.hero.headlineBefore}
              <span className="tittle-host">
                &#305;
                <span className="tittle" />
              </span>
              {home.hero.headlineAfter}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[36ch] text-lead text-fg-muted">{home.hero.lead}</p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <PlayButton size="lg" />
            <p className="text-caption text-fg-muted">{home.hero.ctaNote}</p>
          </div>

          <div className="mx-auto mt-14 max-w-100">
            <FogBoard
              position={OPERA_FEN}
              label="The final position of the Opera Game: White has just played rook to d8, checkmate."
              squareStyles={{ d8: { backgroundColor: "rgba(255, 255, 0, 0.45)" } }}
            />
            <p className="mt-4 text-caption text-fg-muted">{home.hero.boardCaption}</p>
          </div>
        </section>

        {/* ── Proof chips ────────────────────────────────────────── */}
        <section className="shell-content pb-8">
          <ul className="flex flex-wrap justify-center gap-2">
            {home.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-pill border border-line-ghost bg-chip px-4 py-2 text-chip text-fg-action"
              >
                {chip}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Matchmaking ────────────────────────────────────────── */}
        <section id="play" className="section-y">
          <div className="shell-content grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <h2 className="text-heading-lg text-fg">{home.play.title}</h2>
              <p className="mt-4 max-w-[36ch] text-lead text-fg-muted">{home.play.lead}</p>
              <ul className="mt-6 grid gap-3">
                {home.play.points.map((point) => (
                  <li key={point} className="flex gap-3 text-body-sm">
                    <Check className="mt-0.5 size-5 shrink-0 text-icon" strokeWidth={1.5} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="rounded-card bg-surface p-card shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-pill bg-chip px-3 py-1 text-overline uppercase">
                    <span className="size-2 rounded-pill bg-loss-fill animate-live" aria-hidden="true" />
                    Searching
                  </span>
                  <span className="font-mono text-label text-fg-muted">3+2</span>
                </div>
                <p className="mt-5 text-title">Finding an opponent near your rating…</p>
                <p className="mt-2 text-body-sm text-fg-muted">
                  You can close Telegram. We&apos;ll message you the moment someone sits down.
                </p>
                <div className="mt-6 flex flex-wrap gap-2" aria-label="Time controls">
                  {TIME_CONTROLS.map((tc) => (
                    <span
                      key={tc}
                      className="rounded-pill border border-line bg-inset px-4 py-2 font-mono text-label text-fg-action"
                    >
                      {tc}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-caption text-fg-muted">Example of the in-app matchmaking screen.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Wagers ─────────────────────────────────────────────── */}
        <section id="wagers" className="section-y">
          <div className="shell-content grid items-center gap-10 md:grid-cols-12">
            <div className="order-2 md:order-1 md:col-span-7">
              <WagerDemo />
            </div>
            <div className="order-1 md:order-2 md:col-span-5">
              <h2 className="text-heading-lg text-fg">{home.wagers.title}</h2>
              <p className="mt-4 max-w-[36ch] text-lead text-fg-muted">{home.wagers.lead}</p>
              <p className="mt-5 flex gap-2 text-caption text-fg-muted">
                <Shield className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {home.wagers.risk}
              </p>
            </div>
          </div>
        </section>

        {/* ── Academy ────────────────────────────────────────────── */}
        <section id="academy" className="section-y">
          <div className="shell-content grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <h2 className="text-heading-lg text-fg">{home.academy.title}</h2>
              <p className="mt-4 max-w-[36ch] text-lead text-fg-muted">{home.academy.lead}</p>
            </div>
            <ul className="grid gap-3 md:col-span-7">
              {home.academy.tracks.map((track) => (
                <li
                  key={track.name}
                  className="flex items-center justify-between gap-4 rounded-card bg-surface p-5 shadow-card"
                >
                  <span className="text-title">{track.name}</span>
                  <span className="rounded-pill bg-inset px-3 py-1 text-overline uppercase text-fg-muted">
                    {track.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Money (Night panel) ────────────────────────────────── */}
        <section id="money" className="section-y">
          <div className="shell-main">
            <div data-surface="night" className="rounded-panel p-panel">
              <h2 className="text-heading-xl text-fg">{home.money.title}</h2>
              <p className="mt-4 max-w-[42ch] text-lead text-fg-muted">{home.money.lead}</p>

              <div className="mt-10 grid gap-6 lg:grid-cols-12">
                <ul className="grid gap-4 lg:col-span-5">
                  {home.money.points.map((point) => (
                    <li key={point.title} className="rounded-card bg-surface p-5">
                      <p className="text-title text-fg">{point.title}</p>
                      <p className="mt-2 text-body-sm text-fg-muted">{point.body}</p>
                    </li>
                  ))}
                </ul>

                <div className="rounded-card border border-line bg-surface p-5 lg:col-span-7">
                  <p className="text-overline uppercase text-fg-muted">Example ledger</p>
                  <ul className="mt-4 grid gap-1">
                    {[
                      { icon: Wallet, title: "Deposit", meta: "Today, 11:24", amount: "+25.00 USDT", tone: "text-fg" },
                      { icon: Swords, title: "Match wager", meta: "Today, 11:31", amount: "−5.00 USDT", tone: "text-fg" },
                      { icon: Trophy, title: "Winnings", meta: "Today, 11:44", amount: "+9.50 USDT", tone: "text-fg-win" },
                      { icon: Clock, title: "Withdrawal", meta: "Today, 12:02", amount: "−20.00 USDT", tone: "text-fg", status: "Checking" },
                    ].map((row) => (
                      <li key={row.title} className="flex items-center gap-4 border-b border-line-soft py-3 last:border-0">
                        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-inset text-icon">
                          <row.icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-semibold text-fg">{row.title}</span>
                          <span className="block text-caption text-fg-muted">{row.meta}</span>
                        </span>
                        {row.status && (
                          <span className="rounded-pill bg-inset px-3 py-1 text-overline uppercase text-fg-caution">
                            {row.status}
                          </span>
                        )}
                        <span className={`font-semibold tabular-nums ${row.tone}`}>{row.amount}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-caption text-fg-muted">
                    Example rows. A 5 USDT wager makes a 10 USDT pot, and the winner receives 9.50 USDT.
                  </p>
                </div>
              </div>

              <p className="mt-8 flex gap-2 text-caption text-fg-muted">
                <Shield className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {home.money.custodyNote}
              </p>
            </div>
          </div>
        </section>

        {/* ── Progression ────────────────────────────────────────── */}
        <section id="progression" className="section-y">
          <div className="shell-main">
            <h2 className="text-heading-lg text-fg">{home.progression.title}</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.progression.tiles.map((tile, i) => {
                const Icon = PROGRESSION_ICONS[i] ?? Sparkles;
                return (
                <li key={tile.title} className="rounded-panel bg-surface p-6 shadow-card">
                  <span className="grid size-10 place-items-center rounded-control bg-inset text-icon">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-title">{tile.title}</p>
                  <p className="mt-2 text-body-sm text-fg-muted">{tile.body}</p>
                </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ── Mission (Ink band) ─────────────────────────────────── */}
        <section className="section-y">
          <div className="shell-main">
            <div data-surface="ink" className="rounded-panel p-panel">
              <h2 className="text-heading-lg text-fg">
                <span className="block">{home.mission.overline}</span>
                {home.mission.title}
              </h2>
              <p className="mt-6 max-w-[52ch] text-lead text-fg-muted">{home.mission.body}</p>
            </div>
          </div>
        </section>

        {/* ── Philosophy: the king topples ───────────────────────── */}
        <section id="philosophy" className="section-y">
          <div className="shell-content grid items-center gap-10 md:grid-cols-2">
            <div>
              <h2 className="text-heading-lg text-fg">
                <span className="block">{home.philosophy.overline}</span>
                {home.philosophy.title}
              </h2>
              <p className="mt-6 max-w-[40ch] text-body-lg text-fg-muted">{home.philosophy.body}</p>
            </div>
            <div className="flex h-60 items-end justify-center">
              <KingMark className="topple h-52 w-auto text-ink" />
            </div>
          </div>
        </section>

        {/* ── Chronicles & Strategy (Blog Preview) ────────────────── */}
        <section id="blog" className="section-y">
          <div className="shell-main space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-fg-muted">
                  THE WEB3CHESS CHRONICLES
                </p>
                <h2 className="text-heading-lg text-fg mt-1">
                  Insights, fair play &amp; strategy.
                </h2>
              </div>
              <Link
                href="/blog"
                className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-ink transition-transform hover:translate-x-1"
              >
                <span>Read all chronicles</span>
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {BLOG_POSTS.slice(0, 3).map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>

        {/* ── Move of the day (Voltage) ──────────────────────────── */}
        <section className="section-y">
          <div className="shell-main">
            <div data-surface="voltage" className="rounded-panel p-panel shadow-edge">
              <MoveOfTheDay />
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" className="section-y">
          <div className="shell-main">
            <h2 className="text-heading-lg text-fg">Questions people actually ask.</h2>
            <div className="mt-8">
              <Faq />
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="shell-wide pb-16 pt-24">
        <div className="grid gap-4 lg:grid-cols-12">
          <div data-surface="signal" className="rounded-panel p-6 lg:col-span-4">
            <div className="rounded-card bg-white p-4">
              <div
                className="mx-auto size-35 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: footerQr }}
                role="img"
                aria-label="QR code that opens Web3Chess in Telegram"
              />
            </div>
            <p className="mt-4 text-heading-sm">Scan &amp; play</p>
          </div>

          <div className="lg:col-span-4">
            <a href="#money" className="text-heading-md link">
              {home.footer.statement}
            </a>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 lg:col-span-4">
            {home.footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-overline uppercase text-fg-muted">{col.title}</p>
                <ul className="mt-3 grid gap-2">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href === "#" ? telegramLink() : l.href}
                        className="link text-body font-semibold"
                        {...(l.href.startsWith("http")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="max-w-[60ch] text-caption text-fg-muted">
            {home.footer.legal} © {new Date().getFullYear()} {SITE.name}.
          </p>
        </div>
      </footer>

      <QrDock />
      <MobileCta />
    </div>
  );
}
