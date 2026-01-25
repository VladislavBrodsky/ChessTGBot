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
                            className="text-white/40 hover:text-white transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <FaArrowLeft className="text-[10px]" />
                            <span>Return</span>
                        </motion.button>
                    </Link>
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Neural Academy • V2
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Neural Combat Training</h1>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Acquire mastery through the machine</p>
                </div>

                {/* Progress Widget */}
                <div className="w-full glass-panel p-6 rounded-3xl border-white/5 mb-8 bg-linear-to-br from-white/5 to-transparent overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <FaGraduationCap className="text-6xl rotate-12" />
                    </div>
                    <div className="relative z-10 flex flex-col">
                        <span className="text-[9px] font-black uppercase text-white/60 tracking-[0.4em] mb-4">Current Module</span>
                        <h2 className="text-xl font-black text-white mb-6 pr-12 leading-tight">Universal Opening Principles</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "65%" }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">65% Sync</span>
                        </div>
                    </div>
                </div>

                {/* Training Tracks */}
                <div className="w-full space-y-4">
                    <h3 className="text-[9px] font-black uppercase text-white/10 tracking-[0.5em] ml-2 mb-6 text-center">Available Vectors</h3>

                    {[
                        { title: "Tactical Matrix", level: "Beginner", icon: "⚡" },
                        { title: "Positional Flow", level: "Adept", icon: "🌀" },
                        { title: "Endgame Entropy", level: "Grandmaster", icon: "☣️" }
                    ].map((track, i) => (
                        <motion.button
                            key={i}
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full glass-panel p-5 rounded-2xl border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl grayscale group-hover:grayscale-0 transition-all">
                                    {track.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white italic tracking-tight uppercase leading-none mb-1">{track.title}</span>
                                    <span className="text-[9px] font-bold text-white/20 tracking-widest uppercase">{track.level} Complexity</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center opacity-10 group-hover:opacity-100 transition-all">
                                <FaArrowLeft className="rotate-180 text-[10px] text-white" />
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* AI Mentor Callout */}
                <div className="w-full mt-12 py-5 px-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-5">
                    <div className="text-2xl grayscale opacity-30">🤖</div>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] italic leading-relaxed">Neural Mentor v2.0 is synthesizing adaptive puzzles based on your recent performance metrics.</p>
                </div>
            </div>
        </LayoutWrapper>
    );
}
