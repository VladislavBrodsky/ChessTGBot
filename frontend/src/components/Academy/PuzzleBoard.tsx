'use client';

import { useState } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { motion, AnimatePresence } from "framer-motion";
import { FaLightbulb, FaUndo, FaFlag } from "react-icons/fa";

interface PuzzleBoardProps {
  initialFen: string;
  solution?: string[]; // Optional - used for client-validated lesson mode
  puzzleId?: number;    // Optional - used for server-validated puzzle mode
  onSolve: (data?: any) => void;
  onFail: () => void;
  orientation?: 'white' | 'black';
  hintsEnabled?: boolean;
  hintText?: string;
  successExplanation?: string;
}

export default function PuzzleBoard({ 
  initialFen, 
  solution, 
  puzzleId, 
  onSolve, 
  onFail, 
  orientation = 'white', 
  hintsEnabled = false,
  hintText,
  successExplanation
}: PuzzleBoardProps) {
  const [game, setGame] = useState(new Chess(initialFen, { skipValidation: true }));
  const [moveIndex, setMoveIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [hintMove, setHintMove] = useState<{from: string, to: string} | null>(null);
  const [showHintText, setShowHintText] = useState(false);
  const [dynamicHintText, setDynamicHintText] = useState(hintText || "");
  const [dynamicSuccessExplanation, setDynamicSuccessExplanation] = useState(successExplanation || "");

  function safeGameMutate(modify: (g: Chess) => void) {
    setGame((g) => {
      const update = new Chess(g.fen(), { skipValidation: true });
      // chess.move() THROWS on an illegal move. A throw here happens inside a
      // React state updater, so it escapes to the page error boundary and
      // kills the whole puzzle page. It can legitimately happen: the position
      // may have changed between validating a move and replaying it here
      // (reset/give-up/second move racing the async server verify).
      try {
        modify(update);
      } catch (e) {
        console.warn('PuzzleBoard: safeGameMutate move failed', e);
        return g;
      }
      return update;
    });
  }

  async function onMove(moveData: { from: string; to: string; promotion?: string }) {
    if (status !== 'playing') return false;
    setHintMove(null);
    setShowHintText(false);

    const move = {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion || 'q',
    };

    let moveResult = null;
    try {
      const tempGame = new Chess(game.fen(), { skipValidation: true });
      moveResult = tempGame.move(move);
    } catch {
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
          const data = await res.json();
          safeGameMutate((g) => {
            g.move(move);
          });
          if (data && data.explanation) {
            setDynamicSuccessExplanation(data.explanation);
          }
          setStatus('correct');
          onSolve(data);
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
    setShowHintText(false);
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
        setShowHintText(true);
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
            if (data.hint_text) {
              setDynamicHintText(data.hint_text);
            }
            setShowHintText(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleGiveUp = () => {
    if (status !== 'playing' || !solution || solution.length === 0) return;
    
    // Auto-play the solution
    let currentIndex = moveIndex;
    const playNextMove = () => {
      if (currentIndex >= solution.length) {
        setStatus('wrong'); // Mark as wrong since they gave up, but they can see it
        onFail();
        return;
      }
      const uci = solution[currentIndex];
      const from = uci.substring(0, 2);
      const to = uci.substring(2, 4);
      const promotion = uci.length > 4 ? uci.substring(4, 5) : undefined;
      
      safeGameMutate((g) => {
        g.move({ from, to, promotion });
      });
      currentIndex++;
      setMoveIndex(currentIndex);
      setTimeout(playNextMove, 800);
    };
    
    playNextMove();
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
            title="Hint"
          >
            <FaLightbulb />
          </button>
          
          {solution && solution.length > 0 && (
            <button 
              onClick={handleGiveUp} 
              disabled={status !== 'playing'}
              className="p-4 rounded-xl transition-all bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer shadow-[0_0_15px_rgba(243,24,24,0.1)]"
              title="Give Up / Show Solution"
            >
              <FaFlag />
            </button>
          )}
        </div>
        {hintsEnabled && !showHintText && status === 'playing' && (
          <span className="text-[10px] font-bold text-amber-500/50 uppercase tracking-widest mt-2">
            Hints available (Levels 1-10)
          </span>
        )}
      </div>

      <AnimatePresence>
        {showHintText && dynamicHintText && status === 'playing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full text-center px-4 -mt-2"
          >
            <div className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 inline-block">
              <span className="font-bold uppercase tracking-wider block mb-1">Coach Hint:</span>
              {dynamicHintText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'correct' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center flex flex-col items-center gap-2"
        >
          <h3 className="text-xl font-black text-green-400">PUZZLE SOLVED!</h3>
          {dynamicSuccessExplanation ? (
            <div className="text-xs font-medium text-green-400/90 bg-green-500/10 border border-green-500/20 rounded-xl p-3 mt-1 mb-2 max-w-[90%] mx-auto">
              {dynamicSuccessExplanation}
            </div>
          ) : (
            <p className="text-xs text-green-400/60 font-bold uppercase tracking-widest">+50 Chess XP</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
