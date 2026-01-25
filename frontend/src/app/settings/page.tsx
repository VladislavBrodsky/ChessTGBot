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
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <FaPalette className="text-accent-primary text-xl" />
                        <h2 className="text-lg font-semibold">Appearance</h2>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="w-full py-4 px-6 rounded-xl border border-glass-border bg-glass-bg flex items-center justify-between hover:bg-white/5 transition-all"
                    >
                        <span className="flex items-center gap-3">
                            {theme === 'dark' ? <FaMoon className="text-nebula-purple" /> : <FaSun className="text-yellow-400" />}
                            <span className="capitalize">{theme} Mode</span>
                        </span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-nebula-purple' : 'bg-gray-400'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                    </button>
                </div>

                {/* Sound Section */}
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FaVolumeUp className="text-accent-secondary text-xl" />
                        <h2 className="text-lg font-semibold">Sound Effects</h2>
                    </div>

                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                    >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                    </button>
                </div>
            </motion.div>
        </LayoutWrapper>
    );
}
