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
    <div className="w-full cursor-pointer group" style={{ perspective: '1000px' }} onClick={handleFlip} role="button" tabIndex={0} aria-pressed={isFlipped} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFlip(); } }}>
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
        className="w-full relative h-32 rounded-2xl"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT - Ultra Premium */}
        <div 
          className={`ui-hero-card absolute inset-0 rounded-2xl p-5 flex items-center justify-between transition-colors duration-300 group-hover:border-brand-border-opacity-30 ${isFlipped ? 'z-0' : 'z-10'}`}
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="flex flex-col gap-1.5 z-10 min-w-0">
            <h3 className="text-sm font-semibold text-brand-primary flex items-center gap-2">
              <FaLightbulb className="text-sm text-brand-gold" aria-hidden="true" /> Hint of the day
            </h3>
            <p className="text-caption font-medium text-brand-muted">
              Tap to reveal a tip · +10 XP
            </p>
          </div>

          <span className="ui-icon-tile ui-icon-tile--success w-14 h-14 rounded-2xl z-10">
            <FaStar className="text-xl" aria-hidden="true" />
          </span>
        </div>

        {/* BACK - Ultra Premium Reward State */}
        <div 
          className={`ui-hero-card absolute inset-0 rounded-2xl p-5 flex items-center justify-center ${isFlipped ? 'z-10' : 'z-0'}`}
          style={{ transform: "rotateY(180deg)", backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center gap-5 z-10 w-full pl-2 pr-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={isFlipped ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ type: "spring", delay: 0.15, stiffness: 200 }}
              className="relative shrink-0"
            >
              <FaCheckCircle className="text-[40px] text-brand-success relative z-10" aria-hidden="true" />
            </motion.div>
            
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-primary leading-relaxed text-pretty">
                “{hint}”
              </p>
              <motion.p 
                initial={{ opacity: 0, x: 10 }}
                animate={isFlipped ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                transition={{ delay: 0.3 }}
                className="text-caption font-semibold text-brand-success flex items-center gap-1.5"
              >
                +10 XP <span className="text-brand-muted font-normal text-caption">(rewarded)</span>
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
