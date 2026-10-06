import { qrSvg } from "@/lib/qr";
import { telegramLink } from "@/lib/config";

/**
 * Fixed bottom-start QR dock. Compact, centered, and unobtrusive.
 * Shown from xl (1280px+). QR is rendered to SVG at build time.
 */
export async function QrDock() {
  const svg = await qrSvg(telegramLink());
  return (
    <aside
      aria-label="Scan to play in Telegram"
      className="fixed bottom-5 start-5 z-50 hidden flex-col items-center justify-center rounded-[20px] border border-line bg-surface p-2.5 shadow-sm xl:flex"
    >
      <div
        className="mx-auto flex size-20 items-center justify-center rounded-control bg-white p-1 [&_svg]:block [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="QR code that opens Web3Chess in Telegram"
      />
      <div className="mt-2 w-full text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg leading-tight">
          Scan to play
        </p>
        <p className="font-mono text-[9px] text-fg-muted mt-0.5 leading-none">
          Telegram Mini App
        </p>
      </div>
    </aside>
  );
}
