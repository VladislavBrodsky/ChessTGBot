import Link from "next/link";
import { Logo } from "./Logo";
import { PlayButton } from "./PlayButton";
import { home } from "@/content/home";
import { SITE, telegramLink } from "@/lib/config";
import { qrSvg } from "@/lib/qr";
import { Badge } from "./ui/Badge";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { Icon } from "@/icons";

export async function Footer() {
  const footerQr = await qrSvg(telegramLink());

  return (
    <footer className="shell-wide pb-8 pt-8 sm:pb-12 sm:pt-10">
      <div className="rounded-card border border-line bg-surface p-6 sm:p-10 lg:rounded-block lg:p-12 shadow-xs">
        {/* Top Header Row with Logo and Play Button */}
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-line pb-6 sm:pb-8">
          <Logo />
          <PlayButton variant="primary" trackingLocation="footer_header" className="w-full sm:w-auto" />
        </div>

        {/* ── Community & Channels Interactive macOS Dock ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-5 border-b border-line">
          <div>
            <span className="font-mono text-overline font-semibold uppercase text-fg-muted tracking-wider block">
              Official Channels &amp; Ecosystem
            </span>
            <p className="text-body-sm text-fg-muted mt-0.5">
              Connect with developers, check on-chain rails, and challenge rivals worldwide.
            </p>
          </div>

          <div className="w-full md:w-auto flex justify-center sm:justify-end">
            <Dock iconMagnification={50} iconDistance={90} className="bg-inset/80 border-line">
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open Telegram bot"
                data-analytics-label="Footer Dock: Telegram Bot"
              >
                <DockIcon title="Telegram Bot" size={38}>
                  <Icon name="telegram-logo" size={20} className="text-blue-500" />
                </DockIcon>
              </a>

              <a
                href="https://t.me/chess_hub"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join Announcements channel"
                data-analytics-label="Footer Dock: Announcements Channel"
              >
                <DockIcon title="Announcements" size={38}>
                  <Icon name="paper-plane-tilt" size={19} className="text-sky-500" />
                </DockIcon>
              </a>

              <a
                href="https://t.me/chesshub_chat"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Join Community chat"
                data-analytics-label="Footer Dock: Player Community Chat"
              >
                <DockIcon title="Player Chat" size={38}>
                  <Icon name="chats-circle" size={19} className="text-emerald-500" />
                </DockIcon>
              </a>

              <a
                href="https://tonviewer.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View GRAM smart contract and transfers on Tonviewer"
                data-analytics-label="Footer Dock: GRAM Explorer"
              >
                <DockIcon title="GRAM Explorer" size={38}>
                  <Icon name="wallet" size={19} className="text-blue-400" />
                </DockIcon>
              </a>

              <a
                href="https://github.com/VladislavBrodsky/ChessTGBot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View open source repository on GitHub"
                data-analytics-label="Footer Dock: GitHub Repo"
              >
                <DockIcon title="GitHub" size={38}>
                  <svg className="size-[19px] fill-current text-fg-default" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </DockIcon>
              </a>
            </Dock>
          </div>
        </div>

        {/* Footer Navigation Columns & QR Box */}
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

        {/* Legal Disclaimers & Copyright */}
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
