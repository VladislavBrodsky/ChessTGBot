"use client";

import { Chessboard, defaultPieces } from "react-chessboard";
import { useId, useEffect, useRef, useState } from "react";
import { board } from "../../../design-system/website/tokens";
import { BoardFrame } from "./BoardFrame";

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
  const container = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    // The library adds unnamed keyboard drag targets. The labelled notation
    // form is the complete keyboard alternative; pointer drag and tap remain.
    const node = container.current;
    if (!node) return;
    const sync = () => node.querySelectorAll<HTMLElement>('[role="button"]').forEach((piece) => {
      if (piece.tabIndex !== -1) piece.tabIndex = -1;
      if (piece.getAttribute("aria-hidden") !== "true") piece.setAttribute("aria-hidden", "true");
    });
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ["tabindex"] });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  return (
    <div
      ref={container}
      className="fog-board"
      role="img"
      aria-label={label}
    >
      <BoardFrame notation={showNotation}>
      <Chessboard
        options={{
          id,
          position,
          allowDragging,
          showNotation: false,
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
      </BoardFrame>
    </div>
  );
}
