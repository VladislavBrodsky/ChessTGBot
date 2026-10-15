"use client";

import { useRef, useState } from "react";
import { Chess } from "chess.js";
import { FogBoard } from "./FogBoard";
import { ChallengeIntro } from "./ChallengeIntro";
import { ChallengePicker } from "./ChallengePicker";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { PlayButton } from "./PlayButton";
import { ShareButtons } from "./ShareButtons";
import { CHALLENGES } from "@/content/challenges";
import { SITE } from "@/lib/config";
import { trackPuzzleInteraction } from "@/lib/analytics";
import { board } from "../../../design-system/website/tokens";
import { Icon } from "@/icons";

export function ChessChallenge() {
  const startedPuzzle = useRef<string | null>(null);
  const [index, setIndex] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("puzzle");
    return Math.max(
      0,
      CHALLENGES.findIndex((p) => p.id === id),
    );
  });
  const puzzle = CHALLENGES[index];
  const [solvedIds, setSolvedIds] = useState<string[]>([]);
  const [position, setPosition] = useState<string>(puzzle.fen);
  const [outcome, setOutcome] = useState<"playing" | "solved" | "revealed">(
    "playing",
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [moveText, setMoveText] = useState("");
  const [hint, setHint] = useState(false);
  const [moveError, setMoveError] = useState(false);
  const [feedback, setFeedback] = useState(
    "White to move. Find checkmate in one.",
  );

  function reset(next = index) {
    if (next !== index) {
      trackPuzzleInteraction(CHALLENGES[next].id, "switch");
    }
    setIndex(next);
    startedPuzzle.current = null;
    setPosition(CHALLENGES[next].fen);
    setOutcome("playing");
    setSelected(null);
    setMoveText("");
    setHint(false);
    setMoveError(false);
    setFeedback("White to move. Find checkmate in one.");
  }
  function tryMove(move: string | { from: string; to: string }) {
    if (outcome !== "playing") return false;
    if (startedPuzzle.current !== puzzle.id) {
      trackPuzzleInteraction(puzzle.id, "start");
      startedPuzzle.current = puzzle.id;
    }
    const moveNotation =
      typeof move === "string" ? move : `${move.from}-${move.to}`;
    try {
      const game = new Chess(puzzle.fen);
      game.move(move);
      if (!game.isCheckmate()) {
        trackPuzzleInteraction(puzzle.id, "move_try", {
          move: moveNotation,
          is_checkmate: false,
        });
        setMoveError(true);
        setFeedback("Legal move, but not checkmate. Try another move.");
        return false;
      }
      trackPuzzleInteraction(puzzle.id, "solve", {
        winning_move: moveNotation,
      });
      setPosition(game.fen());
      setMoveError(false);
      setOutcome("solved");
      setSolvedIds((current) => current.includes(puzzle.id) ? current : [...current, puzzle.id]);
      setSelected(null);
      setFeedback("You found checkmate. Nicely calculated.");
      return true;
    } catch {
      trackPuzzleInteraction(puzzle.id, "move_try", {
        move: moveNotation,
        is_legal: false,
      });
      setMoveError(true);
      setFeedback(
        "That move isn’t legal here. Use standard notation, such as a piece letter and destination square.",
      );
      return false;
    }
  }
  function reveal() {
    trackPuzzleInteraction(puzzle.id, "reveal");
    const game = new Chess(puzzle.fen);
    game.move(puzzle.answer);
    setPosition(game.fen());
    setOutcome("revealed");
    setMoveError(false);
    setSelected(null);
    setFeedback("Solution shown: " + puzzle.answer);
  }

  return (
    <div className="challenge-layout">
      <ChallengeIntro
        solved={outcome === "solved"}
        explanation={outcome === "playing" ? undefined : puzzle.explanation}
      />
      <ChallengePicker index={index} solvedIds={solvedIds} onSelect={reset} />
      <div className="challenge-board">
        <div className="mx-auto min-w-0 w-full max-w-100">
          <div className="challenge-board-heading">
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
          <p className="challenge-board-note mt-3 text-caption text-center text-fg-muted">
            {outcome === "playing"
              ? "Drag a piece, tap two squares, or type a move."
              : "Checkmate. Ready for the next position?"}
          </p>
        </div>
      </div>
      <div className="challenge-controls space-y-4">
        <div className="challenge-progress" aria-label="Challenge progress">
          <p className="flex flex-wrap items-baseline justify-between gap-2 text-body-sm">
            <span className="font-semibold">Your progress</span>
            <span className="font-mono tabular-nums">{solvedIds.length} / {CHALLENGES.length} solved</span>
          </p>
          <div className="mt-2 flex gap-2" aria-hidden="true">
            {CHALLENGES.map((item) => (
              <span key={item.id} className={`h-1 flex-1 rounded-pill ${solvedIds.includes(item.id) ? "bg-fg-win" : "bg-line"}`} />
            ))}
          </div>
          {solvedIds.length === CHALLENGES.length && (
            <p className="mt-3 text-body-sm font-semibold" role="status">Three for three. Invite a friend to try the same boards.</p>
          )}
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
            <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                id="challenge-move"
                name="move"
                value={moveText}
                onChange={(e) => { setMoveText(e.target.value); setMoveError(false); }}
                placeholder="e.g. Ra8"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                enterKeyHint="go"
                spellCheck={false}
                aria-describedby="challenge-feedback"
                aria-invalid={moveError}
                className="font-mono"
              />
              <Button
                type="submit"
                disabled={!moveText.trim()}
                className="w-full sm:w-auto"
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
          className="challenge-feedback text-body-sm font-medium"
          data-outcome={outcome}
          data-error={moveError}
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
                onClick={() => {
                  if (!hint) trackPuzzleInteraction(puzzle.id, "hint");
                  setHint(!hint);
                }}
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
              <Button variant="soft" onClick={() => reset()}>
                <Icon name="arrow-counter-clockwise" size={16} />
                Try again
              </Button>
              <Button onClick={() => reset((index + 1) % CHALLENGES.length)}>
                Next position
                <Icon name="arrow-right" size={16} />
              </Button>
              <PlayButton variant="ghost" trackingLocation="puzzle_solved_banner" />
            </>
          )}
        </div>
        <ShareButtons
          title={outcome === "solved"
            ? `I found mate in ${puzzle.name}. Can you solve the same position?`
            : `Can you find the mate in one? Try ${puzzle.name}.`}
          url={`${SITE.url}/?puzzle=${puzzle.id}#challenge`}
          compact
        />
      </div>
    </div>
  );
}
