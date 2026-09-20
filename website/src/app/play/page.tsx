import Link from "next/link";
import type { Metadata } from "next";
import { PlayButton } from "@/components/PlayButton";
import { Logo } from "@/components/Logo";
import { qrSvg } from "@/lib/qr";
import { telegramLink } from "@/lib/config";

export const metadata: Metadata = {
  title: "Play",
  description: "Open Web3Chess in Telegram, or scan the QR code with your phone.",
};

export default async function PlayPage() {
  const svg = await qrSvg(telegramLink());
  return (
    <main id="main" className="shell-prose flex min-h-screen flex-col items-center justify-center gap-8 py-16 text-center">
      <Logo />
      <h1 className="text-heading-xl text-fg">Open the board.</h1>
      <PlayButton size="lg" />
      <div className="rounded-card bg-surface p-6 shadow-card">
        <div
          className="mx-auto size-60 [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label="QR code that opens Web3Chess in Telegram"
        />
        <p className="mt-4 text-body text-fg-muted">On a computer? Scan this with your phone camera.</p>
      </div>
      <Link href="/" className="link text-body font-semibold">Back to the website</Link>
    </main>
  );
}
