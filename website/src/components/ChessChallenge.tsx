"use client";

import { useState } from "react";
import { Chess } from "chess.js";
import { FogBoard } from "./FogBoard";
import { ChallengeIntro } from "./ChallengeIntro";
import { Button } from "./ui/Button";
import { PlayButton } from "./PlayButton";
import { ShareButtons } from "./ShareButtons";
import { CHALLENGES } from "@/content/challenges";
import { SITE } from "@/lib/config";
import { board } from "../../../design-system/website/tokens";
import { Icon } from "@/icons";

export function ChessChallenge() {
  const [index, setIndex] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("puzzle");
    return Math.max(
      0,
      CHALLENGES.findIndex((p) => p.id === id),
    );
  });
  const puzzle = CHALLENGES[index];
  const [position, setPosition] = useState<string>(puzzle.fen);
  const [outcome, setOutcome] = useState<"playing" | "solved" | "revealed">(
    "playing",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [moveText, setMoveText] = useState("");
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState(
    "White to move. Find checkmate in one.",
  );

  function reset(next = index) {
    setIndex(next);
    setPosition(CHALLENGES[next].fen);
    setOutcome("playing");
    setSelected(null);
    setMoveText("");
    setHint(false);
    setFeedback("White to move. Find checkmate in one.");
  }
  function tryMove(move: string | { from: string; to: string }) {
    if (outcome !== "playing") return false;
    try {
      const game = new Chess(puzzle.fen);
      game.move(move);
      if (!game.isCheckmate()) {
        setFeedback("Legal move, but not checkmate. Try another move.");
        return false;
      }
      setPosition(game.fen());
      setOutcome("solved");
      setSelected(null);
      setFeedback("You found checkmate. Nicely calculated.");
      return true;
    } catch {
      setFeedback(
        "That move isn’t legal here. Use standard notation, such as a piece letter and destination square.",
      );
      return false;
    }
  }
  function reveal() {
    const game = new Chess(puzzle.fen);
    game.move(puzzle.answer);
    setPosition(game.fen());
    setOutcome("revealed");
    setSelected(null);
    setFeedback("Solution shown: " + puzzle.answer);
  }

  return (
    <div className="challenge-layout">
      <ChallengeIntro
        solved={outcome === "solved"}
        explanation={outcome === "playing" ? undefined : puzzle.explanation}
      />
      <div className="challenge-board">
        <div className="mx-auto min-w-0 w-full max-w-100">
          <div className="mb-3 flex items-center justify-between font-mono text-caption">
            <span>{puzzle.name}</span>
            <span>0{index + 1} / 03</span>
          </div>
          <FogBoard
            position={position}
            label={
              outcome === "playing"
                ? puzzle.label
                : "Checkmate. " + puzzle.explanation
            }
            allowDragging={outcome === "playing"}
            showNotation
            onPieceDrop={({ sourceSquare, targetSquare }) =>
              targetSquare
                ? tryMove({ from: sourceSquare, to: targetSquare })
                : false
            }
            onSquareClick={({ square }) => {
              if (outcome !== "playing") return;
              if (square === puzzle.from) {
                setSelected(square);
                return;
              }
              if (selected) {
                tryMove({ from: selected, to: square });
                setSelected(null);
              }
            }}
            squareStyles={
              outcome !== "playing"
                ? { [puzzle.to]: { backgroundColor: board.selected } }
                : selected
                  ? { [selected]: { backgroundColor: board.selected } }
                  : {}
            }
          />
          <p className="mt-3 text-caption text-center text-fg-muted">
            Drag a piece, or tap it then its destination.
          </p>
        </div>
      </div>
      <div className="challenge-controls space-y-5">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Choose a chess challenge"
        >
          {CHALLENGES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={i === index}
              onClick={() => reset(i)}
              className={`min-h-11 rounded-control border px-3 text-caption font-medium ${i === index ? "border-line-strong bg-inverse text-fg-inverse" : "border-line bg-inset hover:bg-canvas"}`}
            >
              {item.name}
            </button>
          ))}
        </div>
        {outcome === "playing" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              tryMove(moveText.trim());
            }}
            className="space-y-2"
          >
            <label
              htmlFor="challenge-move"
              className="block text-caption font-semibold"
            >
              Your move in chess notation
            </label>
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] md:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto]">
              <input
                id="challenge-move"
                name="move"
                value={moveText}
                onChange={(e) => setMoveText(e.target.value)}
                placeholder="e.g. Ra8"
                autoComplete="off"
                spellCheck={false}
                aria-describedby="challenge-feedback"
                className="min-h-12 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 font-mono text-body"
              />
              <Button
                type="submit"
                className="w-full sm:w-auto md:w-full xl:w-auto"
              >
                Play move
                <Icon name="arrow-right" size={16} />
              </Button>
            </div>
          </form>
        )}
        <p
          id="challenge-feedback"
          role="status"
          className="text-body-sm font-medium"
        >
          {feedback}
        </p>
        {hint && outcome === "playing" && (
          <p className="text-body-sm">{puzzle.hint}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {outcome === "playing" ? (
            <>
              <Button
                variant="soft"
                onClick={() => setHint(!hint)}
                aria-expanded={hint}
              >
                {hint ? "Hide hint" : "Give me a hint"}
              </Button>
              <Button variant="soft" onClick={reveal}>
                Show solution
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={() => reset()}>
                <Icon name="arrow-counter-clockwise" size={16} />
                Try again
              </Button>
              <PlayButton />
            </>
          )}
        </div>
        <ShareButtons
          title={`Can you find the mate in one? Try ${puzzle.name}.`}
          url={`${SITE.url}/?puzzle=${puzzle.id}#challenge`}
          compact
        />
      </div>
    </div>
  );
}
