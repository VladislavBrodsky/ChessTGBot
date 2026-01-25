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
        <LayoutWrapper>
            <div className="w-full flex justify-start mb-6">
                <Link href="/">
                    <button className="text-white hover:text-nebula-cyan transition-colors flex items-center space-x-2">
                        <FaArrowLeft />
                        <span>Back</span>
                    </button>
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg space-y-6"
            >
                <h1 className="text-3xl font-bold mb-8">Settings</h1>

                {/* Theme Section */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel p-6 rounded-[2rem] space-y-4"
                >
                    <div className="flex items-center space-x-3 mb-2">
                        <FaPalette className="text-nebula-purple text-xl drop-shadow-[0_0_8px_rgba(123,44,191,0.5)]" />
                        <h2 className="text-lg font-bold tracking-tight uppercase opacity-80">Appearance</h2>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="w-full py-5 px-6 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-between hover:bg-white/10 hover:border-nebula-cyan/30 transition-all duration-300 group"
                    >
                        <span className="flex items-center gap-3">
                            {theme === 'dark' ? <FaMoon className="text-nebula-purple group-hover:scale-110 transition-transform" /> : <FaSun className="text-yellow-400 group-hover:scale-110 transition-transform" />}
                            <span className="font-bold tracking-tight">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                        </span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-500 ${theme === 'dark' ? 'bg-nebula-purple' : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-500 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </motion.div>

                {/* Sound Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-panel p-6 rounded-[2rem] flex items-center justify-between"
                >
                    <div className="flex items-center space-x-3">
                        <FaVolumeUp className="text-nebula-cyan text-xl drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
                        <h2 className="text-lg font-bold tracking-tight uppercase opacity-80">Sound Effects</h2>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-14 h-8 rounded-full flex items-center px-1 transition-all duration-500 ${soundEnabled ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-gray-600'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-500 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </motion.div>

                {/* Premium Section */}
                <Link href="/membership" className="block">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-panel p-6 rounded-4xl flex items-center justify-between border-nebula-purple/30 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-linear-to-r from-nebula-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center space-x-4 relative">
                            <div className="w-12 h-12 rounded-full bg-nebula-purple/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                <span className="text-2xl drop-shadow-[0_0_10px_rgba(123,44,191,0.6)]">⭐</span>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-black tracking-tight uppercase italic text-white group-hover:text-nebula-cyan transition-colors">Premium Membership</h2>
                                <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Unlock the full galactic experience</p>
                            </div>
                        </div>
                        <FaArrowLeft className="rotate-180 opacity-30 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                    </motion.div>
                </Link>
            </motion.div>
        </LayoutWrapper>
    );
}
