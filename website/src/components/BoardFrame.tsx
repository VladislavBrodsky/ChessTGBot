import type { ReactNode } from "react";

/** Coordinates sit outside the board, clear of pieces and tap targets. */
export function BoardFrame({
  children,
  notation = false,
}: {
  children: ReactNode;
  notation?: boolean;
}) {
  return (
    <div className="board-frame" data-notation={notation}>
      {notation && (
        <div className="board-ranks" aria-hidden="true">
          {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => <span key={rank}>{rank}</span>)}
        </div>
      )}
      <div className="board-squares">{children}</div>
      {notation && (
        <div className="board-files" aria-hidden="true">
          {Array.from("abcdefgh").map(file => <span key={file}>{file}</span>)}
        </div>
      )}
    </div>
  );
}
