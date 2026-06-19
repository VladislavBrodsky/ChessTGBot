'use client';

import { Chessboard } from "react-chessboard";
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import { telegramHaptic } from "@/lib/telegram";

interface ChessBoardProps {
    fen: string;
    onMove: (move: { from: string; to: string; promotion?: string }) => boolean;
    orientation?: "white" | "black";
    showConfetti?: boolean;
}

export default function ChessBoardComponent({ fen, onMove, orientation = "white", showConfetti = false }: ChessBoardProps) {
    const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });
    const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

    useEffect(() => {
        setSelectedSquare(null);
    }, [fen]);

    function handleSquareClick({ square }: { piece: any; square: string }) {
        const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const game = new Chess(fen === "start" ? START_FEN : fen);
        
        // 1. If user clicks one of their own pieces, select/re-select it
        const piece = game.get(square as any);
        if (piece && piece.color === game.turn() && piece.color === (orientation === "white" ? "w" : "b")) {
            setSelectedSquare(square);
            telegramHaptic('light');
            return;
        }

        // 2. If user already has a piece selected, try to move it to the clicked square
        if (selectedSquare) {
            // Check if this is a pawn promotion move
            const selectedPiece = game.get(selectedSquare as any);
            const isPawn = selectedPiece && selectedPiece.type === "p";
            const isPromotionRank = square.endsWith("8") || square.endsWith("1");
            
            if (isPawn && isPromotionRank) {
                try {
                    const legalMoves = game.moves({ verbose: true });
                    const isPromoMove = legalMoves.some(
                        (m) => m.from === selectedSquare && m.to === square && m.promotion
                    );
                    if (isPromoMove) {
                        telegramHaptic('medium');
                        setPromotionMove({ from: selectedSquare, to: square });
                        setSelectedSquare(null);
                        return;
                    }
                } catch (e) {
                    console.error("Error checking promotion legality:", e);
                }
            }

            // Attempt normal move
            const moveResult = onMove({
                from: selectedSquare,
                to: square,
            });
            if (moveResult) {
                telegramHaptic('light');
            }
            setSelectedSquare(null);
        }
    }

    useEffect(() => {
        if (typeof window !== "undefined") {
            setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
            
            const handleResize = () => {
                setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
            };
            window.addEventListener("resize", handleResize);
            return () => window.removeEventListener("resize", handleResize);
        }
    }, []);

    function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) {
        if (!targetSquare) return false;

        const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const game = new Chess(fen === "start" ? START_FEN : fen);
        
        // Check if this is a pawn promotion move
        const piece = game.get(sourceSquare as any);
        const isPawn = piece && piece.type === "p";
        const isPromotionRank = targetSquare.endsWith("8") || targetSquare.endsWith("1");
        
        if (isPawn && isPromotionRank) {
            try {
                const legalMoves = game.moves({ verbose: true });
                const isPromoMove = legalMoves.some(
                    (m) => m.from === sourceSquare && m.to === targetSquare && m.promotion
                );
                if (isPromoMove) {
                    telegramHaptic('medium');
                    // Store details and open custom selection dialog; block immediate move
                    setPromotionMove({ from: sourceSquare, to: targetSquare });
                    setSelectedSquare(null);
                    return false;
                }
            } catch (e) {
                console.error("Error checking promotion legality:", e);
            }
        }

        const moveResult = onMove({
            from: sourceSquare,
            to: targetSquare,
        });
        if (moveResult) {
            telegramHaptic('light');
        }
        setSelectedSquare(null);
        return moveResult;
    }

    const handleSelectPromotion = (pieceType: "q" | "r" | "b" | "n") => {
        if (promotionMove) {
            telegramHaptic('light');
            onMove({
                from: promotionMove.from,
                to: promotionMove.to,
                promotion: pieceType,
            });
            setPromotionMove(null);
        }
    };


    return (
        <div className="w-full max-w-[400px] aspect-square relative z-10 transition-all duration-700">
            {showConfetti && <div className="fixed inset-0 pointer-events-none z-50">
                <Confetti width={windowDimension.width} height={windowDimension.height} recycle={false} numberOfPieces={500} gravity={0.3} />
            </div>}

            {/* Custom Promotion Dialog Overlay */}
            {promotionMove && (
                <div className="absolute inset-0 bg-brand-void/80 backdrop-blur-md z-30 flex items-center justify-center rounded-2xl p-6" style={{ touchAction: 'none' }}>
                    <div className="glass-panel p-6 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface max-w-[280px] w-full text-center space-y-5 shadow-premium">
                        <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest block">
                            Pawn Promotion
                        </span>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("q")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♛</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Queen</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("n")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♞</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Knight</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("r")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♜</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Rook</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("b")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♝</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Bishop</span>
                            </motion.button>
                        </div>
                        
                        <button
                            onClick={() => { setPromotionMove(null); telegramHaptic('light'); }}
                            className="w-full py-2.5 rounded-xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 text-rose-400 text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-brand-rose-opacity-20"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Subtle Metallic Outer Glow */}
            <div className="absolute -inset-[2px] bg-linear-to-b from-brand-border-opacity-20 to-transparent rounded-2xl blur-[1px] opacity-30 pointer-events-none"></div>

            <div className="relative rounded-2xl overflow-hidden border border-brand-border-opacity-5 bg-black p-1 shadow-[0_24px_48px_rgba(0,0,0,0.9)]">
                <div className="rounded-xl overflow-hidden w-full h-full">
                    <Chessboard
                        options={{
                            id: "liveChessBoard",
                            position: fen === "start" ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : fen,
                            onPieceDrop: onDrop,
                            boardOrientation: orientation,
                            allowDragging: true,
                            boardStyle: {
                                borderRadius: "12px",
                                overflow: "hidden",
                            },
                            animationDurationInMs: 250,
                            onSquareClick: handleSquareClick,
                            squareStyles: selectedSquare ? {
                                [selectedSquare]: {
                                    backgroundColor: "rgba(255, 215, 0, 0.3)",
                                    boxShadow: "inset 0 0 0 2px rgba(255, 215, 0, 0.6)"
                                }
                            } : {}
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
