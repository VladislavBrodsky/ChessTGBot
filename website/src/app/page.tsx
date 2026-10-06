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
import { Footer } from "@/components/Footer";
import { KingMark } from "@/components/icons";
import { home } from "@/content/home";
import { BLOG_POSTS } from "@/content/blog";
import { SETTLEMENT, SITE, TIME_CONTROLS } from "@/lib/config";

const PROGRESSION_ICONS: IconName[] = ["sparkle", "trophy", "gift", "sword", "crown-simple", "users-three"];

/** Opera Game final position — verified mate with chess.js. */
const OPERA_FEN = "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17";

const FACTS = [
  { value: `${SETTLEMENT.winnerPercent}%`, label: "Of every pot goes straight to the victor" },
  { value: `${SETTLEMENT.platformFeePercent}%`, label: "Transparent protocol fee, published" },
  { value: "1 USDT", label: "Micro-stake entry to start playing" },
  { value: "0 MB", label: "No app download — 1 tap in Telegram" },
] as const;

const PILLARS = [
  {
    n: "01",
    title: "Server-Authoritative",
    body: "Every move and clock countdown runs on isolated backend clusters with Stockfish 17 anti-cheat heuristics. Zero client manipulation.",
    href: "/how-it-works",
  },
  {
    n: "02",
    title: "Equal Stakes, 95% Cut",
    body: `Both players stake identical amounts into match escrow. The winner claims ${SETTLEMENT.winnerPercent}% of the pool in seconds upon checkmate or flag.`,
    href: "/wagers",
  },
  {
    n: "03",
    title: "Checked & Verifiable Payouts",
    body: "Withdrawals execute directly to your TON wallet and can be verified publicly on Tonviewer or any open blockchain explorer.",
    href: "/wagers",
  },
] as const;

const LEDGER: { icon: IconName; title: string; meta: string; amount: string; win?: boolean; status?: string }[] = [
  { icon: "wallet", title: "USDT Deposit", meta: "11:24", amount: "+25.00 USDT" },
  { icon: "sword", title: "Match Stake (Blitz)", meta: "11:31", amount: "−5.00 USDT" },
  { icon: "trophy", title: "Victory Payout (95%)", meta: "11:44", amount: "+9.50 USDT", win: true },
  { icon: "clock", title: "TON Wallet Withdrawal", meta: "12:02", amount: "−20.00 USDT", status: "Sent" },
];

