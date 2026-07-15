import type { LessonStep } from "@/components/Academy/LessonViewer";

export interface BackendLessonStep {
  id: number | string;
  order_index: number;
  content: string;
  fen?: string | null;
}

const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/i;

/**
 * Legacy lesson content may end with a `solution:` directive. Database steps
 * without that directive are explanations with an optional board diagram, not
 * puzzles that should block navigation.
 */
export function mapBackendLessonStep(
  step: BackendLessonStep,
  lessonTitle: string,
): LessonStep {
  const markerIndex = step.content.toLowerCase().lastIndexOf("solution:");
  let content = step.content;
  let solution: string[] = [];

  if (markerIndex >= 0) {
    const candidates = step.content
      .slice(markerIndex + "solution:".length)
      .split(",")
      .map((move) => move.trim().toLowerCase())
      .filter(Boolean);

    if (candidates.length > 0 && candidates.every((move) => UCI_MOVE.test(move))) {
      solution = candidates;
      content = step.content.slice(0, markerIndex).trimEnd();
    }
  }

  return {
    id: step.id.toString(),
    type: step.fen && solution.length > 0 ? "interactive_board" : "text",
    title: `${lessonTitle} (Part ${step.order_index})`,
    content,
    fen: step.fen || undefined,
    solution,
  };
}
