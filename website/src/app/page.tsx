import Link from "next/link";
import { Icon, type IconName } from "@/icons";
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
import { SETTLEMENT, SITE, TIME_CONTROLS, telegramLink } from "@/lib/config";
import { qrSvg } from "@/lib/qr";

const PROGRESSION_ICONS: IconName[] = ["sparkle", "trophy", "gift", "sword", "crown-simple", "users-three"];

/** Opera Game final position — verified mate with chess.js. */
const OPERA_FEN = "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17";

/**
 * Facts only: every number comes from lib/config or content/home.
 * (The previous ribbon showed invented "1.2s matchmaking" and "100% verified" figures.)
 */
const FACTS = [
  { value: `${SETTLEMENT.winnerPercent}%`, label: "Of the pot goes to the winner" },
  { value: `${SETTLEMENT.platformFeePercent}%`, label: "Platform fee, published" },
  { value: "1 USDT", label: "Minimum stake" },
  { value: String(TIME_CONTROLS.length), label: "Time controls, from 1+0 to 10+0" },
] as const;

const PILLARS = [
  { n: "01", title: "Server-side", body: home.play.points[1] },
  { n: "02", title: "Equal stakes", body: `Both players stake the same amount. The winner receives ${SETTLEMENT.winnerPercent}% of the pot; the cut is published.` },
  { n: "03", title: "Checked payouts", body: home.money.points[1].body },
] as const;

const LEDGER: { icon: IconName; title: string; meta: string; amount: string; win?: boolean; status?: string }[] = [
  { icon: "wallet", title: "Deposit", meta: "11:24", amount: "+25.00 USDT" },
  { icon: "sword", title: "Match stake", meta: "11:31", amount: "−5.00 USDT" },
  { icon: "trophy", title: "Winnings", meta: "11:44", amount: "+9.50 USDT", win: true },
  { icon: "clock", title: "Withdrawal", meta: "12:02", amount: "−20.00 USDT", status: "Sent" },
];

