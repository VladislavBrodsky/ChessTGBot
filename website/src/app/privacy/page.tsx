import { Eyebrow } from "@/components/ui/Badge";
import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { QrDock } from "@/components/QrDock";
import { MobileCta } from "@/components/MobileCta";
import { SITE } from "@/lib/config";
import { Icon } from "@/icons";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE.url}/privacy` },
  title: "Privacy Policy",
  description:
    "How Web3Chess handles data privacy, Telegram WebApp authentication, and TON wallet routing.",
  openGraph: {
    title: "Privacy Policy · Web3Chess",
    description:
      "Data handling, telemetry protection, and privacy standards on Web3Chess.",
    url: `${SITE.url}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      <Nav />

      <main id="main" className="shell-prose space-y-12 py-8 md:py-14">
        {/* Top Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-control bg-surface px-4 py-2 font-mono text-overline uppercase text-fg transition-opacity hover:opacity-80"
          >
            <Icon name="arrow-left" size={14} className="flip-rtl" />
            <span>Back to Home</span>
          </Link>
          <span className="font-mono text-caption text-fg-muted">
            Last updated: October 2026
          </span>
        </div>

        {/* Header */}
        <section className="space-y-4">
          <Eyebrow>Data Protection</Eyebrow>
          <h1 className="poster text-heading-xl text-fg">Privacy Policy</h1>
          <p className="text-body sm:text-lead text-fg-muted">
            This page explains the account, game, wallet, and device information
            used to run Web3Chess. The website does not use third-party ad trackers.
          </p>
        </section>

        {/* Content Card */}
        <div className="rounded-card bg-surface p-8 md:p-12 space-y-8 text-body text-fg-muted">
          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              1. TELEGRAM DATA &amp; AUTHENTICATION
            </h2>
            <p>
              Telegram authentication provides a signed account identifier and
              profile details such as your display name, username, language, and
              available profile photo. The app uses these to sign you in and
              display your account. We do not ask for your Telegram password,
              contacts, or private messages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              2. WALLET ADDRESSES &amp; TRANSACTION RECORDS
            </h2>
            <p>
              We record public wallet addresses and deposit, balance, and
              withdrawal transaction details to route and reconcile funds.
              Web3Chess does not ask for your wallet private key, seed phrase,
              or external wallet password. A platform balance is separate from
              assets held in your personal wallet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              3. GAME DATA &amp; ABUSE PREVENTION
            </h2>
            <p>
              Match moves, results, clocks, and connection events are used to
              run games, calculate ratings, and show history and leaderboards.
              We may also retain limited security signals, including a hashed
              sign-up IP signal, to detect referral abuse and protect accounts.
              Server-side move validation does not prove that every opponent is
              playing without outside assistance.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="poster text-heading-md text-fg">
              4. STORAGE &amp; THIRD-PARTY TRACKING
            </h2>
            <p>
              Browser storage remembers interface preferences and, for web
              sign-in, Telegram authentication data needed to keep your session
              working. You can clear local browser data or sign out to remove
              stored web authentication from that device. We do not deploy
              third-party advertising trackers or sell player data to data
              brokers.
            </p>
          </section>
        </div>
      </main>

      <Footer />
      <QrDock />
      <MobileCta />
    </div>
  );
}
