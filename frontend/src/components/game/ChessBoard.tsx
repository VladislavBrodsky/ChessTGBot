'use client';

import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
    fen: string;
    onMove: (move: { from: string; to: string; promotion?: string }) => boolean;
    orientation?: "white" | "black";
}

export default function ChessBoardComponent({ fen, onMove, orientation = "white" }: ChessBoardProps) {

    function onDrop(sourceSquare: string, targetSquare: string) {
        return onMove({
            from: sourceSquare,
            to: targetSquare,
            promotion: "q", // always promote to queen for simplicity for now
        });
    }

    return (
        <div className="w-full max-w-[400px] aspect-square relative z-10 transition-all duration-700">
            {/* Subtle Metallic Outer Glow */}
            <div className="absolute -inset-[2px] bg-linear-to-b from-white/20 to-transparent rounded-2xl blur-[1px] opacity-30"></div>

            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black p-1 shadow-[0_24px_48px_rgba(0,0,0,0.9)]">
                <Chessboard
                    // @ts-ignore
                    position={fen}
                    onPieceDrop={onDrop}
                    boardOrientation={orientation}
                    customDarkSquareStyle={{ backgroundColor: "#16181C" }}
                    customLightSquareStyle={{ backgroundColor: "#26292E" }}
                    customBoardStyle={{
                        borderRadius: "12px",
                        boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
                    }}
                    animationDuration={300}
                />
            </div>
        </div>
    );
}
