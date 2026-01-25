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
        <LayoutWrapper>
            {/* Header / Nav */}
            <div className="w-full max-w-md flex justify-between items-center mb-6 relative z-10 px-2">
                <Link href="/">
                    <button className="text-white hover:text-nebula-cyan transition-colors flex items-center space-x-2 text-sm">
                        <FaArrowLeft />
                        <span>Quit</span>
                    </button>
                </Link>

                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                    <span className="text-[10px] font-mono tracking-widest text-gray-300">
                        {isConnected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-100 px-6 py-2 rounded-full text-sm backdrop-blur-md z-50 shadow-lg"
                >
                    {error}
                </motion.div>
            )}

            {/* Board Container */}
            <div className="w-full max-w-md relative z-20 mb-6 flex justify-center">
                <div className="p-1 rounded-lg bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm border border-white/5 shadow-2xl">
                    <ChessBoardComponent
                        fen={fen}
                        onMove={makeMove}
                        orientation="white" // TODO: Detect player color
                    />
                </div>
            </div>

            {/* Game Info Panel */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel w-full max-w-md p-5 rounded-2xl space-y-4"
            >
                {/* Player 1 (You) */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-nebula-purple to-indigo-600 flex items-center justify-center font-bold text-sm shadow-md border border-white/10">
                            You
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Player 1</div>
                            <div className="text-[10px] text-nebula-cyan uppercase tracking-wider">White</div>
                        </div>
                    </div>
                    <div className="text-xl font-mono text-white/90 bg-black/20 px-2 py-1 rounded">10:00</div>
                </div>

                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                {/* Player 2 (Opponent) */}
                <div className="flex justify-between items-center opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-lg text-gray-400 border border-white/5">
                            ?
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400">Opponent</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Black</div>
                        </div>
                    </div>
                    <div className="text-xl font-mono text-gray-500 bg-black/10 px-2 py-1 rounded">10:00</div>
                </div>

                {/* Invite Button */}
                <button
                    onClick={copyLink}
                    className="w-full mt-2 glass-button py-3 rounded-xl text-nebula-cyan text-sm font-medium tracking-wide flex items-center justify-center gap-3 group"
                >
                    {copied ? <FaCheck /> : <FaCopy />}
                    <span>{copied ? "Link Copied!" : "Copy Invite Link"}</span>
                </button>
            </motion.div>
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
