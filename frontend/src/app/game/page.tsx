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
    const { fen, makeMove, isConnected, error } = useGameSocket(gameId);
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

    return (
        <LayoutWrapper className="pb-12">
            {/* Header / Nav */}
            <div className="w-full max-w-md flex justify-between items-center mb-4 relative z-10 px-2 mt-2">
                <Link href="/">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-white/60 hover:text-white transition-colors flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                    >
                        <FaArrowLeft />
                        <span>Resign</span>
                    </motion.button>
                </Link>

                <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-nebula-cyan shadow-[0_0_8px_#00f0ff]' : 'bg-red-500'} animate-pulse`} />
                    <span className="text-[9px] font-black tracking-[0.2em] text-white/80 uppercase">
                        {isConnected ? 'Neural Sync' : 'Offline'}
                    </span>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-500/80 border border-red-500/50 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md z-50 shadow-2xl"
                >
                    {error}
                </motion.div>
            )}

            {/* Main Game Area */}
            <div className="w-full max-w-md flex flex-col items-center gap-4">

                {/* Opponent Widget */}
                <div className="w-full flex justify-between items-center px-4 py-3 glass-panel rounded-2xl border-white/5 opacity-80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                            <span className="text-xl font-black text-white/20">?</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white uppercase tracking-tight">Opponent</span>
                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Level 12 • 2400</span>
                        </div>
                    </div>
                    <div className="text-xl font-black text-white/20 italic tracking-tighter">10:00</div>
                </div>

                {/* Board Container */}
                <div className="w-full relative z-20 flex justify-center px-1">
                    <div className="w-full p-1.5 rounded-3xl bg-linear-to-br from-white/10 to-transparent backdrop-blur-md border border-white/10 shadow-3xl overflow-hidden aspect-square">
                        <ChessBoardComponent
                            fen={fen}
                            onMove={makeMove}
                            orientation="white"
                        />
                    </div>
                </div>

                {/* Player Widget */}
                <div className="w-full flex justify-between items-center px-4 py-3 glass-panel rounded-2xl border-white/5 bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-nebula-purple to-indigo-600 flex items-center justify-center border border-white/10 shadow-neon-sm">
                            <span className="text-xs font-black text-white uppercase tracking-tighter">You</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white uppercase tracking-tight">Protagonist</span>
                            <span className="text-[10px] font-bold text-nebula-cyan uppercase tracking-widest">White • 1200</span>
                        </div>
                    </div>
                    <div className="text-xl font-black text-nebula-cyan italic tracking-tighter drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">09:42</div>
                </div>

                {/* Action Bar */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={shareGame}
                    className="w-full glass-button py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 border-white/10 group bg-white/5"
                >
                    {copied ? <FaCheck className="text-green-500" /> : <FaCopy className="text-nebula-cyan" />}
                    <span>{copied ? "Sync Success" : "Link Node"}</span>
                </motion.button>
            </div>
        </LayoutWrapper>
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-nebula-cyan animate-pulse">Loading Board...</div>}>
            <GameContent />
        </Suspense>
    );
}
