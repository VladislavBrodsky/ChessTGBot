'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaCopy, FaCheck, FaRobot } from "react-icons/fa";

function GameContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get("id") || "";
    // @ts-ignore
    const { fen, makeMove, isConnected, error, gameState } = useGameSocket(gameId);
    const [copied, setCopied] = useState(false);

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

    return (
        <LayoutWrapper className="pb-12">
            {/* Header / Nav */}
            <div className="w-full max-w-md flex justify-between items-center mb-6 relative z-10 px-2 mt-2">
                <Link href="/">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-white/40 hover:text-white transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
                    >
                        <FaArrowLeft />
                        <span>Resign</span>
                    </motion.button>
                </Link>

                <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-pulse" />
                    <span className="text-[9px] font-bold tracking-[0.2em] text-white/60 uppercase">
                        {isConnected ? 'Neural Sync' : 'Isolated'}
                    </span>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest z-50 shadow-2xl"
                >
                    {error}
                </motion.div>
            )}

            {/* Main Game Area */}
            <div className="w-full max-w-md flex flex-col items-center gap-5">

                {/* Opponent Widget */}
                <div className="w-full flex justify-between items-center px-4 py-4 glass-panel group opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden">
                            {isBotGame ? (
                                <FaRobot className="text-xl text-white/40" />
                            ) : (
                                <span className="text-xl font-bold text-white/20">?</span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-tight">
                                {isBotGame ? "A.I. Combatant" : "Opponent"}
                            </span>
                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-[0.2em]">
                                {isBotGame ? "Neural Engine v16" : "Rank 04 • 2400"}
                            </span>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white/20 italic tracking-tighter">10:00</div>
                </div>

                {/* Board Container */}
                <div className="w-full relative z-20 flex justify-center px-1">
                    <div className="w-full p-2 rounded-3xl bg-neutral-900 border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden aspect-square">
                        <ChessBoardComponent
                            fen={fen}
                            onMove={makeMove}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Player Widget */}
                <div className="w-full flex justify-between items-center px-4 py-4 glass-panel border-white/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                            <span className="text-xs font-black text-black uppercase tracking-tighter italic">YOU</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-tight">Protagonist</span>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">MASTER • 1200</span>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white italic tracking-tighter">09:42</div>
                </div>

                {/* Action Bar */}
                {!isBotGame && (
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
        </LayoutWrapper>
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/20 font-black uppercase tracking-[0.5em] animate-pulse">Initializing Board...</div>}>
            <GameContent />
        </Suspense>
    );
}
