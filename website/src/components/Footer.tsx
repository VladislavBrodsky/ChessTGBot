import Link from "next/link";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";
import { SITE, telegramLink } from "@/lib/config";
import { qrSvg } from "@/lib/qr";
import { Badge } from "./ui/Badge";

export async function Footer() {
  const footerQr = await qrSvg(telegramLink());

  return (
    <footer className="shell-wide pb-8 pt-8 sm:pb-12 sm:pt-10">
      <div className="rounded-card border border-line bg-surface p-6 sm:p-10 lg:rounded-block lg:p-12 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-6 sm:pb-8">
          <Logo />
          <PlayButton variant="primary" className="w-full sm:w-auto" />
        </div>
        <div className="grid items-start gap-8 py-6 sm:py-8 lg:grid-cols-[1fr_auto] lg:gap-12">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
            {home.footer.columns.map((col, index) => (
              <div
                key={col.title}
                className={`space-y-2 ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}
              >
                <p className="font-mono text-overline font-semibold uppercase text-fg-muted tracking-wider">
                  {col.title}
                </p>
                <ul className={`grid gap-1 ${index === 2 ? "grid-cols-2 gap-x-6 sm:grid-cols-1" : ""}`}>
                  {col.links.map((l) => {
                    const isExternal = l.href.startsWith("http");

                    return (
                      <li key={l.label}>
                        {isExternal ? (
                          <a
                            href={l.href}
                            className="link inline-flex min-h-11 min-w-11 items-center text-body text-fg-muted hover:text-fg transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.label}
                          </a>
                        ) : (
                          <Link
                            href={l.href}
                            className="link inline-flex min-h-11 min-w-11 items-center text-body text-fg-muted hover:text-fg transition-colors"
                          >
                            {l.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="hidden max-w-44 text-center lg:block">
            <div className="inline-block rounded-media bg-white border border-line p-3 shadow-xs">
              <div
                className="size-28 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: footerQr }}
                role="img"
                aria-label="QR code that opens Web3Chess in Telegram"
              />
            </div>
            <p className="mt-3 text-caption font-medium text-fg-default">Scan to play</p>
            <p className="mt-1 font-mono text-caption text-fg-muted">
              Opens in Telegram
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <Badge tone="outline">18+ wager matches</Badge>
          <p className="max-w-[85ch] text-caption text-fg-muted">
            {home.footer.legal} © {new Date().getFullYear()} {SITE.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
