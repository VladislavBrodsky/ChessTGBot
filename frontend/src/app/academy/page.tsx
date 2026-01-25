'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaGraduationCap } from "react-icons/fa";

export default function AcademyPage() {
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-10 rounded-3xl flex flex-col items-center justify-center text-center space-y-6 max-w-lg"
            >
                <div className="w-24 h-24 rounded-full bg-nebula-purple/20 flex items-center justify-center animate-pulse-slow">
                    <FaGraduationCap className="text-5xl text-nebula-cyan" />
                </div>

                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                    Academy
                </h1>

                <p className="text-gray-300 text-lg leading-relaxed">
                    The void is vast, and mastery requires patience.<br />
                    Interactive lessons and puzzles are being crafted.
                </p>

                <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-sm text-nebula-cyan/80">
                    Coming Soon
                </div>
            </motion.div>
        </LayoutWrapper>
    );
}
