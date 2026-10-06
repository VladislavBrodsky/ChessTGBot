import { qrSvg } from "@/lib/qr";
import { telegramLink } from "@/lib/config";

/**
 * Fixed bottom-start QR. Shown from xl only: at lg the 1024px content column
 * reaches the viewport edge and the dock overlaps it.
 * QR is rendered to SVG at build time.
 */
export async function QrDock() {
  const svg = await qrSvg(telegramLink());
  return (
    <aside
      aria-label="Scan to play in Telegram"
      className="fixed bottom-6 start-6 z-50 hidden rounded-card border border-line bg-surface p-3 xl:block"
    >
      <div
        className="flex size-28 items-center justify-center rounded-media bg-white [&_svg]:block [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="QR code that opens Web3Chess in Telegram"
      />
      <div className="mt-2.5 text-center">
        <p className="font-mono text-overline uppercase text-fg">Scan to play</p>
        <p className="font-mono text-[11px] text-fg-muted">Telegram Mini App</p>
      </div>
    </aside>
  );
}
