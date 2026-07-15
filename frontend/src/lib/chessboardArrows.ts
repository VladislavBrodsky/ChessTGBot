import type { Arrow } from 'react-chessboard';

const DEFAULT_ARROW_COLOR = '#ffaa00';
const CHESS_SQUARE_PATTERN = /^[a-h][1-8]$/;

/** Convert the legacy tuple format used by academy content to react-chessboard v5 arrows. */
export function toChessboardArrows(arrows: readonly (readonly string[])[]): Arrow[] {
  return arrows.flatMap(([startSquare, endSquare, color]) => {
    if (
      !CHESS_SQUARE_PATTERN.test(startSquare ?? '') ||
      !CHESS_SQUARE_PATTERN.test(endSquare ?? '')
    ) {
      return [];
    }

    return [{
      startSquare,
      endSquare,
      color: color || DEFAULT_ARROW_COLOR,
    }];
  });
}
