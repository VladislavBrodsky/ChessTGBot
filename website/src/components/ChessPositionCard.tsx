"use client";

import { FogBoard } from "@/components/FogBoard";

interface ChessPositionCardProps {
  fen: string;
  caption?: string;
}

export function ChessPositionCard({ fen, caption }: ChessPositionCardProps) {
  return (
    <figure className="my-6 min-w-0 rounded-media bg-inset p-3 sm:p-5">
      <div className="mx-auto max-w-[340px] sm:max-w-[380px]">
        <FogBoard position={fen} label={caption || "Chess tactical diagram"} />
      </div>
      {caption && (
        <figcaption className="mt-4 text-center font-mono text-caption text-fg-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
