'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import { FaLightbulb, FaCheckCircle } from "react-icons/fa";

const DAILY_HINTS = [
  "Knights on the rim are dim. Keep them centralized!",
  "Control the center: e4, d4, e5, d5 are the most critical squares.",
  "Develop all your pieces before launching an attack.",
  "Don't move your Queen too early in the opening.",
  "Always look for checks, captures, and threats."
];

export default function DailyHintCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [hint] = useState(() => DAILY_HINTS[Math.floor(Math.random() * DAILY_HINTS.length)]);

  return (
    <div className="w-full perspective-1000 mb-6 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full relative h-28 transform-style-3d shadow-premium rounded-2xl"
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex flex-col gap-1 z-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
              <FaLightbulb /> Hint of the Day
            </h3>
            <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest">
              Tap to reveal tip & earn XP
            </p>
          </div>
          <motion.div 
            animate={{ y: [0, -5, 0] }} 
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            <span className="text-xl">💡</span>
          </motion.div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 backface-hidden bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-center overflow-hidden"
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex items-center gap-4 z-10">
            <FaCheckCircle className="text-3xl text-amber-500 shrink-0 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <div>
              <p className="text-xs font-bold text-amber-400/90 leading-snug">
                "{hint}"
              </p>
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/50 mt-1">
                +10 XP Rewarded
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
