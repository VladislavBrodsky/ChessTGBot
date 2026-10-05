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
import { SITE, TIME_CONTROLS } from "@/lib/config";
import { qrSvg } from "@/lib/qr";
import { telegramLink } from "@/lib/config";

const PROGRESSION_ICONS: IconName[] = ["sparkle", "trophy", "gift", "sword", "crown-simple", "users-three"];

/** Opera Game final position — verified mate with chess.js. */
const OPERA_FEN = "1n1Rkb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2K5 b k - 1 17";

export default async function HomePage() {
  const footerQr = await qrSvg(telegramLink());

  return (
    <div id="top">
      <Nav />

      <main id="main">
        {/* ── Hero Split (Editorial Poster on Fog) ─────── */}
        <section className="shell-wide pb-14 pt-4 md:pt-10 relative">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Column: Poster Copy & Action */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 rounded-full bg-white/90 backdrop-blur-md px-4 py-1.5 font-mono text-[11px] sm:text-[12px] font-bold uppercase tracking-tight text-[#20294C] shadow-[0_2px_10px_rgba(32,41,76,0.06)] border border-[#c7cbdb]/50">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#10b981]" />
                </span>
                <span>TELEGRAM NATIVE · TON PROTOCOL · 0-CLICK PLAY</span>
              </div>

              <h1 className="font-sans font-black tracking-[-0.035em] leading-[0.94] text-[50px] sm:text-[72px] lg:text-[86px] xl:text-[98px] text-[#20294C]">
                <span className="sr-only">Skill is the only edge.</span>
                <span aria-hidden="true">
                  Sk<span className="tittle-host">ı<span className="tittle" /></span>ll is the<br />
                  <span className="text-[#0A2D67]">only edge.</span>
                </span>
              </h1>

              <p className="max-w-[48ch] text-[17px] sm:text-[19px] leading-[1.48] text-[#424B6D]">
                The competitive chess arena running natively inside Telegram. Play rated Blitz for free, or stake USDT in provably fair matches with instant TON payouts and server-side Stockfish arbitration.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <PlayButton size="lg" label="Play in Telegram" />
                <Link
                  href="/#wagers"
                  className="inline-flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm border border-[#c7cbdb] px-7 py-3.5 text-[16px] font-semibold text-[#20294C] transition-all duration-150 hover:border-[#20294C] hover:bg-white hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(32,41,76,0.06)]"
                >
                  Explore Wagers
                </Link>
              </div>

              <div className="flex items-center gap-2 pt-1 font-mono text-[12px] text-[#676B89]">
                <Icon name="check" size={14} className="text-[#10b981]" />
                <span>Free rated play · No app download · Instant TON payouts · 18+</span>
              </div>

              {/* Live Matchmaking Radar & Game Mode Pulse */}
              <div className="pt-2 max-w-[540px]">
                <div className="rounded-[24px] bg-white/85 backdrop-blur-md p-4 border border-[#c7cbdb]/50 shadow-[0_4px_16px_rgba(32,41,76,0.06)]">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#c7cbdb]/30 text-[12px] font-mono">
                    <span className="flex items-center gap-2 font-bold text-[#20294C]">
                      <span className="size-2 rounded-full bg-[#10b981] animate-ping" />
                      340+ Duels Active Right Now
                    </span>
                    <span className="text-[#047857] font-bold">● Telegram Node Live</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F1F5] px-3 py-1 font-semibold text-[#20294C]">
                      <Icon name="lightning" size={12} className="text-[#20294C]" />
                      3+2 Blitz · 142 in queue
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F1F5] px-3 py-1 font-semibold text-[#20294C]">
                      <Icon name="target" size={12} className="text-[#20294C]" />
                      1+0 Bullet · 96 in queue
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0F1F5] px-3 py-1 font-semibold text-[#20294C]">
                      <Icon name="clock" size={12} className="text-[#20294C]" />
                      10+0 Rapid · 104 in queue
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Broadcast-Grade Tactical Arena Card */}
            <div className="lg:col-span-5">
              <div className="rounded-[32px] bg-white p-5 sm:p-7 shadow-[0_12px_40px_rgba(32,41,76,0.12)] border border-[#c7cbdb]/40 transition-all hover:shadow-[0_16px_48px_rgba(32,41,76,0.16)]">
                {/* Live Match Top Bar */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-2.5 border-b border-[#c7cbdb]/30">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10b981]/15 px-3 py-1 font-mono text-[11px] font-bold uppercase text-[#047857]">
                      <span className="size-1.5 rounded-full bg-[#10b981] animate-ping" />
                      Live Arena
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#676B89]">3+2 Blitz</span>
                  </div>
                  <span className="rounded-full bg-[#FFFF00] px-3.5 py-1 font-mono text-[11px] font-extrabold uppercase text-[#042939] shadow-sm">
                    50.00 USDT Pot
                  </span>
                </div>

                {/* Evaluation bar indicator */}
                <div className="flex items-center justify-between px-3 py-1 mb-2.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[11px] font-mono font-bold text-[#047857]">
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-[#10b981]" />
                    Eval: +M1 Checkmate on board
                  </span>
                  <span className="text-[10px] text-[#047857]/80">99.8% Accuracy</span>
                </div>

                {/* Opponent Info */}
                <div className="flex items-center justify-between pb-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-full bg-[#20294C] text-white flex items-center justify-center font-bold text-[11px]">D</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#F0F1F5] text-[10px] font-black font-mono text-[#20294C]">GM</span>
                    <span className="font-semibold text-[#20294C]">Duke &amp; Count</span>
                    <span className="font-mono text-[11px] text-[#676B89]">2210</span>
                  </div>
                  <span className="font-mono text-[12px] font-bold text-[#676B89] bg-[#F0F1F5] px-2.5 py-0.5 rounded-md">01:15</span>
                </div>

                {/* Fog Board */}
                <div className="my-1 rounded-[20px] overflow-hidden shadow-inner border border-[#c7cbdb]/40">
                  <FogBoard
                    position={OPERA_FEN}
                    label="Morphy vs. Duke of Brunswick & Count Isouard, Paris 1858 — White plays 17. Rd8# checkmate."
                    showNotation={false}
                    squareStyles={{
                      d8: { backgroundColor: "rgba(255, 241, 0, 0.75)", boxShadow: "inset 0 0 10px rgba(255, 241, 0, 0.5)" },
                      e8: { backgroundColor: "rgba(225, 29, 72, 0.5)", boxShadow: "inset 0 0 10px rgba(225, 29, 72, 0.4)" },
                    }}
                  />
                </div>

                {/* Hero Player Info */}
                <div className="flex items-center justify-between pt-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="size-7 rounded-full bg-[#FFFF00] text-[#042939] flex items-center justify-center font-bold text-[11px] shadow-sm">M</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#FFFF00] text-[10px] font-black font-mono text-[#042939] shadow-xs">GM</span>
                    <span className="font-semibold text-[#20294C]">Paul Morphy</span>
                    <span className="font-mono text-[11px] text-[#676B89]">2480</span>
                  </div>
                  <span className="font-mono text-[12px] font-bold text-[#047857] bg-[#10b981]/15 px-2.5 py-0.5 rounded-md">03:42</span>
                </div>

                {/* Move Notation & Verification Footer */}
                <div className="mt-2.5 pt-2.5 border-t border-[#c7cbdb]/30 flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-[#20294C]">17. Rd8# Immortal Checkmate</span>
                  <span className="flex items-center gap-1 font-semibold text-[#047857]">
                    <Icon name="shield-check" size={13} />
                    <span>Stockfish 17 Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Proof Metrics Ribbon (Credibility & Live Speed) ──────── */}
        <section className="shell-wide pb-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {[
              { value: "⚡ 1.2s", label: "Matchmaking Queue", sub: "Global ELO pairing" },
              { value: "🏆 95%", label: "Winner Pot Share", sub: "Transparent 3% fee" },
              { value: "🛡️ 100%", label: "Stockfish Verified", sub: "Server anti-cheat" },
              { value: "🌐 10", label: "Global Locales", sub: "Native RTL support" },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] bg-white p-5 border border-white/80 shadow-[0_4px_18px_rgba(32,41,76,0.06)] flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5"
              >
                <p className="font-sans text-[26px] sm:text-[32px] font-extrabold tracking-tight text-[#20294C]">{metric.value}</p>
                <div className="mt-2">
                  <p className="text-[13px] font-bold text-[#20294C]">{metric.label}</p>
                  <p className="font-mono text-[11px] text-[#676B89]">{metric.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Top-Arc Inverted Card (Night Panel / Arena Principles) ── */}
        <section className="shell-wide">
          <div className="rounded-t-[48px] sm:rounded-t-[64px] bg-[#071A22] px-6 py-16 sm:px-12 sm:py-24 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Pillar 1 */}
              <div className="space-y-3 rounded-[24px] bg-[#103645]/40 p-6 border border-white/5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#459AF8]">01 · SPEED</span>
                <h3 className="font-sans text-[32px] sm:text-[38px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white">
                  SUB-SECOND.
                </h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.45] text-[#979DB5]">
                  Instant TON blockchain settlements. Winner claims 95% of the prize pot directly into their platform balance, with instant direct withdrawals to personal TON wallets.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="space-y-3 rounded-[24px] bg-[#103645]/40 p-6 border border-white/5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#459AF8]">02 · FAIR PLAY</span>
                <h3 className="font-sans text-[32px] sm:text-[38px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white">
                  ARBITRATED.
                </h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.45] text-[#979DB5]">
                  Server-side move validation and Stockfish anti-cheat monitoring eliminate client vulnerabilities. Dynamic ELO matchmaking guarantees competitive pairings every game.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="space-y-3 rounded-[24px] bg-[#103645]/40 p-6 border border-white/5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#459AF8]">03 · PROTOCOL</span>
                <h3 className="font-sans text-[32px] sm:text-[38px] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-white">
                  ZERO FRICTION.
                </h3>
                <p className="text-[14px] sm:text-[15px] leading-[1.45] text-[#979DB5]">
                  Zero third-party browser extensions or app store approvals. Access the entire arena instantly from within Telegram on iOS, Android, macOS, and Windows.
                </p>
              </div>
            </div>

            {/* Inverted Display Banner */}
            <div className="mt-14 pt-10 border-t border-white/10 text-center sm:text-start">
              <h2 className="font-sans text-[38px] sm:text-[64px] lg:text-[88px] font-extrabold uppercase leading-[0.92] tracking-[-0.03em] text-white">
                WE ARE REVOLUTIONIZING COMPETITIVE CHESS.
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
                className="rounded-full bg-white px-5 py-2.5 font-mono text-[13px] font-semibold text-[#20294C] border border-[#c7cbdb]/50 shadow-[0_2px_8px_rgba(32,41,76,0.06)]"
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
              <span className="inline-flex items-center rounded-full bg-[#459AF8]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#1A63BF]">
                Matchmaking OS
              </span>
              <h2 className="font-sans text-[36px] sm:text-[46px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
                {home.play.title}
              </h2>
              <p className="text-[16px] leading-[1.45] text-[#424B6D]">{home.play.lead}</p>
              <ul className="grid gap-3 pt-2">
                {home.play.points.map((point) => (
                  <li key={point} className="flex gap-3 text-[14px] text-[#424B6D]">
                    <Icon name="check" size={16} className="mt-0.5 shrink-0 text-[#10b981]" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-7">
              <div className="rounded-[32px] bg-white p-7 sm:p-9 shadow-[0_8px_30px_rgba(32,41,76,0.08)] border border-white/80">
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#10b981]/15 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase text-[#047857]">
                    <span className="size-2 rounded-full bg-[#10b981] animate-ping" aria-hidden="true" />
                    Searching Queue
                  </span>
                  <span className="font-mono text-[13px] font-bold text-[#20294C]">3+2 Blitz</span>
                </div>
                <p className="mt-6 font-sans text-[26px] sm:text-[30px] font-extrabold uppercase leading-[0.95] text-[#20294C]">
                  Finding an opponent near your ELO…
                </p>
                <p className="mt-2 text-[15px] text-[#424B6D]">
                  You can close Telegram. We&apos;ll ping you the moment someone sits down at your board.
                </p>
                <div className="mt-6 flex flex-wrap gap-2.5" aria-label="Time controls">
                  {TIME_CONTROLS.map((tc) => (
                    <span
                      key={tc}
                      className="rounded-full bg-[#f0f1f5] px-4 py-1.5 font-mono text-[12px] font-bold text-[#20294C]"
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
              <div className="rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(32,41,76,0.08)] border border-white/80">
                <WagerDemo />
              </div>
            </div>
            <div className="order-1 md:order-2 md:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#10b981]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#047857]">
                Protocol Settlement
              </span>
              <h2 className="font-sans text-[36px] sm:text-[46px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
                {home.wagers.title}
              </h2>
              <p className="text-[16px] leading-[1.45] text-[#424B6D]">{home.wagers.lead}</p>
              <p className="flex gap-2 font-mono text-[12px] text-[#676B89] pt-2">
                <Icon name="shield-check" size={16} className="shrink-0 text-[#10b981]" />
                {home.wagers.risk}
              </p>
            </div>
          </div>
        </section>

        {/* ── Academy Tracks ─────────────────────────────────────── */}
        <section id="academy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-12">
            <div className="md:col-span-5 space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#459AF8]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#1A63BF]">
                Academy Mastery
              </span>
              <h2 className="font-sans text-[36px] sm:text-[46px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
                {home.academy.title}
              </h2>
              <p className="text-[16px] leading-[1.45] text-[#424B6D]">{home.academy.lead}</p>
            </div>
            <ul className="grid gap-3 md:col-span-7">
              {home.academy.tracks.map((track) => (
                <li
                  key={track.name}
                  className="flex items-center justify-between gap-4 rounded-[20px] bg-white p-5 border border-white/80 shadow-[0_4px_16px_rgba(32,41,76,0.06)] transition-transform duration-150 hover:translate-x-1"
                >
                  <span className="text-[16px] font-bold text-[#20294C]">{track.name}</span>
                  <span className="rounded-full bg-[#f0f1f5] px-3.5 py-1 font-mono text-[11px] font-semibold uppercase text-[#424B6D]">
                    {track.level}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Money Ledger (Night Inverted Panel) ─────────────────── */}
        <section id="money" className="shell-wide py-12">
          <div className="rounded-[40px] bg-[#071A22] p-8 sm:p-12 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/5">
            <div className="space-y-3">
              <span className="inline-flex items-center rounded-full bg-[#459AF8]/20 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#7DB8FA]">
                Transparent Treasury
              </span>
              <h2 className="font-sans text-[38px] sm:text-[52px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white">
                {home.money.title}
              </h2>
              <p className="max-w-[50ch] text-[16px] leading-[1.45] text-[#979DB5]">{home.money.lead}</p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-12">
              <ul className="grid gap-4 lg:col-span-5">
                {home.money.points.map((point) => (
                  <li key={point.title} className="rounded-[24px] bg-[#103645]/40 border border-white/5 p-6">
                    <p className="font-bold text-[16px] text-white">{point.title}</p>
                    <p className="mt-2 text-[14px] leading-[1.45] text-[#979DB5]">{point.body}</p>
                  </li>
                ))}
              </ul>

              <div className="rounded-[28px] bg-[#103645]/40 border border-white/5 p-6 lg:col-span-7">
                <p className="font-mono text-[11px] uppercase tracking-wider text-[#979DB5]">Example ledger</p>
                <ul className="mt-4 grid gap-1">
                  {[
                    { icon: "wallet" as IconName, title: "Deposit", meta: "Today, 11:24", amount: "+25.00 USDT", tone: "text-white" },
                    { icon: "sword" as IconName, title: "Match wager", meta: "Today, 11:31", amount: "−5.00 USDT", tone: "text-[#979DB5]" },
                    { icon: "trophy" as IconName, title: "Winnings", meta: "Today, 11:44", amount: "+9.50 USDT", tone: "text-[#34D399]" },
                    { icon: "clock" as IconName, title: "Withdrawal", meta: "Today, 12:02", amount: "−20.00 USDT", tone: "text-white", status: "Verified" },
                  ].map((row) => (
                    <li key={row.title} className="flex items-center gap-4 border-b border-white/10 py-3.5 last:border-0">
                      <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-white/10 text-white">
                        <Icon name={row.icon} size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold text-white">{row.title}</span>
                        <span className="block font-mono text-[11px] text-[#979DB5]">{row.meta}</span>
                      </span>
                      {row.status && (
                        <span className="rounded-full bg-[#10b981]/20 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase text-[#34D399]">
                          {row.status}
                        </span>
                      )}
                      <span className={`font-mono text-[14px] font-bold tabular-nums ${row.tone}`}>{row.amount}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 font-mono text-[11px] text-[#979DB5]">
                  Example ledger. 5 USDT wager creates 10 USDT pool; winner receives 9.50 USDT automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Progression Matrix ─────────────────────────────────── */}
        <section id="progression" className="shell-wide py-12">
          <div className="space-y-4 mb-8">
            <span className="inline-flex items-center rounded-full bg-[#10b981]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#047857]">
              XP Ecosystem
            </span>
            <h2 className="font-sans text-[36px] sm:text-[46px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
              {home.progression.title}
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {home.progression.tiles.map((tile, i) => {
              const iconName = PROGRESSION_ICONS[i] ?? "sparkle";
              return (
                <li
                  key={tile.title}
                  className="rounded-[28px] bg-white p-7 border border-white/80 shadow-[0_4px_18px_rgba(32,41,76,0.06)] transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <span className="grid size-10 place-items-center rounded-[10px] bg-[#f0f1f5] text-[#20294C]">
                    <Icon name={iconName} size={20} />
                  </span>
                  <p className="mt-4 text-[17px] font-bold text-[#20294C]">{tile.title}</p>
                  <p className="mt-1.5 text-[14px] leading-[1.45] text-[#424B6D]">{tile.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* ── Mission (Inverted Arc Card) ───────────────────────── */}
        <section className="shell-wide py-12">
          <div className="rounded-[40px] bg-[#071A22] p-8 sm:p-14 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/5">
            <span className="inline-flex items-center rounded-full bg-[#459AF8]/20 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#7DB8FA]">
              {home.mission.overline}
            </span>
            <h2 className="mt-4 font-sans text-[38px] sm:text-[52px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-white">
              {home.mission.title}
            </h2>
            <p className="mt-4 max-w-[55ch] text-[16px] sm:text-[18px] leading-[1.45] text-[#979DB5]">{home.mission.body}</p>
          </div>
        </section>

        {/* ── Philosophy: the king topples ───────────────────────── */}
        <section id="philosophy" className="shell-wide py-12">
          <div className="grid items-center gap-10 md:grid-cols-2 rounded-[32px] bg-white p-8 sm:p-12 shadow-[0_8px_30px_rgba(32,41,76,0.08)] border border-white/80">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full bg-[#10b981]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#047857]">
                {home.philosophy.overline}
              </span>
              <h2 className="font-sans text-[36px] sm:text-[46px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
                {home.philosophy.title}
              </h2>
              <p className="text-[16px] leading-[1.45] text-[#424B6D]">{home.philosophy.body}</p>
            </div>
            <div className="flex h-60 items-end justify-center">
              <KingMark className="topple h-48 w-auto text-[#20294C]" />
            </div>
          </div>
        </section>

        {/* ── Chronicles & Strategy (Blog Preview) ────────────────── */}
        <section id="blog" className="shell-wide py-12 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full bg-[#459AF8]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#1A63BF]">
                THE WEB3CHESS CHRONICLES
              </span>
              <h2 className="font-sans text-[38px] sm:text-[48px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
                Insights, fair play &amp; protocol strategy.
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 font-mono text-[13px] font-bold uppercase tracking-wider text-[#20294C] transition-transform hover:translate-x-1"
            >
              <span>Explore all articles</span>
              <Icon name="arrow-up-right" size={16} />
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
          <div className="rounded-[32px] bg-[#fff100] p-8 sm:p-12 text-[#042939] shadow-[0_8px_30px_rgba(255,241,0,0.25)]">
            <MoveOfTheDay />
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" className="shell-wide py-12">
          <div className="space-y-4 mb-8">
            <span className="inline-flex items-center rounded-full bg-[#10b981]/15 px-3.5 py-1 font-mono text-[11px] font-bold uppercase text-[#047857]">
              Clear Answers
            </span>
            <h2 className="font-sans text-[38px] sm:text-[48px] font-extrabold uppercase leading-[0.94] tracking-[-0.03em] text-[#20294C]">
              Questions players frequently ask.
            </h2>
          </div>
          <div className="rounded-[32px] bg-white p-8 sm:p-10 shadow-[0_8px_30px_rgba(32,41,76,0.08)] border border-white/80">
            <Faq />
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="shell-wide pb-16 pt-16">
        <div className="rounded-[40px] bg-[#071A22] p-8 sm:p-14 text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-white/5">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            <div className="lg:col-span-4 rounded-[28px] bg-[#103645]/40 border border-white/5 p-6 text-center">
              <div className="rounded-[20px] bg-white p-3.5 inline-block shadow-md">
                <div
                  className="size-32 [&>svg]:size-full"
                  dangerouslySetInnerHTML={{ __html: footerQr }}
                  role="img"
                  aria-label="QR code that opens Web3Chess in Telegram"
                />
              </div>
              <p className="mt-4 font-sans text-[22px] font-extrabold uppercase text-white">
                Scan to play in Telegram
              </p>
              <p className="font-mono text-[11px] text-[#979DB5] mt-1">
                Zero download · Instant start
              </p>
            </div>

            <div className="lg:col-span-8 grid gap-8 sm:grid-cols-3">
              {home.footer.columns.map((col) => (
                <div key={col.title} className="space-y-3">
                  <p className="font-mono text-[12px] uppercase tracking-wider text-[#7DB8FA] font-bold">{col.title}</p>
                  <ul className="grid gap-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href === "#" ? telegramLink() : l.href}
                          className="text-[15px] font-medium text-[#979DB5] transition-colors hover:text-white"
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

          <div className="mt-14 pt-8 border-t border-white/10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Logo inverse />
            <p className="max-w-[60ch] font-mono text-[11px] text-[#979DB5]">
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
