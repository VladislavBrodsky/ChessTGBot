'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChessBoardComponent from "@/components/game/ChessBoard";
import { useGameSocket } from "@/hooks/useGameSocket";
import { motion } from "framer-motion";

export default function GamePage() {
    const params = useParams();
    const gameId = params.id as string;
    const { fen, makeMove, isConnected, error } = useGameSocket(gameId);
    const [copied, setCopied] = useState(false);

    // Copy Game Link
    const copyLink = () => {
        const link = `https://t.me/YourBotName?startapp=${gameId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-start p-4 relative overflow-hidden bg-[#0B001F]">

            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-900 rounded-full blur-[150px] opacity-20 animate-pulse" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-cyan-900 rounded-full blur-[150px] opacity-20 animate-pulse" />
            </div>

            {/* Header */}
            <header className="w-full max-w-md flex justify-between items-center mb-8 relative z-10 p-4">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                    <span className="text-xs font-mono tracking-widest text-gray-400">
                        {isConnected ? 'ONLINE' : 'CONNECTING...'}
                    </span>
                </div>
                <div className="text-white/50 text-xs font-mono">ID: {gameId}</div>
            </header>

            {/* Error Toast */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-full text-sm backdrop-blur-md z-50"
                >
                    {error}
                </motion.div>
            )}

            {/* Board Container */}
            <div className="w-full max-w-md relative z-20 mb-8">
                <ChessBoardComponent
                    fen={fen}
                    onMove={makeMove}
                    orientation="white" // TODO: Detect player color
                />
            </div>

            {/* Game Info Panel */}
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-panel w-full max-w-md p-6 rounded-2xl space-y-4"
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg">
                            You
                        </div>
                        <div>
                            <div className="text-sm font-bold text-white">Player 1</div>
                            <div className="text-xs text-purple-300">White</div>
                        </div>
                    </div>
                    <div className="text-2xl font-mono text-white/80">10:00</div>
                </div>

                <div className="h-[1px] w-full bg-white/10" />

                <div className="flex justify-between items-center opacity-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-lg text-gray-400">
                            ?
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-400">Opponent</div>
                            <div className="text-xs text-gray-500">Black</div>
                        </div>
                    </div>
                    <div className="text-2xl font-mono text-gray-500">10:00</div>
                </div>

                {/* Invite Button */}
                <button
                    onClick={copyLink}
                    className="w-full mt-4 glass-button py-3 rounded-xl text-cyan-400 text-sm font-medium tracking-wide flex items-center justify-center gap-2 hover:bg-cyan-500/10"
                >
                    {copied ? "Link Copied!" : "Share Invite Link"}
                </button>
            </motion.div>

        </main>
    );
}
