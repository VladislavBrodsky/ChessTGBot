'use client';

import { Chessboard } from "react-chessboard";
import { useAudio } from "@/hooks/useAudio";
import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Chess } from "chess.js";

interface ChessBoardProps {
    fen: string;
    onMove: (move: { from: string; to: string; promotion?: string }) => boolean;
    orientation?: "white" | "black";
}

export default function ChessBoardComponent({ fen, onMove, orientation = "white" }: ChessBoardProps) {
    const { play } = useAudio();
    const [prevFen, setPrevFen] = useState(fen);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
        }
    }, []);

    useEffect(() => {
        if (fen !== prevFen) {
            const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const game = new Chess(fen === "start" ? START_FEN : fen);
            const prevGame = new Chess(prevFen === "start" ? START_FEN : prevFen);

            // Simple move detection
            // Note: This logic is simple; better to rely on socket events for specific sounds (win/capture) 
            // but for client-side feedback this works.

            if (game.isCheckmate() || (game.isDraw() && !prevGame.isDraw())) {
                play('win'); // For now, treat end as 'win' sound event or we can differentiate
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 5000);
            } else if (game.inCheck()) {
                play('check');
            } else {
                play('move');
            }

            setPrevFen(fen);
        }
    }, [fen, prevFen, play]);

    function onDrop(sourceSquare: string, targetSquare: string) {
        const moveResult = onMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q",
        });

        // If move was successful locally (before server confirms), play sound? 
        // Actually, useEffect above relies on FEN prop change from server.
        // We can play immediate feedback here too if we want zero-latency feel but risk double sound.
        // Let's rely on FEN change for authoritative state sound or use optimistic updates.

        return moveResult;
    }

    return (
        <div className="w-full max-w-[400px] aspect-square relative z-10 transition-all duration-700">
            {showConfetti && <div className="fixed inset-0 pointer-events-none z-50">
                <Confetti width={windowDimension.width} height={windowDimension.height} recycle={false} numberOfPieces={500} gravity={0.3} />
            </div>}

            {/* Subtle Metallic Outer Glow */}
            <div className="absolute -inset-[2px] bg-linear-to-b from-brand-border-opacity-20 to-transparent rounded-2xl blur-[1px] opacity-30"></div>

            <div className="relative rounded-2xl overflow-hidden border border-brand-border-opacity-5 bg-black p-1 shadow-[0_24px_48px_rgba(0,0,0,0.9)]">
                <div className="rounded-xl overflow-hidden w-full h-full">
                    <Chessboard
                        // @ts-ignore
                        position={fen}
                        onPieceDrop={onDrop}
                        boardOrientation={orientation}
                        customDarkSquareStyle={{ backgroundColor: "#050505" }}
                        customLightSquareStyle={{ backgroundColor: "#1F1F1F" }}
                        customBoardStyle={{
                            borderRadius: "12px",
                            overflow: "hidden",
                        }}
                        animationDuration={250}
                    />
                </div>
            </div>
        </div>
    );
}
