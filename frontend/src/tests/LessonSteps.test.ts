import { mapBackendLessonStep } from "@/lib/lessonSteps";

describe("mapBackendLessonStep", () => {
  it("maps a board without a solution as a completable explanation", () => {
    const step = mapBackendLessonStep(
      {
        id: 1,
        order_index: 1,
        content: "A fork attacks two or more pieces simultaneously.",
        fen: "8/8/8/3N4/8/2q1k3/8/8 w - - 0 1",
      },
      "Forks",
    );

    expect(step.type).toBe("text");
    expect(step.fen).toBeTruthy();
    expect(step.solution).toEqual([]);
  });

  it("keeps a valid legacy solution interactive and hides its directive", () => {
    const step = mapBackendLessonStep(
      {
        id: "2",
        order_index: 2,
        content: "Find the royal fork. solution: d5c7",
        fen: "r3k3/8/8/3N4/8/8/8/4K3 w q - 0 1",
      },
      "Forks",
    );

    expect(step.type).toBe("interactive_board");
    expect(step.content).toBe("Find the royal fork.");
    expect(step.solution).toEqual(["d5c7"]);
  });

  it("does not create an impossible puzzle from malformed solution text", () => {
    const step = mapBackendLessonStep(
      {
        id: 3,
        order_index: 3,
        content: "Study this position. solution: move the knight",
        fen: "8/8/8/3N4/8/2q1k3/8/8 w - - 0 1",
      },
      "Forks",
    );

    expect(step.type).toBe("text");
    expect(step.content).toContain("solution: move the knight");
  });
});
