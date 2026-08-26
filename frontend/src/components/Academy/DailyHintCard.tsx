'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaLightbulb, FaCheckCircle, FaStar } from "react-icons/fa";
import { DAILY_HINTS } from "@/data/hints";

export default function DailyHintCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hint, setHint] = useState("");

  useEffect(() => {
    const lastView = localStorage.getItem("lastHintViewTime");
    if (lastView) {
      const timeSinceLastView = Date.now() - parseInt(lastView, 10);
      if (timeSinceLastView < 24 * 60 * 60 * 1000) {
        setIsVisible(false);
        return; // Don't even set the hint if we're not showing it
      }
    }

    const start = new Date(new Date().getFullYear(), 0, 0);
    const diff = (new Date().getTime() - start.getTime()) + ((start.getTimezoneOffset() - new Date().getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    setHint(DAILY_HINTS[dayOfYear % DAILY_HINTS.length]);
  }, []);

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      localStorage.setItem("lastHintViewTime", Date.now().toString());
    } else {
      setIsFlipped(false);
    }
  };

  if (!isVisible || !hint) return null;

  return (
    <div className="w-full perspective-[1000px] mb-6 cursor-pointer group" onClick={handleFlip}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full relative h-32 shadow-premium rounded-2xl"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT - Ultra Premium */}
        <div 
          className={`absolute inset-0 bg-brand-void bg-[var(--cyber-card-bg)] border border-brand-border-opacity-10 rounded-2xl p-5 flex items-center justify-between overflow-hidden shadow-inner-glow transition-all duration-500 group-hover:border-emerald-500/30 ${isFlipped ? 'z-0' : 'z-10'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          
          {/* Animated Background Gradients */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle,rgba(20,184,166,0.15)_0%,transparent_70%)] rounded-full -ml-20 -mb-20 pointer-events-none" />
          
          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-brand-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="flex flex-col gap-1.5 z-10">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-emerald-400/90 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              <FaLightbulb className="text-sm" /> Hint of the Day
            </h3>
            <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] flex items-center gap-1">
              Tap to reveal tip <span className="w-1 h-1 rounded-full bg-emerald-500/50" /> Earn XP
            </p>
          </div>

          <motion.div 
            animate={{ 
              boxShadow: ["0 0 15px rgba(16,185,129,0.1)", "0 0 25px rgba(16,185,129,0.3)", "0 0 15px rgba(16,185,129,0.1)"],
              scale: [1, 1.05, 1]
            }} 
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="relative w-14 h-14 bg-gradient-to-br from-brand-surface to-brand-void rounded-full flex items-center justify-center border border-emerald-500/30 shadow-neon z-10"
          >
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-sm" />
            <FaStar className="text-emerald-400 text-xl drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          </motion.div>
        </div>

        {/* BACK - Ultra Premium Reward State */}
        <div 
          className={`absolute inset-0 bg-brand-void bg-[var(--cyber-card-bg)] border border-emerald-500/30 rounded-2xl p-5 flex items-center justify-center overflow-hidden shadow-inner-glow ${isFlipped ? 'z-10' : 'z-0'}`}
          style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {/* Emerald Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)] rounded-full -ml-10 -mb-10 pointer-events-none" />

          {/* Subtle Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-brand-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="flex items-center gap-5 z-10 w-full pl-2 pr-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={isFlipped ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-md" />
              <FaCheckCircle className="text-[40px] text-emerald-500 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)] relative z-10" />
            </motion.div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-xs font-medium text-brand-muted leading-relaxed drop-shadow-md italic text-pretty">
                "{hint}"
              </p>
              <motion.p 
                initial={{ opacity: 0, x: 10 }}
                animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                transition={{ delay: 0.3 }}
                className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500 drop-shadow-[0_0_5px_rgba(251,191,36,0.3)] flex items-center gap-1.5"
              >
                +10 XP <span className="text-brand-muted normal-case font-normal tracking-normal text-[8px]">(Rewarded)</span>
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
