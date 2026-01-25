'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaCopy, FaCheck } from "react-icons/fa";

function GameContent() {
    const searchParams = useSearchParams();
    const gameId = searchParams.get("id") || "";
    // @ts-ignore - Assuming hook exists and works as before
    const { fen, makeMove, isConnected, error } = useGameSocket(gameId);
    const [copied, setCopied] = useState(false);

    // Copy Game Link
    const copyLink = () => {
        const link = typeof window !== 'undefined' ? window.location.href : "";
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            {/* Immersive Header */}
            <div className="w-full max-w-md flex justify-between items-center mb-10 px-4">
                <Link href="/">
                    <motion.button
                        whileHover={{ x: -2 }}
                        className="text-white/40 hover:text-white transition-colors flex items-center space-x-2 text-xs font-black uppercase tracking-widest"
                    >
                        <FaArrowLeft className="text-[10px]" />
                        <span>Abstain</span>
                    </motion.button>
                </Link>

                <div className="flex items-center space-x-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-2xl">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-nebula-cyan shadow-[0_0_10px_#00f0ff]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'} animate-pulse`} />
                    <span className="text-[10px] font-black tracking-[0.2em] text-white/60 uppercase">
                        {isConnected ? 'Neural Sync Active' : 'Link Severed'}
                    </span>
                </div>
            </div>

            {/* Combatant 1 (Opponent) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md px-4 mb-4"
            >
                <div className="glass-panel p-4 rounded-3xl border-white/5 bg-linear-to-br from-white/5 to-transparent flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden">
                            <span className="text-xl opacity-20 group-hover:opacity-40 transition-opacity">?</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-sm font-black text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-tight">Antagonist</div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-[40%] bg-red-500/30" />
                                </div>
                                <span className="text-xs font-mono text-white/20">ELO 1200</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white/20 italic tracking-tighter">10:00</div>
                </div>
            </motion.div>

            {/* Neural Matrix: Chessboard */}
            <div className="w-full max-w-md relative z-20 mb-4 px-4">
                <div className="p-2 rounded-4xl bg-linear-to-br from-white/10 via-black to-white/5 border border-white/10 shadow-premium overflow-hidden group">
                    <div className="absolute inset-0 bg-nebula-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <ChessBoardComponent
                        fen={fen}
                        onMove={makeMove}
                        orientation="white"
                    />
                </div>
            </div>

            {/* Combatant 2 (You) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-md px-4 mb-8"
            >
                <div className="glass-panel p-4 rounded-3xl border-nebula-cyan/30 bg-linear-to-br from-nebula-cyan/5 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-nebula-cyan/10 border border-nebula-cyan/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                            <span className="text-xl text-nebula-cyan font-black italic">M</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-sm font-black text-white uppercase tracking-tight">Protagonist</div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="h-1.5 w-32 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full w-[75%] bg-nebula-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
                                </div>
                                <span className="text-xs font-mono text-nebula-cyan font-bold tracking-widest">1240</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-2xl font-black text-white italic tracking-tighter">09:54</div>
                </div>
            </motion.div>

            {/* Tactical Console (Action Bar) */}
            <div className="w-full max-w-md px-4 grid grid-cols-2 gap-3 pb-8">
                <button
                    onClick={copyLink}
                    className="glass-panel py-4 rounded-2xl border-white/5 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-all active:scale-95"
                >
                    <div className="text-nebula-cyan text-lg">
                        {copied ? <FaCheck className="animate-bounce" /> : <FaCopy />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-nebula-cyan transition-colors">
                        {copied ? "Sync Success" : "Link Node"}
                    </span>
                </button>

                <button
                    className="glass-panel py-4 rounded-2xl border-white/5 flex flex-col items-center justify-center gap-2 group hover:bg-white/5 transition-all opacity-40 italic active:scale-95"
                >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Resign</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Surrender</span>
                </button>
            </div>
        </LayoutWrapper>
    );
        </LayoutWrapper >
    );
}

export default function GamePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-nebula-cyan animate-pulse">Loading Board...</div>}>
            <GameContent />
        </Suspense>
    );
}
