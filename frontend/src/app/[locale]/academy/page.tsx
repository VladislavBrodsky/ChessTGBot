'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonCard from "@/components/Academy/LessonCard";
import { FaBrain, FaChessKnight, FaChessRook, FaChessBishop, FaFire } from "react-icons/fa";
import Link from "next/link";

export default function AcademyPage() {
    return (
        <LayoutWrapper className="pb-32 pt-6">
            <div className="w-full max-w-md mx-auto px-4 space-y-8">

                {/* Header */}
                <div className="flex flex-col items-center w-full mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-brand-primary text-3xl font-black italic tracking-tighter select-none"
                    >
                        <FaBrain className="text-2xl opacity-80" />
                        AI ACADEMY
                    </motion.div>
                    <div className="h-px w-10 bg-brand-primary/20 my-2" />
                    <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-brand-primary/30">Neural Training Module</span>
                </div>

                {/* Daily Challenge Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full glass-panel p-6 rounded-3xl border border-brand-primary/20 relative overflow-hidden group hover:shadow-premium transition-all cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-brand-primary/60 bg-brand-primary/5 px-3 py-1.5 rounded-full">
                                <FaFire className="text-orange-500" /> Daily Challenge
                            </span>
                            <span className="text-xs font-bold text-brand-primary">+50 XP</span>
                        </div>

                        <h2 className="text-2xl font-black italic tracking-tight text-white mb-2">Mate in 2</h2>
                        <p className="text-sm text-brand-primary/60 font-medium mb-6">Solve today's tactical puzzle commanded by the engine.</p>

                        <Link href="/academy/puzzle">
                            <button className="w-full py-3 rounded-xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs hover:bg-white transition-colors">
                                Start Puzzle
                            </button>
                        </Link>
                    </div>
                </motion.div>

                {/* Mastery Tracks Grid */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <FaChessKnight className="text-brand-primary/40" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary/60">Mastery Tracks</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <LessonCard
                            title="Opening Principles"
                            description="Master the center and develop your pieces efficiently."
                            progress={30}
                            difficulty="Beginner"
                            duration="10 min"
                            onClick={() => console.log('Open Lesson')}
                        />
                        <LessonCard
                            title="Tactical Patterns"
                            description="Learn pins, forks, and skewers to crush your opponents."
                            progress={0}
                            difficulty="Intermediate"
                            duration="15 min"
                            onClick={() => console.log('Open Lesson')}
                        />
                        <LessonCard
                            title="Endgame Magic"
                            description="Convert your advantage into a win with precision."
                            progress={0}
                            difficulty="Advanced"
                            duration="20 min"
                            locked={true}
                        />
                    </div>
                </div>

                {/* Recent Analysis (Placeholder for future) */}
                <div className="opacity-50">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <FaChessBishop className="text-brand-primary/40" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary/60">Recent Analysis</h3>
                    </div>
                    <div className="w-full p-4 rounded-2xl border border-brand-primary/10 bg-brand-primary/5 flex items-center justify-center h-24 text-[10px] uppercase tracking-widest text-brand-primary/30 font-bold">
                        No recent games analyzed
                    </div>
                </div>

            </div>
        </LayoutWrapper>
    );
}
