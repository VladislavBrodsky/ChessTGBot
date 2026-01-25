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
        <div className="w-full max-w-[400px] aspect-square relative z-10 filter drop-shadow-[0_0_15px_rgba(123,44,191,0.3)]">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg blur opacity-30"></div>
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
                <Chessboard
                    // @ts-ignore - react-chessboard types are flaky
                    position={fen}
                    onPieceDrop={onDrop}
                    boardOrientation={orientation}
                    customDarkSquareStyle={{ backgroundColor: "rgba(123, 44, 191, 0.2)" }}
                    customLightSquareStyle={{ backgroundColor: "rgba(0, 240, 255, 0.05)" }}
                    customBoardStyle={{
                        borderRadius: "4px",
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
                    }}
                    customPieces={undefined} // Can implement custom pieces later
                />
            </div>
        </div>
    );
}
