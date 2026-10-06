import Link from "next/link";
import { Logo } from "./Logo";
import { home } from "@/content/home";
import { SITE, telegramLink } from "@/lib/config";
import { qrSvg } from "@/lib/qr";

export async function Footer() {
  const footerQr = await qrSvg(telegramLink());

  return (
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
                  {col.links.map((l) => {
                    const isExternal = l.href.startsWith("http") || l.href === "#";
                    const targetHref = l.href === "#" ? telegramLink() : l.href;

                    return (
                      <li key={l.label}>
                        {isExternal ? (
                          <a
                            href={targetHref}
                            className="link text-body text-fg-muted hover:text-fg"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.label}
                          </a>
                        ) : (
                          <Link
                            href={targetHref}
                            className="link text-body text-fg-muted hover:text-fg"
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
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo inverse />
          <p className="max-w-[60ch] font-mono text-caption text-fg-muted">
            {home.footer.legal} © {new Date().getFullYear()} {SITE.name}.
          </p>
        </div>
      </div>
    </footer>
  );
}
