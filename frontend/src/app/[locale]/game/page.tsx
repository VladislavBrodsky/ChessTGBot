'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaCopy, FaCheck, FaRobot, FaShareAlt, FaRedo } from "react-icons/fa";

function GameContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get("id") || "";
    // @ts-ignore
    const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);
    const [copied, setCopied] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            setUserId(window.Telegram.WebApp.initDataUnsafe.user.id);
        }
    }, []);

    // Share / Copy Game Link
    const shareGame = () => {
        if (window.Telegram?.WebApp) {
            window.Telegram.WebApp.switchInlineQuery(gameId, ["users", "groups", "channels"]);
        } else {
            const link = typeof window !== 'undefined' ? window.location.href : "";
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isBotGame = gameState?.black_player_id === -1;
    const isGameOver = gameState?.status === 'completed' || gameState?.status === 'aborted';
    
    // Match Over Logic
    let matchResultLabel = "PROTOCOL DRAW";
    let resultColor = "text-[#A1A1A1]"; // Silver for draw
    let eloChange = "+0";
    let netPayout = gameState?.wager_amount || 0;
    
    if (isGameOver && gameState) {
        if (gameState.winner_id === userId) {
            matchResultLabel = "VICTORY SECURED";
            resultColor = "text-[#00F0FF]"; // Neon Cyan for win
            eloChange = "+15";
            netPayout = (gameState.wager_amount * 2) * 0.97; // 3% platform commission
        } else if (gameState.winner_id && gameState.winner_id !== userId) {
            matchResultLabel = "TACTICAL DEFEAT";
            resultColor = "text-[#FF0055]"; // Rose red for loss
            eloChange = "-12";
            netPayout = 0;
        } else if (!gameState.winner_id) {
            matchResultLabel = "PROTOCOL DRAW";
            resultColor = "text-[#A1A1A1]";
            eloChange = "+0";
            netPayout = gameState.wager_amount; // Refund
        }
    }

    return (
        <LayoutWrapper className="pb-12">
            {/* Header / Nav */}
            <div className="w-full max-w-md flex justify-between items-center mb-6 relative z-10 px-2 mt-2">
                <Link href="/">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-brand-primary/40 hover:text-brand-primary transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <FaArrowLeft />
                        <span>Resign</span>
                    </motion.button>
                </Link>

                <div className="flex items-center gap-2 bg-brand-primary/5 px-4 py-1.5 rounded-full border border-brand-primary/10 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb),0.5)] animate-pulse" />
                    <span className="text-[9px] font-bold tracking-[0.2em] text-brand-primary/60 uppercase">
                        {isConnected ? 'Neural Sync' : 'Isolated'}
                    </span>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 bg-brand-primary text-brand-void px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest z-50 shadow-2xl"
                >
                    {error}
                </motion.div>
            )}

            {/* Main Game Area */}
            <div className="w-full max-w-md flex flex-col items-center gap-5">

                {/* Opponent Widget */}
                <div className="w-full flex justify-between items-center px-4 py-4 glass-panel group opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-void border border-brand-primary/10 flex items-center justify-center overflow-hidden">
                            {isBotGame ? (
                                <FaRobot className="text-xl text-brand-primary/40" />
                            ) : (
                                <span className="text-xl font-bold text-brand-primary/20">?</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                                {isBotGame ? "A.I. Combatant" : "Opponent"}
                            </span>
                            <span className="text-[10px] font-medium text-brand-primary/30 uppercase tracking-[0.2em]">
                                {isBotGame ? "Neural Engine v16" : "Rank 04 • 2400"}
                            </span>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-brand-primary/20 italic tracking-tighter">10:00</div>
                </div>

                {/* Board Container */}
                <div className="w-full relative z-20 flex justify-center px-1">
                    <div className="w-full p-2 rounded-3xl bg-brand-surface border border-brand-primary/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden aspect-square">
                        <ChessBoardComponent
                            fen={fen}
                            onMove={makeMove}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Player Widget */}
                <div className="w-full flex justify-between items-center px-4 py-4 glass-panel border-brand-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center shadow-lg">
                            <span className="text-xs font-black text-brand-void uppercase tracking-tighter italic">YOU</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">Protagonist</span>
                            <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em]">MASTER • 1200</span>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-brand-primary italic tracking-tighter">09:42</div>
                </div>

                {/* Action Bar */}
                {!isBotGame && !isGameOver && (
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={shareGame}
                        className="w-full action-button py-5 rounded-xl uppercase flex items-center justify-center gap-3"
                    >
                        {copied ? <FaCheck /> : <FaCopy />}
                        <span>{copied ? "Sync Success" : "Establish Link"}</span>
                    </motion.button>
                )}
            </div>

            {/* Premium Match Over Overlay Modal */}
            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="w-full max-w-sm glass-panel p-8 flex flex-col items-center relative overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-brand-primary/20 rounded-full blur-[50px] pointer-events-none" />
                            
                            <h2 className={`text-2xl font-black uppercase tracking-widest italic mb-2 ${resultColor}`}>
                                {matchResultLabel}
                            </h2>
                            <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-[0.3em] mb-8">
                                Match Verification Complete
                            </p>

                            <div className="w-full bg-black/40 rounded-2xl p-5 border border-brand-primary/10 mb-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-brand-primary/60 uppercase tracking-widest">Global ELO</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-black text-brand-primary tracking-widest">1000</span>
                                        <span className={`text-[10px] font-black tracking-widest ${eloChange.startsWith('+') && eloChange !== '+0' ? 'text-[#00F0FF]' : eloChange.startsWith('-') ? 'text-[#FF0055]' : 'text-brand-primary/50'}`}>
                                            {eloChange}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-brand-primary/60 uppercase tracking-widest">Net Payout</span>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-black tracking-widest ${netPayout > 0 ? 'text-[#FFD700]' : 'text-brand-primary'}`}>
                                            {netPayout > 0 ? '+' : ''}{netPayout.toFixed(2)} USDT
                                        </span>
                                        {gameState?.wager_amount > 0 && matchResultLabel === "VICTORY SECURED" && (
                                            <span className="text-[8px] text-brand-primary/40 uppercase tracking-widest mt-1">
                                                -3% Platform Rake
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full bg-rose-500 text-white py-4 rounded-xl flex items-center justify-center gap-3 text-xs uppercase font-black tracking-[0.2em] shadow-[0_0_15px_rgba(255,0,85,0.4)] hover:bg-rose-600 transition-colors"
                                >
                                    <span>Revenge Match</span>
                                </motion.button>

                                <div className="grid grid-cols-2 gap-3">
                                    <Link href="/" className="w-full">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full action-button py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px]"
                                        >
                                            <FaRedo />
                                            <span>Return to Hub</span>
                                        </motion.button>
                                    </Link>
                                    
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={shareGame}
                                        className="w-full glass-button py-3.5 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest"
                                    >
                                        <FaShareAlt className="text-brand-primary/60" />
                                        <span>Share Ledger</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </LayoutWrapper>
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-brand-primary/20 font-black uppercase tracking-[0.5em] animate-pulse">Initializing Board...</div>}>
            <GameContent />
        </Suspense>
    );
}
