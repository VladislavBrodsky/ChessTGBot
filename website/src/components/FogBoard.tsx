"use client";

import { Chessboard, defaultPieces } from "react-chessboard";
import { board } from "../../../design-system/website/tokens";

/** Fog Board pieces: white stays white, black becomes Board Ink (never pure black). */
const pieces = Object.fromEntries(
  Object.entries(defaultPieces).map(([key, render]) => [
    key,
    (props?: { fill?: string; square?: string; svgStyle?: React.CSSProperties }) =>
      render({
        ...props,
        fill: key.startsWith("w") ? board.pieceWhite.fill : board.pieceBlack.fill,
      }),
  ])
);

type Props = {
  /** Position in FEN. */
  position: string;
  /** Accessible description of the position — required. */
  label: string;
  squareStyles?: Record<string, React.CSSProperties>;
  onSquareClick?: (args: { square: string }) => void;
};

export function FogBoard({ position, label, squareStyles, onSquareClick }: Props) {
  return (
    <div
      className="overflow-hidden rounded-card shadow-card"
      role="img"
      aria-label={label}
    >
      <Chessboard
        options={{
          id: "fog-board",
          position,
          allowDragging: false,
          showNotation: true,
          animationDurationInMs: 200,
          darkSquareStyle: { backgroundColor: board.squareDark },
          lightSquareStyle: { backgroundColor: board.squareLight },
          darkSquareNotationStyle: { color: board.coordinateOnDark },
          lightSquareNotationStyle: { color: board.coordinateOnLight },
          squareStyles,
          onSquareClick,
          pieces,
        }}
      />
    </div>
  );
}
