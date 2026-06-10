'use client';

import { useState } from "react";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import PuzzleBoard from "@/components/Academy/PuzzleBoard";
import { motion } from "framer-motion";
import { FaArrowLeft } from "react-icons/fa";
import { useLocale } from 'next-intl';
import Link from 'next/link';

// Placeholder Puzzle Data (Mate in 2)
// White: Qh6, Ng5. Black: Kh8, Rg8.
// FEN: 6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1
// Solution: 1. Nf7#
const PUZZLE = {
 fen: "6rk/7p/7Q/6N1/8/8/8/7K w - - 0 1",
 solution: ["g5f7"], // Just one move mate
 title: "Smothered Strike",
 description: "White to play and mate in 1."
};

export default function PuzzlePage() {
 const [solved, setSolved] = useState(false);
 const locale = useLocale();

 return (
 <LayoutWrapper className="pb-32 pt-6">
 <div className="w-full max-w-sm mx-auto px-4 space-y-6">

 {/* Header */}
 <div className="flex items-center gap-4">
 <Link href={`/${locale}/academy`} className="p-3 glass-panel rounded-xl text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
 <FaArrowLeft />
 </Link>
 <div>
 <h1 className="text-2xl font-black tracking-tight text-brand-primary uppercase leading-none mb-1">{PUZZLE.title}</h1>
 <p className="text-xs text-brand-primary opacity-40 font-bold uppercase tracking-widest">{PUZZLE.description}</p>
 </div>
 </div>

 <div className="glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm">
            <PuzzleBoard
              initialFen={PUZZLE.fen}
              solution={PUZZLE.solution}
              onSolve={async () => {
                try {
                  await apiFetch("/api/v1/gamification/academy/complete-task", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ task_type: "puzzle", item_id: "daily-puzzle" })
                  });
                } catch (e) {
                  console.error("Failed to submit puzzle completion", e);
                }
                setSolved(true);
              }}
              onFail={() => console.log('Wrong move')}
            />
 </div>

 {solved && (
 <motion.div
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="p-6 bg-brand-surface border border-brand-border-opacity-20 rounded-2xl text-center shadow-sm"
 >
 <h2 className="text-xl font-black text-brand-primary mb-1.5 uppercase">EXCELLENT!</h2>
 <p className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-wide mb-5">You have spotted the tactical pattern.</p>
 <Link href={`/${locale}/academy`}>
 <button className="w-full py-3 bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer shadow-sm">
 Continue
 </button>
 </Link>
 </motion.div>
 )}
 </div>
 </LayoutWrapper>
 );
}
