'use client';

import dynamic from "next/dynamic";
const Chessboard = dynamic(() => import("react-chessboard").then((mod) => mod.Chessboard), { ssr: false });
import { useState, useEffect, type CSSProperties } from "react";
import Confetti from "react-confetti";
import { Chess } from "chess.js";
import { motion } from "framer-motion";
import { toChessboardArrows } from "@/lib/chessboardArrows";
import { telegramHaptic } from "@/lib/telegram";

function getChangedSquares(fen1: string, fen2: string): string[] {
    try {
        const c1 = new Chess(fen1, { skipValidation: true });
        const c2 = new Chess(fen2, { skipValidation: true });
        const changed: string[] = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

        for (const file of files) {
            for (const rank of ranks) {
                const square = `${file}${rank}`;
                const p1 = c1.get(square as any);
                const p2 = c2.get(square as any);
                if (JSON.stringify(p1) !== JSON.stringify(p2)) {
                    changed.push(square);
                }
            }
        }
        return changed;
    } catch (e) {
        console.error("Error comparing FENs", e);
        return [];
    }
}

interface ChessBoardProps {
    fen: string;
    onMove: (move: { from: string; to: string; promotion?: string }) => boolean | Promise<boolean>;
    orientation?: "white" | "black";
    showConfetti?: boolean;
    autoPromoteToQueen?: boolean;
    customSquareStyles?: { [square: string]: any };
    customArrows?: string[][];
    customDarkSquareStyle?: CSSProperties;
    customLightSquareStyle?: CSSProperties;
}

