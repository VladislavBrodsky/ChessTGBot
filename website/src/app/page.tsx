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
        {/* ── Hero Split (Matches Refero / Dayos Hero Split) ─────── */}
        <section className="shell-wide pb-20 pt-6 md:pt-12">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left 50% Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d1ffca] px-4 py-1.5 font-mono text-[12px] font-medium uppercase tracking-tight text-[#000000]">
                <span className="size-2 rounded-full bg-[#000000] animate-pulse" />
                TELEGRAM NATIVE · TON PROTOCOL
              </div>

              <h1 className="font-condensed font-bold uppercase tracking-[-0.03em] leading-[0.9] text-[54px] sm:text-[76px] lg:text-[100px] text-[#000000]">
                BORN ON-CHAIN.<br />
                NOT BOLTED<br />
                ONTO IT.
              </h1>

              <p className="max-w-[48ch] text-[16px] sm:text-[18px] leading-[1.35] text-[#444444]">
                We don&apos;t build legacy web2 subscriptions or app store lock-ins. We provide the competitive chess arena running natively inside Telegram. Instant USDT wagers, provably fair engine arbitration, and 3-tier viral referral commissions at protocol speed.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <PlayButton size="lg" label="Play in Telegram" />
                <Link
                  href="/blog"
                  className="inline-flex items-center justify-center rounded-[8px] border-[1.5px] border-[#444444] px-6 py-3.5 text-[16px] font-medium text-[#444444] transition-colors hover:border-[#000000] hover:text-[#000000]"
                >
                  Read Chronicles
                </Link>
              </div>

              <p className="font-mono text-[12px] text-[#979797]">
                Free rated play · No app download required · 18+ for cash stakes
              </p>
            </div>

            {/* Right 50% Column - Tactile Chess Artifact */}
            <div className="lg:col-span-5">
              <div className="rounded-[32px] bg-white p-6 sm:p-8">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#e5e5e5]">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#d1ffca] px-3 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                    Tactical Arena
                  </span>
                  <span className="font-mono text-[12px] text-[#979797]">Morphy, 1858</span>
                </div>
                <FogBoard
                  position={OPERA_FEN}
                  label="The final position of the Opera Game: White has just played rook to d8, checkmate."
                  squareStyles={{ d8: { backgroundColor: "rgba(255, 241, 0, 0.7)" } }}
                />
                <div className="mt-4 flex items-center justify-between text-[12px] font-mono text-[#979797]">
                  <span>17. Rd8# checkmate</span>
                  <span className="text-[#000000] font-semibold">100% Verified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Top-Arc Inverted Card (Dayos 64px Arc Section) ─────── */}
        <section className="shell-wide">
          <div className="rounded-t-[48px] sm:rounded-t-[64px] bg-[#000000] px-6 py-16 sm:px-12 sm:py-24 text-white">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Pillar 1 */}
              <div className="space-y-3">
                <h3 className="font-condensed text-[48px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-white">
                  FAST.
                </h3>
                <p className="text-[15px] leading-[1.4] text-[#979797]">
                  Sub-second TON blockchain settlements. Winner claims 95% of the prize pot instantly into their platform balance, with instant direct withdrawals to personal TON wallets.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="space-y-3">
                <h3 className="font-condensed text-[48px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-white">
                  FAIR.
                </h3>
                <p className="text-[15px] leading-[1.4] text-[#979797]">
                  Server-side move validation and Stockfish anti-cheat monitoring eliminate client vulnerabilities. Dynamic ELO matchmaking guarantees competitive pairings every game.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="space-y-3">
                <h3 className="font-condensed text-[48px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-white">
                  SOVEREIGN.
                </h3>
                <p className="text-[15px] leading-[1.4] text-[#979797]">
                  Zero third-party browser extensions or app store approvals. Access the entire matrix instantly from within Telegram on iOS, Android, macOS, and Windows.
                </p>
              </div>
            </div>

            {/* Massive Inverted Display Title */}
            <div className="mt-16 pt-12 border-t border-[#2f2f2f]">
              <h2 className="font-condensed text-[44px] sm:text-[72px] lg:text-[104px] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-white">
                WE&apos;RE REVOLUTIONIZING COMPETITIVE CHESS.
              </h2>
            </div>
          </div>
        </section>

        {/* ── Proof Chips ────────────────────────────────────────── */}
        <section className="shell-wide py-12">
          <ul className="flex flex-wrap justify-center gap-3">
            {home.chips.map((chip) => (
              <li
                key={chip}
                className="rounded-full bg-white px-5 py-2.5 font-mono text-[13px] font-medium text-[#000000]"
              >
                {chip}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Matchmaking ────────────────────────────────────────── */}
        <section id="play" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                Matchmaking OS
              </span>
              <h2 className="font-condensed text-[38px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                {home.play.title}
              </h2>
              <p className="text-[16px] leading-[1.4] text-[#444444]">{home.play.lead}</p>
              <ul className="grid gap-3 pt-2">
                {home.play.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[14px] text-[#444444]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[#000000]" strokeWidth={2} />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="rounded-[32px] bg-white p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#d1ffca] px-3 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                    <span className="size-2 rounded-full bg-[#000000] animate-ping" aria-hidden="true" />
                    Searching Queue
                  </span>
                  <span className="font-mono text-[13px] font-semibold text-[#000000]">3+2 Blitz</span>
                </div>
                <p className="mt-6 font-condensed text-[28px] font-bold uppercase leading-[0.95] text-[#000000]">
                  Finding an opponent near your ELO…
                </p>
                <p className="mt-2 text-[15px] text-[#444444]">
                  You can close Telegram. We&apos;ll ping you the moment someone sits down at your board.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5" aria-label="Time controls">
                  {TIME_CONTROLS.map((tc) => (
                    <span
                      key={tc}
                      className="rounded-full bg-[#f3f3f3] px-4 py-1.5 font-mono text-[12px] font-medium text-[#000000]"
                    >
                      {tc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Wagers Demo ─────────────────────────────────────────── */}
        <section id="wagers" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="order-2 md:order-1 md:col-span-7">
              <div className="rounded-[32px] bg-white p-8">
                <WagerDemo />
              </div>
            </div>
            <div className="order-1 md:order-2 md:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                Protocol Settlement
              </span>
              <h2 className="font-condensed text-[38px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                {home.wagers.title}
              </h2>
              <p className="text-[16px] leading-[1.4] text-[#444444]">{home.wagers.lead}</p>
              <p className="flex gap-2 font-mono text-[12px] text-[#979797] pt-2">
                <Shield className="size-4 shrink-0 text-[#444444]" strokeWidth={1.5} aria-hidden="true" />
                {home.wagers.risk}
              </p>
            </div>
          </div>
        </section>

        {/* ── Academy Tracks ─────────────────────────────────────── */}
        <section id="academy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                Academy Mastery
              </span>
              <h2 className="font-condensed text-[38px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                {home.academy.title}
              </h2>
              <p className="text-[16px] leading-[1.4] text-[#444444]">{home.academy.lead}</p>
            </div>
            <ul className="grid gap-3 md:col-span-7">
              {home.academy.tracks.map((track) => (
                <li
                  key={track.name}
                  className="flex items-center justify-between gap-4 rounded-[20px] bg-white p-5 transition-transform duration-150 hover:translate-x-1"
                >
                  <span className="text-[16px] font-semibold text-[#000000]">{track.name}</span>
                  <span className="rounded-full bg-[#f3f3f3] px-3 py-1 font-mono text-[11px] uppercase text-[#444444]">
                    {track.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Money Ledger (Night Inverted Panel) ─────────────────── */}
        <section id="money" className="shell-wide py-12">
          <div className="rounded-[40px] bg-[#000000] p-8 sm:p-12 text-white">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                Transparent Treasury
              </span>
              <h2 className="font-condensed text-[40px] sm:text-[56px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-white">
                {home.money.title}
              </h2>
              <p className="max-w-[50ch] text-[16px] leading-[1.4] text-[#979797]">{home.money.lead}</p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <ul className="grid gap-4 lg:col-span-5">
                {home.money.points.map((point) => (
                  <li key={point.title} className="rounded-[24px] bg-[#181818] p-6">
                    <p className="font-semibold text-[16px] text-white">{point.title}</p>
                    <p className="mt-2 text-[14px] leading-[1.4] text-[#979797]">{point.body}</p>
                  </li>
                ))}
              </ul>

              <div className="rounded-[28px] bg-[#181818] p-6 lg:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#979797]">Example on-chain ledger</p>
                <ul className="mt-4 grid gap-1">
                  {[
                    { icon: Wallet, title: "Deposit", meta: "Today, 11:24", amount: "+25.00 USDT", tone: "text-white" },
                    { icon: Swords, title: "Match wager", meta: "Today, 11:31", amount: "−5.00 USDT", tone: "text-[#979797]" },
                    { icon: Trophy, title: "Winnings", meta: "Today, 11:44", amount: "+9.50 USDT", tone: "text-[#d1ffca]" },
                    { icon: Clock, title: "Withdrawal", meta: "Today, 12:02", amount: "−20.00 USDT", tone: "text-white", status: "Verified" },
                  ].map((row) => (
                    <li key={row.title} className="flex items-center gap-4 border-b border-[#2f2f2f] py-3.5 last:border-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[#2f2f2f] text-white">
                        <row.icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-white">{row.title}</span>
                        <span className="block font-mono text-[11px] text-[#979797]">{row.meta}</span>
                      </span>
                      {row.status && (
                        <span className="rounded-full bg-[#2f2f2f] px-2.5 py-0.5 font-mono text-[10px] uppercase text-[#d1ffca]">
                          {row.status}
                        </span>
                      )}
                      <span className={`font-mono text-[14px] font-semibold tabular-nums ${row.tone}`}>{row.amount}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-[11px] text-[#979797]">
                  Example ledger. 5 USDT wager creates 10 USDT pool; winner receives 9.50 USDT automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Progression Matrix ─────────────────────────────────── */}
        <section id="progression" className="shell-wide py-12">
          <div className="space-y-4 mb-8">
            <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
              XP Ecosystem
            </span>
            <h2 className="font-condensed text-[38px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
              {home.progression.title}
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.progression.tiles.map((tile, i) => {
              const Icon = PROGRESSION_ICONS[i] ?? Sparkles;
              return (
                <li key={tile.title} className="rounded-[28px] bg-white p-7 transition-transform duration-150 hover:-translate-y-0.5">
                  <span className="grid size-10 place-items-center rounded-[8px] bg-[#f3f3f3] text-[#000000]">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-[17px] font-semibold text-[#000000]">{tile.title}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.4] text-[#444444]">{tile.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Mission (Inverted Arc Card) ───────────────────────── */}
        <section className="shell-wide py-12">
          <div className="rounded-[40px] bg-[#000000] p-8 sm:p-14 text-white">
            <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
              {home.mission.overline}
            </span>
            <h2 className="mt-4 font-condensed text-[40px] sm:text-[56px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-white">
              {home.mission.title}
            </h2>
            <p className="mt-4 max-w-[55ch] text-[16px] sm:text-[18px] leading-[1.4] text-[#979797]">{home.mission.body}</p>
          </div>
        </section>

        {/* ── Philosophy: the king topples ───────────────────────── */}
        <section id="philosophy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-2 rounded-[32px] bg-white p-8 sm:p-12">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                {home.philosophy.overline}
              </span>
              <h2 className="font-condensed text-[38px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                {home.philosophy.title}
              </h2>
              <p className="text-[16px] leading-[1.4] text-[#444444]">{home.philosophy.body}</p>
            </div>
            <div className="flex h-60 items-end justify-center">
              <KingMark className="topple h-48 w-auto text-[#000000]" />
            </div>
          </div>
        </section>

        {/* ── Chronicles & Strategy (Blog Preview) ────────────────── */}
        <section id="blog" className="shell-wide py-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
                THE WEB3CHESS CHRONICLES
              </span>
              <h2 className="font-condensed text-[40px] sm:text-[52px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
                Insights, fair play &amp; protocol strategy.
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold uppercase tracking-wider text-[#000000] transition-transform hover:translate-x-1"
            >
              <span>Explore all articles</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(0, 3).map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>

        {/* ── Move of the day (Voltage Highlight) ────────────────── */}
        <section className="shell-wide py-12">
          <div className="rounded-[32px] bg-[#fff100] p-8 sm:p-12 text-[#000000]">
            <MoveOfTheDay />
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" className="shell-wide py-12">
          <div className="space-y-4 mb-8">
            <span className="inline-flex items-center rounded-full bg-[#d1ffca] px-3.5 py-1 font-mono text-[11px] font-medium uppercase text-[#000000]">
              Clear Answers
            </span>
            <h2 className="font-condensed text-[40px] sm:text-[52px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
              Questions players frequently ask.
            </h2>
          </div>
          <div className="rounded-[32px] bg-white p-8 sm:p-10">
            <Faq />
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="shell-wide pb-16 pt-20">
        <div className="rounded-[40px] bg-[#000000] p-8 sm:p-14 text-white">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            <div className="lg:col-span-4 rounded-[28px] bg-[#181818] p-6 text-center">
              <div className="rounded-[20px] bg-white p-4 inline-block">
                <div
                  className="size-32 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: footerQr }}
                  role="img"
                  aria-label="QR code that opens Web3Chess in Telegram"
                />
              </div>
              <p className="mt-4 font-condensed text-[24px] font-bold uppercase text-white">
                Scan to play in Telegram
              </p>
              <p className="font-mono text-[11px] text-[#979797] mt-1">
                Zero download · Instant start
              </p>
            </div>

            <div className="lg:col-span-8 grid gap-8 sm:grid-cols-3">
              {home.footer.columns.map((col) => (
                <div key={col.title} className="space-y-3">
                  <p className="font-mono text-[12px] uppercase tracking-wider text-[#979797]">{col.title}</p>
                  <ul className="grid gap-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href === "#" ? telegramLink() : l.href}
                          className="text-[15px] font-medium text-white transition-opacity hover:opacity-75"
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

          <div className="mt-14 pt-8 border-t border-[#2f2f2f] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <p className="max-w-[60ch] font-mono text-[11px] text-[#979797]">
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
