'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaPalette, FaVolumeUp, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
    const { theme, toggleTheme } = useTheme();
    const [soundEnabled, setSoundEnabled] = useState(true);

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
                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                        Configuration v1.2
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Neural Preferences</h1>
                    <p className="text-xs font-medium text-white/40 uppercase tracking-[0.2em]">System parameters & visual protocols</p>
                </div>

                {/* Section: Appearance */}
                <div className="w-full space-y-6 mb-12">
                    <h3 className="text-[10px] font-black uppercase text-nebula-cyan tracking-[0.3em] ml-2">Visual Sync</h3>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-5 rounded-4xl border-white/5 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-nebula-purple/10 flex items-center justify-center text-nebula-purple">
                                    {theme === 'dark' ? <FaMoon /> : <FaSun />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white uppercase tracking-tight">Luminance Mode</span>
                                    <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">{theme === 'dark' ? 'Deep Void' : 'Solar Flare'}</span>
                                </div>
                            </div>

                            {/* Liquid Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`w-14 h-8 rounded-full p-1 transition-all duration-500 relative ${theme === 'dark' ? 'bg-nebula-purple shadow-[0_0_15px_rgba(123,44,191,0.4)]' : 'bg-gray-800'}`}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="w-6 h-6 rounded-full bg-white shadow-xl"
                                />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-full glass-panel p-5 rounded-4xl border-white/5 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-nebula-cyan/10 flex items-center justify-center text-nebula-cyan text-lg">
                                    <FaVolumeUp />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-black text-white uppercase tracking-tight">Audio Protocol</span>
                                    <span className="text-[9px] font-black text-white/30 tracking-widest uppercase">{soundEnabled ? 'Sync Active' : 'Muted'}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-14 h-8 rounded-full p-1 transition-all duration-500 relative ${soundEnabled ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-800'}`}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="w-6 h-6 rounded-full bg-white shadow-xl"
                                />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Section: Premium Status */}
                <div className="w-full space-y-6">
                    <h3 className="text-[10px] font-black uppercase text-nebula-purple tracking-[0.3em] ml-2">Legacy & Status</h3>

                    <Link href="/membership" className="w-full">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full p-1 rounded-4xl bg-linear-to-r from-nebula-cyan via-nebula-purple to-pink-500"
                        >
                            <div className="w-full h-full glass-panel-dark p-6 rounded-4xl bg-black/90 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl">
                                        ⭐
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-lg font-black text-white italic tracking-tighter uppercase leading-none mb-1">X Premium</span>
                                        <span className="text-[9px] font-black text-nebula-cyan uppercase tracking-widest">Elevated Access Verified</span>
                                    </div>
                                </div>
                                <FaArrowLeft className="rotate-180 text-white/20" />
                            </div>
                        </motion.button>
                    </Link>
                </div>

                {/* Legal / versioning */}
                <div className="w-full mt-20 flex flex-col items-center opacity-20 scale-90 text-center">
                    <span className="text-[9px] font-black tracking-[0.5em] uppercase mb-1 underline cursor-pointer">Protocol Terms</span>
                    <span className="text-[8px] font-bold tracking-[0.2em] italic">Authorized for Neural Matrix Interface Build v1.2</span>
                </div>
            </div>
        </LayoutWrapper>
    );
}
