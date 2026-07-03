import React from 'react';
import { FaChessPawn } from 'react-icons/fa';
import { telegramHaptic } from "@/lib/telegram";
import { motion } from 'framer-motion';

interface TimeControlSelectorProps {
  timeControl: number;
  setTimeControl: (val: number) => void;
  timeScrollRef: React.RefObject<HTMLDivElement | null>;
  tg: (key: any) => string;
}

export default function TimeControlSelector({
  timeControl,
  setTimeControl,
  timeScrollRef,
  tg
}: TimeControlSelectorProps) {
  return (
    <div className="px-4 pt-3 pb-4">
      <div className="flex justify-center items-center mb-2.5">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest flex items-center gap-1.5">
          <FaChessPawn className="opacity-60" size={8} />
          {tg('time_control')}
        </span>
      </div>

      <div className="relative fade-edges w-full">
        <motion.div
          ref={timeScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-[calc(50%-38px)] snap-x snap-mandatory"
          initial={{ x: 0 }}
          animate={{ x: [0, -14, 12, -7, 4, 0] }}
          transition={{ delay: 0.7, duration: 0.85, ease: "easeInOut" }}
        >
          {[
            { label: "1m", val: 60 },
            { label: "3m", val: 180 },
            { label: "5m", val: 300 },
            { label: "10m", val: 600 },
            { label: "15m", val: 900 },
            { label: "30m", val: 1800 },
            { label: "60m", val: 3600 }
          ].map((opt) => {
            const isSelected = timeControl === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={(e) => {
                  setTimeControl(opt.val);
                  telegramHaptic('light');
                  e.currentTarget.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                  });
                }}
                className={`w-[76px] py-2.5 rounded-xl shrink-0 flex items-center justify-center border text-[10px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center relative ${
                  isSelected
                    ? 'border-brand-primary bg-brand-void text-brand-primary shadow-neon scale-105 font-extrabold'
                    : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-primary/50 hover:text-brand-primary/80 hover:border-brand-border-opacity-20 hover:scale-105'
                }`}
              >
                <span className={isSelected ? "mb-1.5" : ""}>{opt.label}</span>
                {isSelected && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb,255,255,255),0.8)]" />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
