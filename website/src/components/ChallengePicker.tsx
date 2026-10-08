import { CHALLENGES } from "@/content/challenges";

/** The initial preview and interactive challenge use the same selector geometry. */
export function ChallengePicker({
  index = 0,
  solvedIds = [],
  onSelect,
  disabled = false,
}: {
  index?: number;
  solvedIds?: readonly string[];
  onSelect?: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-caption font-semibold">Choose a position</legend>
      <select
        aria-label="Choose a position"
        className="challenge-select"
        value={index}
        disabled={disabled}
        onChange={(event) => onSelect?.(Number(event.target.value))}
      >
        {CHALLENGES.map((puzzle, i) => (
          <option key={puzzle.id} value={i}>
            0{i + 1} · {puzzle.name}{solvedIds.includes(puzzle.id) ? " · Solved" : ""}
          </option>
        ))}
      </select>
      <div className="challenge-picker">
        {CHALLENGES.map((puzzle, i) => (
          <button
            key={puzzle.id}
            type="button"
            aria-pressed={i === index}
            disabled={disabled}
            onClick={() => onSelect?.(i)}
            className="challenge-option"
          >
            <span className="challenge-option-number" aria-hidden="true">0{i + 1}</span>
            <span>{puzzle.name}{solvedIds.includes(puzzle.id) && <span className="ms-1" aria-label="Solved">✓</span>}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
