"use client";

import { FogBoard } from "@/components/FogBoard";

interface ChessPositionCardProps {
  fen: string;
  caption?: string;
}

export function ChessPositionCard({ fen, caption }: ChessPositionCardProps) {
  return (
    <figure className="my-8 overflow-hidden rounded-[28px] border border-line bg-card p-4 sm:p-6">
      <div className="mx-auto max-w-[340px] sm:max-w-[380px]">
        <FogBoard
          position={fen}
          label={caption || "Chess tactical diagram"}
        />
      </div>
      {caption && (
        <figcaption className="mt-4 text-center font-mono text-xs text-fg-muted uppercase tracking-wider">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
