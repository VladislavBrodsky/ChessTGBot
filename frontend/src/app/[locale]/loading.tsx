"use client";

import { motion } from "framer-motion";
import { FaChessKnight } from "react-icons/fa6";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-bg/50 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.8,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute rounded-full bg-nebula-purple/30 blur-[40px] w-32 h-32" />
        <div className="relative p-6 rounded-2xl bg-theme-surface/40 border border-brand-border/50 shadow-neon backdrop-blur-md">
            <FaChessKnight className="text-6xl text-brand-primary drop-shadow-[0_0_20px_var(--accent-primary)] animate-float" />
        </div>
      </motion.div>
    </div>
  );
}
