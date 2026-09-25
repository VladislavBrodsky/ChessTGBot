"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { Sparkles, RotateCcw, CheckCircle2, ArrowRight } from "lucide-react";
import { FogBoard } from "./FogBoard";
import { home } from "@/content/home";
import { telegramLink } from "@/lib/config";

/** Verified with chess.js: Ra8 is mate in this position. */
const INITIAL_FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";

export function MoveOfTheDay() {
  const [game, setGame] = useState(() => new Chess(INITIAL_FEN));
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
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
        <p className="mt-3 text-center font-mono text-[12px] text-[#000000]/70">
          {solved ? "✓ Checkmate position reached" : "Drag the rook or click a square to move"}
        </p>
      </div>

      <div className="md:col-span-6 space-y-4 text-[#000000]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#000000] px-3.5 py-1 font-mono text-[11px] font-medium uppercase tracking-tight text-white">
            {home.moveOfTheDay.overline}
          </span>
          {solved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-mono text-[11px] font-bold text-[#000000]">
              <CheckCircle2 className="size-3.5 text-[#047857]" />
              SOLVED
            </span>
          )}
        </div>

        <h2 className="font-condensed text-[36px] sm:text-[48px] font-bold uppercase leading-[0.92] tracking-[-0.03em] text-[#000000]">
          {solved ? "BOOM. CHECKMATE IN 1." : home.moveOfTheDay.title}
        </h2>

        <p className="text-[16px] leading-[1.4] text-[#000000]/80">
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
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#000000] px-6 py-3 font-medium text-[15px] text-white transition-opacity hover:opacity-90 active:scale-95"
              >
                <span>Play Live in Telegram</span>
                <ArrowRight className="size-4" />
              </a>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#000000] px-4 py-3 font-mono text-[13px] font-semibold text-[#000000] hover:bg-black/5"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Puzzle</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleReveal}
                className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#000000] px-5 py-3 font-medium text-[14px] text-white transition-opacity hover:opacity-90"
              >
                <Sparkles className="size-3.5 text-[#fff100]" />
                <span>{revealed ? "Show Solution" : "Give Me A Hint"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
