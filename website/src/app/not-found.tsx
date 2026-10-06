import Link from "next/link";
import { PlayButton } from "@/components/PlayButton";
import { KingMark } from "@/components/icons";

export default function NotFound() {
  return (
    <main id="main" className="shell-prose flex min-h-screen flex-col items-center justify-center gap-6 py-16 text-center">
      <KingMark className="h-24 w-auto rotate-[-88deg] text-fg" />
      <h1 className="poster text-heading-xl text-fg">This position doesn&apos;t exist.</h1>
      <p className="text-body sm:text-lead text-fg-muted">The page you asked for isn&apos;t on the board.</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <PlayButton size="md" />
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-control border border-line-strong px-5 text-button text-fg transition-colors duration-150 hover:bg-white"
        >
          Back to the website
        </Link>
      </div>
    </main>
  );
}
