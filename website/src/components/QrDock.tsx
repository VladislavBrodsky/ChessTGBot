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
      className="fixed bottom-6 start-6 z-50 hidden rounded-[24px] bg-white/95 backdrop-blur-md p-3.5 border border-[#c7cbdb]/60 shadow-[0_10px_30px_rgba(32,41,76,0.14)] xl:block transition-all hover:scale-105 group"
    >
      <div
        className="size-28 rounded-xl overflow-hidden bg-white p-1.5 border border-[#c7cbdb]/30 shadow-inner flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:block"
        dangerouslySetInnerHTML={{ __html: svg }}
        role="img"
        aria-label="QR code that opens Web3Chess in Telegram"
      />
      <div className="mt-2.5 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#20294C]">Scan to play</p>
        <p className="font-mono text-[9px] font-semibold text-[#676B89]">Telegram Mini App</p>
      </div>
    </aside>
  );
}
