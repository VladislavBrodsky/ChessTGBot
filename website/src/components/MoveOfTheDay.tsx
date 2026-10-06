"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { FogBoard } from "./FogBoard";
import { home } from "@/content/home";
import { telegramLink } from "@/lib/config";
import { Icon } from "@/icons";

/** Verified with chess.js: Ra8 is mate in this position. */
const INITIAL_FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";

export function MoveOfTheDay() {
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  const [solved, setSolved] = useState(false);
  const [, setRevealed] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  const handleDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare) return false;

    try {
      const g = new Chess(game.fen());
      const move = g.move({ from: sourceSquare, to: targetSquare });

      if (move) {
        setGame(g);
        if (move.san === "Ra8#") {
          setSolved(true);
        } else {
          // Wrong move, trigger shake feedback and revert
          setErrorShake(true);
          setTimeout(() => {
            setGame(new Chess(INITIAL_FEN));
            setErrorShake(false);
          }, 800);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleReveal = () => {
    const g = new Chess(INITIAL_FEN);
    g.move("Ra8");
    setGame(g);
    setSolved(true);
    setRevealed(true);
  };

  const handleReset = () => {
    setGame(new Chess(INITIAL_FEN));
    setSolved(false);
    setRevealed(false);
  };

  return (
    <div className="grid items-center gap-10 md:grid-cols-12">
      <div className={`mx-auto w-full max-w-100 md:col-span-6 ${errorShake ? "animate-shake" : ""}`}>
        <FogBoard
          position={game.fen()}
          label="White rook on a1, white king g1, pawns f2 g2 h2. Black king g8, pawns f7 g7 h7. White to move and mate in one."
          allowDragging={!solved}
          onPieceDrop={handleDrop}
          squareStyles={
            solved
              ? { a8: { backgroundColor: "rgba(255, 255, 255, 0.85)" }, g8: { backgroundColor: "rgba(225, 29, 72, 0.6)" } }
              : { a1: { backgroundColor: "rgba(0, 0, 0, 0.15)" } }
          }
        />
        <p className="mt-3 text-center font-mono text-caption font-semibold" aria-live="polite">
          {solved ? "Checkmate position reached" : "Drag the rook, or click a square to move"}
        </p>
      </div>

      <div className="space-y-4 md:col-span-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-pill bg-inverse px-3.5 py-1 font-mono text-overline uppercase text-fg-inverse">
            {home.moveOfTheDay.overline}
          </span>
          {solved && (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1 font-mono text-overline uppercase text-black">
              <Icon name="check-circle" size={14} />
              Solved
            </span>
          )}
        </div>

        <h2 className="poster text-heading-lg">
          {solved ? "Checkmate in 1." : home.moveOfTheDay.title}
        </h2>

        <p className="text-body-sm font-medium sm:text-body">
          {solved
            ? "White delivers back-rank mate with 1. Ra8#. The black pawns trap their own king with no escape square."
            : home.moveOfTheDay.body}
        </p>

        <div className="pt-2">
          {solved ? (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={telegramLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-control bg-inverse px-5 text-button text-fg-inverse transition-colors duration-150 hover:bg-graphite active:scale-[.98]"
              >
                <span>Play in Telegram</span>
                <Icon name="arrow-right" size={16} className="flip-rtl" />
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-12 items-center gap-1.5 rounded-control border border-black px-5 text-button hover:bg-white/60"
              >
                <Icon name="arrow-counter-clockwise" size={14} />
                <span>Reset puzzle</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleReveal}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-control bg-inverse px-5 text-button text-fg-inverse transition-colors duration-150 hover:bg-graphite active:scale-[.98]"
            >
              <Icon name="sparkle" size={14} />
              <span>Show the solution</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
