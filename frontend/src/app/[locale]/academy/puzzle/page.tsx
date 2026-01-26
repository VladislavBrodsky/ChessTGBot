'use client';

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

// Placeholder Puzzle Data (Mate in 2)
// White to move.
// Position: 4r3/1p4R1/p1p5/2P2k1p/1P3B2/P4P1b/7P/6K1 w - - 1 35
// Solution: Rg5+ ... (If Kf4, ???)
// Let's use a simpler known mate in 2.
// White: Kh1, Rg1, Ph2. Black: Kh8, Pg7.
// Position: 6rk/6pp/8/6R1/8/8/7P/7K w - - 0 1
// Mate: 1. Rh5 gxh5? No.
// Let's grab a real FEN.
// "Standard Smothered Mate"
// FEN: r1b3rk/pp3p1p/2pp1q2/4n2Q/4P3/2N5/PP3PPP/R1B2RK1 w - - 0 1
// Wait, that's complex.
// Let's do a simple Rook Mate.
// FEN: 8/8/8/8/8/5k2/8/4K2R w - - 0 1
// 1. O-O+ Kg3 ...
// Let's use:
// White: Qh6, Ng5. Black: Kh8, Rg8.
// FEN: 6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1
// Solution: 1. Nf7#
const PUZZLE = {
    fen: "6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1",
    solution: ["g5f7"],  // Just one move mate
    title: "Smothered Strike",
    description: "White to play and mate in 1."
};

export default function PuzzlePage() {
    const [solved, setSolved] = useState(false);

    return (
        <LayoutWrapper className="pb-32 pt-6">
            <div className="w-full max-w-md mx-auto px-4 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/academy" className="p-3 glass-panel rounded-xl text-brand-primary hover:text-white transition-colors">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tight text-white">{PUZZLE.title}</h1>
                        <p className="text-xs text-brand-primary/50 font-bold uppercase tracking-widest">{PUZZLE.description}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-brand-primary/10">
                    <PuzzleBoard
                        initialFen={PUZZLE.fen}
                        solution={PUZZLE.solution}
                        onSolve={() => setSolved(true)}
                        onFail={() => console.log('Wrong move')}
                    />
                </div>

                {solved && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-center"
                    >
                        <h2 className="text-xl font-black italic text-green-400 mb-2">EXCELLENT!</h2>
                        <p className="text-sm text-green-400/80 mb-4">You have spotted the tactical pattern.</p>
                        <Link href="/academy">
                            <button className="px-8 py-3 bg-green-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-400 transition-colors">
                                Continue
                            </button>
                        </Link>
                    </motion.div>
                )}
            </div>
        </LayoutWrapper>
    );
}
