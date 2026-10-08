import Image from "next/image";
import { chessArt, type ChessArtVariant } from "@/lib/chess-art";
import { SculptureMotion } from "./SculptureMotion";

export function ChessSculpture({
  variant = "home",
}: {
  variant?: ChessArtVariant;
}) {
  const art = chessArt[variant];
  return (
    <figure className="chess-stage" data-art={variant}>
      <SculptureMotion>
        <Image
          src={`/illustrations/${art.file}.webp`}
          width={1000}
          height={1000}
          sizes="(max-width: 639px) 56vw, (max-width: 767px) 320px, (max-width: 1279px) 44vw, 528px"
          alt={art.alt}
          className="chess-sculpture relative z-10 h-auto w-full"
          loading="eager"
          fetchPriority="high"
        />
      </SculptureMotion>
      <figcaption className="stage-caption relative z-10 text-caption text-fg-muted">
        {art.title}
      </figcaption>
    </figure>
  );
}
