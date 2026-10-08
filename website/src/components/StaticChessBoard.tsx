import { board } from "../../../design-system/website/tokens";

/** Lightweight, deterministic board for the initial loading and error states. */
export function StaticChessBoard({ fen, label }: { fen: string; label: string }) {
  const squares = fen.split(" ")[0].split("/").flatMap((rank) =>
    Array.from(rank).flatMap((piece) => /[1-8]/.test(piece) ? Array(Number(piece)).fill("") : [piece]),
  );
  return (
    <div className="static-board" role="img" aria-label={label}>
      {squares.map((piece, i) => {
        const file = i % 8;
        const rank = Math.floor(i / 8);
        const dark = (file + rank) % 2 === 1;
        const white = piece !== "" && piece === piece.toUpperCase();
        return (
          <div key={i} className="static-board-square" style={{ background: dark ? board.squareDark : board.squareLight }}>
            {piece && (
              <svg viewBox="0 0 48 48" fill={white ? board.pieceWhite.fill : board.pieceBlack.fill} stroke={white ? board.pieceWhite.stroke : board.pieceBlack.stroke} strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
                {piece.toLowerCase() === "p" ? <><circle cx="24" cy="13" r="6" /><path d="M18 20h12l-3 7 6 10H15l6-10Z" /></> : piece.toLowerCase() === "r" ? <><path d="M13 8h6v5h3V8h4v5h3V8h6v11l-4 3 1 15H16l1-15-4-3Z" /><path d="M17 23h14M16 33h16" /></> : <><path d="M24 5v10m-5-5h10" fill="none" /><path d="M17 18q-8-8-8 1 0 8 9 10l-2 8h16l-2-8q9-2 9-10 0-9-8-1l-7-4Z" /><path d="M18 29h12" /></>}
                <path d="M13 37h22l3 5H10Z" />
              </svg>
            )}
            {file === 0 && <span className="static-board-notation start-1 top-0.5" style={{ color: dark ? board.coordinateOnDark : board.coordinateOnLight }}>{8 - rank}</span>}
            {rank === 7 && <span className="static-board-notation end-1 bottom-0.5" style={{ color: dark ? board.coordinateOnDark : board.coordinateOnLight }}>{"abcdefgh"[file]}</span>}
          </div>
        );
      })}
    </div>
  );
}
