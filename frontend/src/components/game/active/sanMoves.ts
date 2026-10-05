import { Chess } from 'chess.js';

export function getMovesSanList(moveHistory: string[]): { white: string; black?: string }[] {
  const tempChess = new Chess();
  const result: { white: string; black?: string }[] = [];
  
  for (let i = 0; i < moveHistory.length; i += 2) {
    const whiteUci = moveHistory[i];
    const blackUci = moveHistory[i + 1];
    
    let whiteSan = "";
    if (whiteUci) {
      try {
        const from = whiteUci.substring(0, 2);
        const to = whiteUci.substring(2, 4);
        const promotion = whiteUci.substring(4, 5) || undefined;
        const move = tempChess.move({ from, to, promotion });
        whiteSan = move.san;
      } catch {
        whiteSan = whiteUci;
      }
    }
    
    let blackSan = "";
    if (blackUci) {
      try {
        const from = blackUci.substring(0, 2);
        const to = blackUci.substring(2, 4);
        const promotion = blackUci.substring(4, 5) || undefined;
        const move = tempChess.move({ from, to, promotion });
        blackSan = move.san;
      } catch {
        blackSan = blackUci;
      }
    }
    
    result.push({
      white: whiteSan,
      ...(blackSan ? { black: blackSan } : {})
    });
  }
  
  return result;
}