export default async function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          url: SITE.url,
          logo: `${SITE.url}/icon.svg`,
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE.url}/#app`,
        name: "Web3Chess",
        applicationCategory: "GameApplication",
        operatingSystem: "Telegram (iOS, Android, macOS, Windows, Linux, Web)",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Competitive real-time chess inside Telegram. Free practice vs Stockfish 17, and USDT wager matches with 95% winner payouts.",
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: home.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
    ],
  };

  return (
    <div id="top">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />

      <main id="main">
        {/* ── Hero: poster headline + the board as the "object" ───── */}
        <section className="shell-wide pb-12 pt-4 md:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <span className="tag">
                <span className="size-2 animate-live rounded-full bg-black" aria-hidden="true" />
                Live on Telegram Mini Apps
              </span>

              <h1 className="poster text-display-xl">
                Skill is the
                <br />
                only edge.
              </h1>

              <p className="max-w-[48ch] text-lead text-fg-muted">{home.hero.lead}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <PlayButton size="lg" label="Play in Telegram" />
                <Link
                  href="/how-it-works"
                  className="inline-flex min-h-14 items-center justify-center rounded-control border border-line-strong px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
                >
                  How it works
                </Link>
                <Link
                  href="/wagers"
                  className="inline-flex min-h-14 items-center justify-center rounded-control bg-inset px-7 text-[17px] font-semibold text-fg transition-colors duration-150 hover:bg-white"
                >
                  Wagers &amp; Math
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
                  <span className="tag">Tactical Brilliancy</span>
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
                  <span className="font-semibold">17. Rd8# — The Opera Game</span>
                  <span className="text-fg-muted">Checkmate delivered</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* ── Key Facts ────────────────────────────────────────────── */}
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

        {/* ── Black block: Manifesto & The 3 Pillars ──────────────── */}
        <section className="shell-wide py-6">
          <div data-surface="ink" className="rounded-block p-8 sm:p-12 lg:p-16">
            <span className="tag">{home.mission.overline}</span>
            <h2 className="poster mt-5 max-w-[18ch] text-display">{home.mission.title}</h2>
            <p className="mt-6 max-w-[58ch] text-lead text-fg-muted">{home.mission.body}</p>

            <ul className="mt-12 grid gap-4 border-t border-line pt-8 md:grid-cols-3">
              {PILLARS.map((p) => (
                <li key={p.n} className="flex flex-col justify-between space-y-4 rounded-card bg-surface p-6">
                  <div className="space-y-3">
                    <span className="font-mono text-overline uppercase text-fg-link">{p.n}</span>
                    <h3 className="poster text-heading-md">{p.title}</h3>
                    <p className="text-body-sm text-fg-muted">{p.body}</p>
                  </div>
                  <Link
                    href={p.href}
                    className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-fg hover:underline pt-2"
                  >
                    <span>Learn more</span>
                    <Icon name="arrow-up-right" size={14} className="flip-rtl" />
                  </Link>
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

        {/* ── Matchmaking & How It Works Teaser ────────────────────── */}
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
              <div className="pt-2">
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-2 rounded-control bg-surface px-5 py-3 font-mono text-body-sm font-semibold text-fg transition-colors hover:bg-white"
                >
                  <span>Explore full architecture &amp; mechanics</span>
                  <Icon name="arrow-right" size={16} className="flip-rtl" />
                </Link>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="rounded-card bg-surface p-7 sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <span className="tag">
                    <span className="size-2 animate-live rounded-full bg-black" aria-hidden="true" />
                    Matchmaking Queue · Searching
                  </span>
                  <span className="font-mono text-label">3+2 Blitz</span>
                </div>
                <p className="poster mt-6 text-heading-md">Finding an opponent near your rating…</p>
                <p className="mt-2 text-body-sm text-fg-muted">
                  You can close Telegram right now. Our bot will send you a push alert with an audible bell the moment your opponent sits down at your board.
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

        {/* ── Wagers Teaser ────────────────────────────────────────── */}
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
              <div className="pt-2">
                <Link
                  href="/wagers"
                  className="inline-flex items-center gap-2 rounded-control bg-surface px-5 py-3 font-mono text-body-sm font-semibold text-fg transition-colors hover:bg-white"
                >
                  <span>See all stakes &amp; settlement tiers</span>
                  <Icon name="arrow-right" size={16} className="flip-rtl" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Academy Teaser ───────────────────────────────────────── */}
        <section id="academy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="space-y-4 md:col-span-5">
              <span className="tag">Academy</span>
              <h2 className="poster text-heading-lg">{home.academy.title}</h2>
              <p className="text-body text-fg-muted">{home.academy.lead}</p>
              <div className="pt-2">
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-2 rounded-control bg-surface px-5 py-3 font-mono text-body-sm font-semibold text-fg transition-colors hover:bg-white"
                >
                  <span>Explore full curriculum &amp; A.I. sparring</span>
                  <Icon name="arrow-right" size={16} className="flip-rtl" />
                </Link>
              </div>
            </div>
            <ul className="grid gap-3 md:col-span-7">
              {home.academy.tracks.map((track) => (
                <li
                  key={track.name}
                  className="flex items-center justify-between gap-4 rounded-card bg-surface px-6 py-5 transition-colors hover:bg-white"
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

        {/* ── Money Ledger ─────────────────────────────────────────── */}
        <section id="money" className="shell-wide py-12">
          <div className="max-w-[44rem] space-y-4">
            <span className="tag">Treasury</span>
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
                <p className="font-mono text-overline uppercase text-fg-muted">Live Ledger Sample</p>
                <span className="tag">Verifiable</span>
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
                A 5 USDT stake from each player creates a 10 USDT pot; the victor takes 9.50 USDT instantly.
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
            <span className="tag">Seasonal Ranks</span>
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
              <span className="tag">Chronicles &amp; Intel</span>
              <h2 className="poster text-heading-lg">Master opening theory, fair play &amp; protocol math.</h2>
            </div>
            <Link href="/blog" className="link inline-flex items-center gap-1.5 text-button">
              <span>All articles ({BLOG_POSTS.length})</span>
              <Icon name="arrow-up-right" size={16} className="flip-rtl" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* ── Move of the day (the page's Voltage moment) ──────────── */}
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

      <Footer />

      <QrDock />
      <MobileCta />
    </div>
  );
}