export default function ChessBoardComponent({
    fen,
    onMove,
    orientation = "white",
    showConfetti = false,
    autoPromoteToQueen = false,
    customSquareStyles = {},
    customArrows = [],
    customDarkSquareStyle = { backgroundColor: '#7b9fb6' },
    customLightSquareStyle = { backgroundColor: '#ebecd0' },
}: ChessBoardProps) {
    const [windowDimension, setWindowDimension] = useState({ width: 0, height: 0 });
    const [boardTheme, setBoardTheme] = useState<string>('default');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('board_theme') || 'default';
            setBoardTheme(saved);
        }
    }, []);

    const themeStyles = {
        default: { dark: '#7b9fb6', light: '#ebecd0' },
        neon: { dark: '#0f172a', light: '#0891b2' },
        obsidian: { dark: '#18181b', light: '#52525b' },
        marble: { dark: '#78716c', light: '#e7e5e4' },
        'theme-emerald': { dark: '#022c22', light: '#10b981' },
        'theme-cyber': { dark: '#090d16', light: '#a21caf' },
        'theme-gold': { dark: '#451a03', light: '#fef08a' }
    };

    const activeStyles = themeStyles[boardTheme as keyof typeof themeStyles] || themeStyles.default;
    const finalDarkSquareStyle = customDarkSquareStyle.backgroundColor === '#7b9fb6'
        ? { backgroundColor: activeStyles.dark }
        : customDarkSquareStyle;
    const finalLightSquareStyle = customLightSquareStyle.backgroundColor === '#ebecd0'
        ? { backgroundColor: activeStyles.light }
        : customLightSquareStyle;

    const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null);
    const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
    const [prevFen, setPrevFen] = useState<string | null>(null);
    const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);

    useEffect(() => {
        if (fen) {
            const currentFen = fen === "start" ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : fen;
            if (prevFen && prevFen !== currentFen) {
                const changed = getChangedSquares(prevFen, currentFen);
                if (changed.length >= 2 && changed.length <= 4) {
                    setLastMoveSquares(changed);
                } else {
                    setLastMoveSquares([]);
                }
            } else if (!prevFen) {
                setLastMoveSquares([]);
            }
            setPrevFen(currentFen);
        }
    }, [fen, prevFen]);

    const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const gameForTurn = new Chess(fen === "start" ? START_FEN : fen, { skipValidation: true });
    const isMyTurn = gameForTurn.turn() === (orientation === "white" ? "w" : "b");

    useEffect(() => {
        setSelectedSquare(null);
    }, [fen]);

    function handleSquareClick({ square }: { piece: any; square: string }) {
        const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const game = new Chess(fen === "start" ? START_FEN : fen, { skipValidation: true });
        
        const playerColor = orientation === "white" ? "w" : "b";
        if (game.turn() !== playerColor) {
            return;
        }
        
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
                        if (autoPromoteToQueen) {
                            const moveResult = onMove({
                                from: selectedSquare,
                                to: square,
                                promotion: "q"
                            });
                            if (moveResult) {
                                telegramHaptic('light');
                            }
                            setSelectedSquare(null);
                            return;
                        } else {
                            telegramHaptic('medium');
                            setPromotionMove({ from: selectedSquare, to: square });
                            setSelectedSquare(null);
                            return;
                        }
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
        if (sourceSquare === targetSquare) return false;

        const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
        const game = new Chess(fen === "start" ? START_FEN : fen, { skipValidation: true });
        
        const playerColor = orientation === "white" ? "w" : "b";
        
        // 1. Verify it is our turn
        if (game.turn() !== playerColor) {
            return false;
        }

        // 2. Verify the piece belongs to us
        const piece = game.get(sourceSquare as any);
        if (!piece || piece.color !== playerColor) {
            return false;
        }
        
        // Check if this is a pawn promotion move
        const isPawn = piece && piece.type === "p";
        const isPromotionRank = targetSquare.endsWith("8") || targetSquare.endsWith("1");
        
        if (isPawn && isPromotionRank) {
            try {
                const legalMoves = game.moves({ verbose: true });
                const isPromoMove = legalMoves.some(
                    (m) => m.from === sourceSquare && m.to === targetSquare && m.promotion
                );
                if (isPromoMove) {
                    if (autoPromoteToQueen) {
                        const moveResult = onMove({
                            from: sourceSquare,
                            to: targetSquare,
                            promotion: "q"
                        });
                        if (moveResult) {
                            telegramHaptic('light');
                        }
                        setSelectedSquare(null);
                        return moveResult as boolean;
                    } else {
                        telegramHaptic('medium');
                        // Store details and open custom selection dialog; block immediate move
                        setPromotionMove({ from: sourceSquare, to: targetSquare });
                        setSelectedSquare(null);
                        return false;
                    }
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
        return moveResult as boolean;
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
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Queen</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("n")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♞</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Knight</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("r")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♜</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Rook</span>
                            </motion.button>
                            
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSelectPromotion("b")}
                                className="py-4 glass-button rounded-xl flex flex-col items-center gap-1.5 cursor-pointer"
                            >
                                <span className="text-2xl text-brand-primary">♝</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary opacity-60">Bishop</span>
                            </motion.button>
                        </div>
                        
                        <button
                            onClick={() => { setPromotionMove(null); telegramHaptic('light'); }}
                            className="w-full py-2.5 rounded-xl border border-brand-rose-opacity-20 bg-brand-rose-opacity-10 text-rose-400 text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-brand-rose-opacity-20"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Subtle Metallic Outer Glow */}
            <div className="absolute -inset-[2px] bg-linear-to-b from-brand-border-opacity-20 to-transparent rounded-2xl blur-[1px] opacity-30 pointer-events-none"></div>

            <div className="relative rounded-2xl overflow-hidden border border-brand-border-opacity-5 bg-[var(--color-brand-elevated)] p-1 shadow-[0_24px_48px_rgba(0,0,0,0.9)]">
                <div className="rounded-xl overflow-hidden w-full h-full">
                    <Chessboard
                        options={{
                            id: "liveChessBoard",
                            position: fen === "start" ? "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" : fen,
                            onPieceDrop: onDrop,
                            boardOrientation: orientation,
                            allowDragging: isMyTurn,
                            canDragPiece: ({ piece }) => {
                                const myColor = orientation === "white" ? "w" : "b";
                                return isMyTurn && piece.pieceType.startsWith(myColor);
                            },
                            boardStyle: {
                                borderRadius: "12px",
                                overflow: "hidden",
                            },
                            arrows: toChessboardArrows(customArrows),
                            darkSquareStyle: finalDarkSquareStyle,
                            lightSquareStyle: finalLightSquareStyle,
                            onSquareClick: handleSquareClick,
                            squareStyles: (() => {
                                const styles: { [square: string]: any } = { ...customSquareStyles };
                                for (const sq of lastMoveSquares) {
                                    styles[sq] = {
                                        ...styles[sq],
                                        backgroundColor: "rgba(255, 255, 51, 0.45)"
                                    };
                                }
                                if (selectedSquare) {
                                    styles[selectedSquare] = {
                                        ...styles[selectedSquare],
                                        backgroundColor: "rgba(255, 215, 0, 0.4)",
                                        boxShadow: "inset 0 0 0 2px rgba(255, 215, 0, 0.7)"
                                    };
                                }
                                return styles;
                            })()
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
