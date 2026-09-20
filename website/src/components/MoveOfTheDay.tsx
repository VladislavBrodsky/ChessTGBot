"use client";

import { useState } from "react";
import { FogBoard } from "./FogBoard";
import { home } from "@/content/home";

/** Verified with chess.js: Ra8 is mate in this position. */
const FEN = "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1";

export function MoveOfTheDay() {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="grid items-center gap-8 md:grid-cols-2">
      <div className="mx-auto w-full max-w-90">
        <FogBoard
          position={FEN}
          label="White rook on a1, white king g1, pawns f2 g2 h2. Black king g8, pawns f7 g7 h7. White to move and mate in one."
          squareStyles={
            revealed
              ? { a8: { backgroundColor: "rgba(255, 255, 0, 0.45)" } }
              : undefined
          }
        />
      </div>
      <div>
        <p className="text-overline uppercase">{home.moveOfTheDay.overline}</p>
        <h2 className="mt-3 text-heading-md">{home.moveOfTheDay.title}</h2>
        <p className="mt-3 text-body-lg">{home.moveOfTheDay.body}</p>
        <p className="mt-5 text-body">
          {revealed ? (
            <span className="font-mono text-title">{home.moveOfTheDay.answer}</span>
          ) : (
            <span className="text-fg">{home.moveOfTheDay.hint}</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="mt-4 min-h-11 rounded-pill border-[1.5px] border-abyss px-5 text-button transition-opacity duration-150 hover:opacity-80"
        >
          {revealed ? "Hide the move" : "Show the move"}
        </button>
      </div>
    </div>
  );
}
