"use client";

import { Chessboard, defaultPieces } from "react-chessboard";
import { useId, useEffect, useState } from "react";
import { board } from "../../../design-system/website/tokens";

/** Fog Board pieces: white stays white, black becomes Board Ink (never pure black). */
const pieces = Object.fromEntries(
  Object.entries(defaultPieces).map(([key, render]) => [
    key,
    (props?: {
      fill?: string;
      square?: string;
      svgStyle?: React.CSSProperties;
    }) =>
      render({
        ...props,
        fill: key.startsWith("w")
          ? board.pieceWhite.fill
          : board.pieceBlack.fill,
      }),
  ]),
);

type Props = {
  /** Position in FEN. */
  position: string;
  /** Accessible description of the position — required. */
  label: string;
  allowDragging?: boolean;
  showNotation?: boolean;
  squareStyles?: Record<string, React.CSSProperties>;
  onSquareClick?: (args: { square: string }) => void;
  onPieceDrop?: (args: {
    sourceSquare: string;
    targetSquare: string | null;
  }) => boolean;
};

export function FogBoard({
  position,
  label,
  allowDragging = false,
  showNotation = false,
  squareStyles,
  onSquareClick,
  onPieceDrop,
}: Props) {
  const id = useId();
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return (
    <div
      className="overflow-hidden rounded-media"
      role="img"
      aria-label={label}
    >
      <Chessboard
        options={{
          id,
          position,
          allowDragging,
          showNotation,
          animationDurationInMs: reducedMotion ? 0 : 200,
          darkSquareStyle: { backgroundColor: board.squareDark },
          lightSquareStyle: { backgroundColor: board.squareLight },
          darkSquareNotationStyle: { color: board.coordinateOnDark },
          lightSquareNotationStyle: { color: board.coordinateOnLight },
          squareStyles,
          onSquareClick,
          onPieceDrop,
          pieces,
        }}
      />
    </div>
  );
}
