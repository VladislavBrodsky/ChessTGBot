import type { ReactNode } from "react";
import Image from "next/image";
import { chessArt, type ChessArtVariant } from "@/lib/chess-art";
import { SculptureMotion } from "./SculptureMotion";

export function ChessSculpture({
  variant = "home",
  footer,
}: {
  variant?: ChessArtVariant;
  /** Replaces the art tagline under the sculpture (e.g. the home payouts line). */
  footer?: ReactNode;
}) {
  const art = chessArt[variant];
  return (
    <figure className="chess-stage" data-art={variant}>
      <SculptureMotion>
        <Image
          src={`/illustrations/${art.file}.webp`}
          width={1000}
          height={1000}
          sizes="(max-width: 333px) 180px, (max-width: 414px) 54vw, (max-width: 639px) 224px, (max-width: 767px) 280px, (max-width: 1023px) 340px, 448px"
          alt={art.alt}
          className="chess-sculpture relative z-10 h-auto w-full"
          loading="eager"
          fetchPriority="high"
        />
      </SculptureMotion>
      <figcaption className="stage-caption relative z-10 text-caption text-fg-muted">
        {footer ?? art.title}
      </figcaption>
    </figure>
  );
}
