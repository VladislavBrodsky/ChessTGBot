import Link from "next/link";
import type { Metadata } from "next";
import { PlayButton } from "@/components/PlayButton";
import { Logo } from "@/components/Logo";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/icons";
import { qrSvg } from "@/lib/qr";
import { telegramLink, SITE } from "@/lib/config";

export const metadata: Metadata = {
  alternates: { canonical: `${SITE.url}/play` },
  title: "Play",
  description:
    "Open the Web3Chess arena in Telegram, or sign in to play chess in your browser.",
};

export default async function PlayPage() {
  const svg = await qrSvg(telegramLink("arena"));
  return (
    <main
      id="main"
      className="shell-prose flex min-h-screen flex-col items-center justify-center gap-7 py-12 text-center"
    >
      <Logo />
      <h1 className="poster text-heading-xl text-fg">Open the board</h1>
      <p className="max-w-[46ch] text-body text-fg-muted">
        Choose where to start. Free A.I. practice is available before you join a player match.
      </p>
      <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
        <PlayButton size="lg" startapp="arena" label="Open in Telegram" className="w-full" />
        <a
          href={`${SITE.appUrl}/en/login`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("secondary", "min-h-14 w-full")}
        >
          <Icon name="globe" size={18} />
          Play in browser
        </a>
      </div>
      <p className="text-caption text-fg-muted">Browser play also uses Telegram sign-in.</p>
      <div className="hidden rounded-card bg-surface p-6 shadow-card md:block">
        <div
          className="mx-auto size-60 [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label="QR code that opens Web3Chess in Telegram"
        />
        <p className="mt-4 text-body text-fg-muted">
          On a computer? Scan this with your phone camera.
        </p>
      </div>
      <p className="max-w-[50ch] text-caption text-fg-muted">
        Wager matches are 18+ where available and you can lose your stake.
      </p>
      <Link href="/" className="link text-body font-semibold">
        Back to the website
      </Link>
    </main>
  );
}
