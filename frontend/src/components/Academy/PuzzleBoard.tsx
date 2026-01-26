'use client';

import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { motion } from "framer-motion";
import { FaLightbulb, FaUndo } from "react-icons/fa";

interface PuzzleBoardProps {
    initialFen: string;
    solution: string[]; // Array of UCI moves e.g., ['e2e4', 'e7e5']
    onSolve: () => void;
    onFail: () => void;
}

export default function PuzzleBoard({ initialFen, solution, onSolve, onFail }: PuzzleBoardProps) {
    const [game, setGame] = useState(new Chess(initialFen));
    const [moveIndex, setMoveIndex] = useState(0);
    const [status, setStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

    function safeGameMutate(modify: (g: Chess) => void) {
        setGame((g) => {
            const update = new Chess(g.fen());
            modify(update);
            return update;
        });
    }

    function onMove(moveData: { from: string; to: string; promotion?: string }) {
        if (status !== 'playing') return false;

        const move = {
            from: moveData.from,
            to: moveData.to,
            promotion: moveData.promotion || 'q',
        };

        let moveResult = null;
        try {
            const tempGame = new Chess(game.fen());
            moveResult = tempGame.move(move);
        } catch (e) {
            return false;
        }

        if (!moveResult) return false;

        // Check against solution
        const expectedMove = solution[moveIndex];

        // Convert move to UCI for comparison
        const uciMove = moveResult.from + moveResult.to + (moveResult.promotion && moveResult.promotion !== 'q' ? moveResult.promotion : '');
        // Simple comparison: solution should preferably be in UCI format or handled via chess.js to enable flexible comparison
        // For this MVP, we assume solution is UCI or we relax check. 
        // Let's rely on standard uci check. 
        // Actually, let's just use from+to for simplicity if promotion matches default.

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
                // If there's an opponent response in the solution (which there usually is for puzzles)
                // We should play it automatically after a delay
                // BUT, usually 'solution' array implies: [UserMove, OpponentResponse, UserMove] handling??
                // Standard puzzle formats usually have moves list.
                // Let's assume the solution array contains ALL moves including opponent's.
                // So if I played index 0, opponent plays index 1 immediately.

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

    function playOpponentMove(currentIndex: number) {
        if (currentIndex >= solution.length) return;

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
        setGame(new Chess(initialFen));
        setMoveIndex(0);
        setStatus('playing');
    }

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className={`relative p-1 rounded-3xl transition-all duration-300 ${status === 'correct' ? 'bg-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]' : status === 'wrong' ? 'bg-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : ''}`}>
                <ChessBoardComponent
                    fen={game.fen()}
                    onMove={onMove}
                    orientation={game.turn() === 'w' ? 'white' : 'black'}
                />
            </div>

            <div className="flex gap-4">
                <button onClick={reset} className="p-4 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary transition-all">
                    <FaUndo />
                </button>
                <button className="p-4 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 text-brand-primary transition-all">
                    <FaLightbulb />
                </button>
            </div>

            {status === 'correct' && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h3 className="text-xl font-black italic text-green-400">PUZZLE SOLVED!</h3>
                    <p className="text-xs text-green-400/60 font-bold uppercase tracking-widest">+50 Neural XP</p>
                </motion.div>
            )}
        </div>
    );
}
