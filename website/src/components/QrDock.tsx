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
      className="fixed bottom-6 start-6 z-50 hidden rounded-[24px] bg-white/90 backdrop-blur-md p-3.5 border border-[#c7cbdb]/50 shadow-[0_8px_25px_rgba(32,41,76,0.12)] xl:block transition-all hover:scale-105 group"
    >
      <div
        className="size-24 rounded-[12px] overflow-hidden [&>svg]:size-full bg-white p-1"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="QR code that opens Web3Chess in Telegram"
      />
      <div className="mt-2 text-center">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#20294C]">Scan to play</p>
        <p className="font-mono text-[9px] text-[#676B89]">Telegram Mini App</p>
      </div>
    </aside>
  );
}