export default async function HomePage() {
  const footerQr = await qrSvg(telegramLink());

  return (
    <div id="top">
      <Nav />

      <main id="main">
        {/* ── Hero: poster headline + the board as the "object" ───── */}
        <section className="shell-wide pb-12 pt-4 md:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <span className="tag">Chess inside Telegram</span>

              <h1 className="poster text-display-xl">
                Skill is the
                <br />
                only edge.
              </h1>

              <p className="max-w-[46ch] text-lead text-fg-muted">{home.hero.lead}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <PlayButton size="lg" label="Play in Telegram" />
                <Link
                  href="/#wagers"
                  className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
                >
                  How wagers work
                </Link>
              </div>

              <p className="flex items-center gap-2 font-mono text-caption text-fg-muted">
                <Icon name="check" size={14} />
                {home.hero.ctaNote}
              </p>
            </div>

            <div className="lg:col-span-5">
              <figure className="rounded-card bg-surface p-5 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="tag">Example</span>
                  <span className="font-mono text-caption text-fg-muted">Paris, 1858</span>
                </div>

                <p className="pb-2 text-body-sm font-semibold">Duke of Brunswick &amp; Count Isouard</p>
                <FogBoard
                  position={OPERA_FEN}
                  label={home.hero.boardCaption + " White plays 17. Rd8#, checkmate."}
                  showNotation={false}
                  squareStyles={{
                    d8: { backgroundColor: "rgba(255, 241, 0, 0.85)" },
                    e8: { backgroundColor: "rgba(225, 29, 72, 0.55)" },
                  }}
                />
                <p className="pt-2 text-body-sm font-semibold">Paul Morphy</p>

                <figcaption className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 font-mono text-caption">
                  <span className="font-semibold">17. Rd8# — the Opera Game</span>
                  <span className="text-fg-muted">Black is mated</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── Facts ────────────────────────────────────────────────── */}
        <section className="shell-wide pb-12" aria-label="Key facts">
          <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {FACTS.map((f) => (
              <div key={f.label} className="flex flex-col justify-between gap-6 rounded-card bg-surface p-5 sm:p-6">
                <dd className="poster text-stat">{f.value}</dd>
                <dt className="text-body-sm text-fg-muted">{f.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* ── Black block: mission + principles (the page's one Ink moment) ── */}
        <section className="shell-wide py-6">
          <div data-surface="ink" className="rounded-block p-8 sm:p-12 lg:p-16">
            <span className="tag">{home.mission.overline}</span>
            <h2 className="poster mt-5 max-w-[16ch] text-display">{home.mission.title}</h2>
            <p className="mt-6 max-w-[56ch] text-lead text-fg-muted">{home.mission.body}</p>

            <ul className="mt-12 grid gap-4 border-t border-line pt-8 md:grid-cols-3">
              {PILLARS.map((p) => (
                <li key={p.n} className="space-y-3 rounded-card bg-surface p-6">
                  <span className="font-mono text-overline uppercase text-fg-link">{p.n}</span>
                  <h3 className="poster text-heading-md">{p.title}</h3>
                  <p className="text-body-sm text-fg-muted">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Proof chips ──────────────────────────────────────────── */}
        <section className="shell-wide py-10">
          <ul className="flex flex-wrap justify-center gap-2.5">
            {home.chips.map((chip) => (
              <li key={chip} className="rounded-pill bg-surface px-5 py-2.5 font-mono text-label text-fg">
                {chip}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Matchmaking ──────────────────────────────────────────── */}
        <section id="play" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <span className="tag">How it works</span>
              <h2 className="poster text-heading-lg">{home.play.title}</h2>
              <p className="text-body text-fg-muted">{home.play.lead}</p>
              <ul className="grid gap-3 pt-2">
                {home.play.points.map((point) => (
                  <li key={point} className="flex gap-3 text-body-sm">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="rounded-card bg-surface p-7 sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <span className="tag">
                    <span className="size-2 animate-live rounded-full bg-black" aria-hidden="true" />
                    Example · searching
                  </span>
                  <span className="font-mono text-label">3+2</span>
                </div>
                <p className="poster mt-6 text-heading-md">Finding an opponent near your rating…</p>
                <p className="mt-2 text-body-sm text-fg-muted">
                  You can close Telegram. We&apos;ll message you the moment someone sits down at your board.
                </p>
                <div className="mt-6 flex flex-wrap gap-2" role="list" aria-label="Time controls">
                  {TIME_CONTROLS.map((tc) => (
                    <span key={tc} role="listitem" className="rounded-pill bg-inset px-4 py-1.5 font-mono text-label">
                      {tc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Wagers ───────────────────────────────────────────────── */}
        <section id="wagers" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="order-2 md:order-1 md:col-span-7">
              <div className="rounded-card bg-surface p-6 sm:p-8">
                <WagerDemo />
              </div>
            </div>
            <div className="order-1 space-y-4 md:order-2 md:col-span-5">
              <span className="tag">Wagers</span>
              <h2 className="poster text-heading-lg">{home.wagers.title}</h2>
              <p className="text-body text-fg-muted">{home.wagers.lead}</p>
              <p className="flex gap-2 pt-2 font-mono text-caption text-fg-muted">
                <Icon name="info" size={16} className="shrink-0" />
                {home.wagers.risk}
              </p>
            </div>
          </div>
        </section>

        {/* ── Academy ──────────────────────────────────────────────── */}
        <section id="academy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <span className="tag">Academy</span>
              <h2 className="poster text-heading-lg">{home.academy.title}</h2>
              <p className="text-body text-fg-muted">{home.academy.lead}</p>
            </div>
            <ul className="grid gap-3 md:col-span-7">
              {home.academy.tracks.map((track) => (
                <li
                  key={track.name}
                  className="flex items-center justify-between gap-4 rounded-card bg-surface px-6 py-5"
                >
                  <span className="text-title">{track.name}</span>
                  <span className="rounded-pill bg-inset px-3.5 py-1 font-mono text-overline uppercase">
                    {track.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Money ledger ─────────────────────────────────────────── */}
        <section id="money" className="shell-wide py-12">
          <div className="max-w-[44rem] space-y-4">
            <span className="tag">Money</span>
            <h2 className="poster text-heading-lg">{home.money.title}</h2>
            <p className="text-body text-fg-muted">{home.money.lead}</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-12">
            <ul className="grid gap-4 lg:col-span-5">
              {home.money.points.map((point) => (
                <li key={point.title} className="rounded-card bg-surface p-6">
                  <p className="text-title">{point.title}</p>
                  <p className="mt-2 text-body-sm text-fg-muted">{point.body}</p>
                </li>
              ))}
            </ul>

            <div className="rounded-card bg-surface p-6 sm:p-8 lg:col-span-7">
              <div className="flex items-center justify-between">
                <p className="font-mono text-overline uppercase text-fg-muted">Ledger</p>
                <span className="tag">Example</span>
              </div>
              <ul className="mt-3">
                {LEDGER.map((row) => (
                  <li key={row.title} className="flex items-center gap-4 border-b border-line py-3.5 last:border-0">
                    <span className="grid size-10 shrink-0 place-items-center rounded-media bg-inset">
                      <Icon name={row.icon} size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold">{row.title}</span>
                      <span className="block font-mono text-caption text-fg-muted">{row.meta}</span>
                    </span>
                    {row.status && (
                      <span className="rounded-pill bg-inset px-2.5 py-0.5 font-mono text-overline uppercase">
                        {row.status}
                      </span>
                    )}
                    <span
                      className={`font-mono text-body font-semibold tabular-nums ${row.win ? "text-fg-win" : "text-fg"}`}
                    >
                      {row.amount}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-caption text-fg-muted">
                A 5 USDT stake from each player makes a 10 USDT pot; the winner receives 9.50 USDT.
              </p>
            </div>
          </div>

          <p className="mt-6 flex max-w-[60ch] gap-2 font-mono text-caption text-fg-muted">
            <Icon name="info" size={16} className="shrink-0" />
            {home.money.custodyNote}
          </p>
        </section>

        {/* ── Progression ──────────────────────────────────────────── */}
        <section id="progression" className="shell-wide py-12">
          <div className="mb-8 space-y-4">
            <span className="tag">Progression</span>
            <h2 className="poster text-heading-lg">{home.progression.title}</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.progression.tiles.map((tile, i) => (
              <li key={tile.title} className="rounded-card bg-surface p-7">
                <span className="grid size-11 place-items-center rounded-media bg-inset">
                  <Icon name={PROGRESSION_ICONS[i] ?? "sparkle"} size={22} />
                </span>
                <p className="mt-5 text-title">{tile.title}</p>
                <p className="mt-1.5 text-body-sm text-fg-muted">{tile.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── Philosophy: the king topples ─────────────────────────── */}
        <section id="philosophy" className="shell-wide py-12">
          <div className="grid items-center gap-10 rounded-card bg-surface p-8 sm:p-12 md:grid-cols-2">
            <div className="space-y-4">
              <span className="tag">{home.philosophy.overline}</span>
              <h2 className="poster text-heading-lg">{home.philosophy.title}</h2>
              <p className="text-body text-fg-muted">{home.philosophy.body}</p>
            </div>
            <div className="flex h-60 items-end justify-center" aria-hidden="true">
              <KingMark className="topple h-48 w-auto text-fg" />
            </div>
          </div>
        </section>

        {/* ── Blog preview ─────────────────────────────────────────── */}
        <section id="blog" className="shell-wide space-y-8 py-12">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-4">
              <span className="tag">Blog</span>
              <h2 className="poster text-heading-lg">Openings, fair play &amp; the money side.</h2>
            </div>
            <Link href="/blog" className="link inline-flex items-center gap-1.5 text-button">
              <span>All articles</span>
              <Icon name="arrow-up-right" size={16} className="flip-rtl" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* ── Move of the day (the page's one Voltage moment) ──────── */}
        <section className="shell-wide py-12">
          <div data-surface="voltage" className="rounded-block p-8 sm:p-12">
            <MoveOfTheDay />
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <section id="faq" className="shell-wide py-12">
          <div className="mb-8 space-y-4">
            <span className="tag">FAQ</span>
            <h2 className="poster text-heading-lg">Questions players ask.</h2>
          </div>
          <div className="rounded-card bg-surface p-6 sm:p-10">
            <Faq />
          </div>
        </section>
      </main>

      {/* ── Footer (black block) ───────────────────────────────────── */}
      <footer className="shell-wide pb-16 pt-12">
        <div data-surface="ink" className="rounded-block p-8 sm:p-12 lg:p-16">
          <div className="grid items-start gap-10 lg:grid-cols-12">
            <div className="rounded-card bg-surface p-6 text-center lg:col-span-4">
              <div className="inline-block rounded-media bg-white p-3.5">
                <div
                  className="size-32 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: footerQr }}
                  role="img"
                  aria-label="QR code that opens Web3Chess in Telegram"
                />
              </div>
              <p className="poster mt-4 text-heading-sm">Scan to play in Telegram</p>
              <p className="mt-1 font-mono text-caption text-fg-muted">No download · Opens the Mini App</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8">
              {home.footer.columns.map((col) => (
                <div key={col.title} className="space-y-3">
                  <p className="font-mono text-overline uppercase text-fg-link">{col.title}</p>
                  <ul className="grid gap-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href === "#" ? telegramLink() : l.href}
                          className="link text-body text-fg-muted hover:text-fg"
                          {...(l.href.startsWith("http") || l.href === "#"
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

          <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <Logo inverse />
            <p className="max-w-[60ch] font-mono text-caption text-fg-muted">
              {home.footer.legal} © {new Date().getFullYear()} {SITE.name}.
            </p>
          </div>
        </div>
      </footer>

      <QrDock />
      <MobileCta />
    </div>
  );
}
