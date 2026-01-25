'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaGraduationCap } from "react-icons/fa";

export default function AcademyPage() {
    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            <div className="w-full max-w-md flex flex-col items-start px-4">
                {/* Immersive Header */}
                <div className="w-full flex justify-between items-center mb-10">
                    <Link href="/">
                        <motion.button
                            whileHover={{ x: -2 }}
                            className="text-white/40 hover:text-white transition-colors flex items-center space-x-2 text-xs font-black uppercase tracking-widest"
                        >
                            <FaArrowLeft className="text-[10px]" />
                            <span>Return</span>
                        </motion.button>
                    </Link>
                    <div className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[10px] font-black text-pink-500 uppercase tracking-widest">
                        Academy Core
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Neural Combat Training</h1>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">Acquire mastery through the machine</p>
                </div>

                {/* Progress Widget */}
                <div className="w-full glass-panel p-6 rounded-4xl border-white/5 mb-8 bg-linear-to-br from-white/5 to-transparent overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FaGraduationCap className="text-6xl rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col">
                        <span className="text-[10px] font-black uppercase text-pink-500 tracking-widest mb-4">Current Module</span>
                        <h2 className="text-xl font-black text-white mb-6 pr-12">Universal Opening Principles</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "65%" }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                                />
                            </div>
                            <span className="text-[10px] font-mono font-black text-white/60 uppercase">65% Transmitted</span>
                        </div>
                    </div>
                </div>

                {/* Training Tracks */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] ml-2 mb-6 text-center">Available Vectors</h3>

                    {[
                        { title: "Tactical Matrix", level: "Beginner", icon: "⚡", color: "pink" },
                        { title: "Positional Flow", level: "Adept", icon: "🌀", color: "nebula-cyan" },
                        { title: "Endgame Entropy", level: "Grandmaster", icon: "☣️", color: "nebula-purple" }
                    ].map((track, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ x: 5 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full glass-panel p-5 rounded-3xl border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                    {track.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white italic tracking-tight uppercase">{track.title}</span>
                                    <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">{track.level} Complexity</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-all">
                                <FaArrowLeft className="rotate-180 text-[10px] text-white" />
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* AI Mentor Callout */}
                <div className="w-full mt-12 py-6 px-8 rounded-4xl bg-linear-to-r from-nebula-purple/20 to-transparent border border-nebula-purple/20 flex items-center gap-6">
                    <div className="text-3xl grayscale opacity-50">🤖</div>
                    <p className="text-[10px] font-black text-nebula-purple uppercase tracking-[0.2em] italic">Neural Mentor v2.0 is synthesizing adaptive puzzles based on your recent losses.</p>
                </div>
            </div>
        </LayoutWrapper>
    );
}
