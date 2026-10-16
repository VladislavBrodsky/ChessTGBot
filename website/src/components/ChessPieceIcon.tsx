import type { ReactElement } from "react";

/** Line-art Staunton pieces sized by the caller; decorative, so the label belongs to the parent. */
export function KingIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2v4M10 4h4" />
      <path d="M6.5 8.5C8 9.5 9 10 12 10s4-.5 5.5-1.5c.8 3.5-1 6.5-1.5 8.5h-8C7.5 15 5.7 12 6.5 8.5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

export function QueenIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="5" cy="6" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="4" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="4.5" r="1.2" fill="currentColor" />
      <circle cx="19" cy="6" r="1.2" fill="currentColor" />
      <path d="M5 8l2 9h10l2-9-3.5 2.5L12 6l-3.5 4.5L5 8z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

export function KnightIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 19c-.8-4.2-2.8-6.2-3.8-7.2.2-2.5-1-4.8-2.2-5.8-.8-.6-1.5-.2-1.8.2L9 8C7.5 9 6.2 10.8 6 13c-.3 2.5 1 4.5 2 5" fill="currentColor" fillOpacity="0.12" />
      <path d="M10 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor" />
      <path d="M6 19h13M5 21h14" />
    </svg>
  );
}

export function RookIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 4v3h2.5V4h3v3h1V4h3v3H18V4" />
      <path d="M7 7l1 10h8l1-10H7z" fill="currentColor" fillOpacity="0.12" />
      <path d="M6 17h12M5 20h14" />
    </svg>
  );
}

export function BishopIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="3.5" r="1.2" fill="currentColor" />
      <path d="M12 5c-3 0-5 3.2-5 7 0 2.5 1.5 4.5 2.5 5h5c1-.5 2.5-2.5 2.5-5 0-3.8-2-7-5-7z" fill="currentColor" fillOpacity="0.12" />
      <path d="M10.5 9.5l3 3" />
      <path d="M6.5 17h11M5.5 20h13" />
    </svg>
  );
}

export function PawnIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="6.5" r="2.8" fill="currentColor" fillOpacity="0.12" />
      <path d="M9.5 10.5c0 3-1.8 5.5-2 6.5h9c-.2-1-2-3.5-2-6.5h-5z" fill="currentColor" fillOpacity="0.12" />
      <path d="M9 11h6M7 17h10M6 20h12" />
    </svg>
  );
}

export type ChessPiece = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

const PIECES: Record<ChessPiece, (props: { className?: string }) => ReactElement> = {
  king: KingIcon,
  queen: QueenIcon,
  rook: RookIcon,
  bishop: BishopIcon,
  knight: KnightIcon,
  pawn: PawnIcon,
};

export function ChessPieceIcon({ piece, className = "size-5" }: { piece: ChessPiece; className?: string }) {
  const Piece = PIECES[piece];
  return <Piece className={className} />;
}
