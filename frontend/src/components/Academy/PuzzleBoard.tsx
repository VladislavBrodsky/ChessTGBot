'use client';

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { motion } from "framer-motion";
import { FaLightbulb, FaUndo } from "react-icons/fa";

interface PuzzleBoardProps {
  initialFen: string;
  solution?: string[]; // Optional - used for client-validated lesson mode
  puzzleId?: number;    // Optional - used for server-validated puzzle mode
  onSolve: () => void;
  onFail: () => void;
  orientation?: 'white' | 'black';
  hintsEnabled?: boolean;
}

export default function PuzzleBoard({ 
  initialFen, 
  solution, 
  puzzleId, 
  onSolve, 
  onFail, 
  orientation = 'white', 
  hintsEnabled = false 
}: PuzzleBoardProps) {
  const [game, setGame] = useState(new Chess(initialFen, { skipValidation: true }));
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [hintMove, setHintMove] = useState<{from: string, to: string} | null>(null);

  function safeGameMutate(modify: (g: Chess) => void) {
    setGame((g) => {
      const update = new Chess(g.fen(), { skipValidation: true });
      modify(update);
      return update;
    });
  }

  async function onMove(moveData: { from: string; to: string; promotion?: string }) {
    if (status !== 'playing') return false;
    setHintMove(null);

    const move = {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion || 'q',
    };

    let moveResult = null;
    try {
      const tempGame = new Chess(game.fen(), { skipValidation: true });
      moveResult = tempGame.move(move);
    } catch (e) {
      return false;
    }

    if (!moveResult) return false;

    // Convert move to UCI for comparison
    const uciMove = moveResult.from + moveResult.to + (moveResult.promotion && moveResult.promotion !== 'q' ? moveResult.promotion : '');

    // 1. Client-validated Mode (Lessons)
    if (solution && solution.length > 0) {
      const expectedMove = solution[moveIndex];
      const isCorrect = uciMove === expectedMove || (moveResult.from + moveResult.to) === expectedMove;

      if (isCorrect) {
        safeGameMutate((g) => {
          g.move(move);
        });

        const nextIndex = moveIndex + 1;
        setMoveIndex(nextIndex);

        if (nextIndex >= solution.length) {
          setStatus('correct');
          onSolve();
        } else {
          setTimeout(() => {
            playOpponentMove(nextIndex);
          }, 500);
        }
        return true;
      } else {
        setStatus('wrong');
        onFail();
        setTimeout(() => setStatus('playing'), 1000); // Reset status to allow retry
        return false;
      }
    }

    // 2. Server-validated Mode (Puzzles)
    if (puzzleId !== undefined) {
      try {
        const { apiFetch } = await import("@/lib/api");
        const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${puzzleId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ move: uciMove })
        });
        if (res.ok) {
          safeGameMutate((g) => {
            g.move(move);
          });
          setStatus('correct');
          onSolve();
          return true;
        } else {
          setStatus('wrong');
          onFail();
          setTimeout(() => setStatus('playing'), 1000);
          return false;
        }
      } catch (e) {
        console.error(e);
        setStatus('wrong');
        onFail();
        setTimeout(() => setStatus('playing'), 1000);
        return false;
      }
    }

    return false;
  }

  function playOpponentMove(currentIndex: number) {
    if (!solution || currentIndex >= solution.length) return;

    const uci = solution[currentIndex];
    const from = uci.substring(0, 2);
    const to = uci.substring(2, 4);
    const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;

    safeGameMutate((g) => {
      g.move({ from, to, promotion });
    });

    setMoveIndex(currentIndex + 1);
  }

  function reset() {
    setGame(new Chess(initialFen, { skipValidation: true }));
    setMoveIndex(0);
    setStatus('playing');
    setHintMove(null);
  }

  const handleHint = async () => {
    if (!hintsEnabled || status !== 'playing') return;

    // Client hint
    if (solution && solution.length > 0) {
      const expectedMove = solution[moveIndex];
      if (expectedMove && expectedMove.length >= 2) {
        setHintMove({
          from: expectedMove.substring(0, 2),
          to: expectedMove.substring(2, 4)
        });
      }
      return;
    }

    // Server hint
    if (puzzleId !== undefined) {
      try {
        const { apiFetch } = await import("@/lib/api");
        const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${puzzleId}/hint`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.from) {
            setHintMove({
              from: data.from,
              to: data.from
            });
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const customSquareStyles: { [square: string]: any } = {};
  if (hintMove) {
    customSquareStyles[hintMove.from] = { backgroundColor: 'rgba(16, 185, 129, 0.4)' };
    customSquareStyles[hintMove.to] = { backgroundColor: 'rgba(16, 185, 129, 0.7)' };
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className={`w-full max-w-[400px] aspect-square relative p-1 rounded-3xl transition-all duration-300 ${status === 'correct' ? 'bg-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : status === 'wrong' ? 'bg-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : ''}`}>
        <ChessBoardComponent
          fen={game.fen()}
          onMove={onMove}
          orientation={orientation}
          customSquareStyles={customSquareStyles}
        />
      </div>

      <div className="flex flex-col items-center">
        <div className="flex gap-4">
          <button onClick={reset} className="p-4 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary transition-all">
            <FaUndo />
          </button>
          <button 
            onClick={handleHint} 
            disabled={!hintsEnabled || status !== 'playing'}
            className={`p-4 rounded-xl transition-all ${
              hintsEnabled && status === 'playing'
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-pointer' 
                : 'bg-brand-primary/5 text-brand-primary/30 cursor-not-allowed'
            }`}
          >
            <FaLightbulb />
          </button>
        </div>
        {hintsEnabled && (
          <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest mt-2">
            Hints available (Levels 1-10)
          </span>
        )}
      </div>

      {status === 'correct' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h3 className="text-xl font-black text-green-400">PUZZLE SOLVED!</h3>
          <p className="text-xs text-green-400/60 font-bold uppercase tracking-widest">+50 Chess XP</p>
        </motion.div>
      )}
    </div>
  );
}
