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
      className="fixed bottom-6 start-5 z-50 hidden rounded-card bg-mist/50 p-2 backdrop-blur-sm xl:block"
    >
      <div
        className="size-25 [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="QR code that opens Web3Chess in Telegram"
      />
      <p className="mt-2 max-w-25 text-center text-caption text-fg-muted">Scan to play</p>
    </aside>
  );
}
