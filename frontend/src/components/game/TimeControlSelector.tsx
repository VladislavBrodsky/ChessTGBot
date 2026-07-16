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
    <section className="px-4 pt-3 pb-4" aria-labelledby="time-selector-title">
      <div className="flex justify-center items-center mb-3">
        <span id="time-selector-title" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.18em] flex items-center gap-1.5">
          <FaChessPawn className="text-brand-primary/70" size={9} />
          {tg('time_control')}
        </span>
      </div>

      <div className="relative fade-edges w-full">
        <motion.div
          ref={timeScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 px-[calc(50%-42px)] snap-x snap-mandatory"
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
                aria-pressed={isSelected}
                onClick={(e) => {
                  setTimeControl(opt.val);
                  telegramHaptic('light');
                  e.currentTarget.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                  });
                }}
                className={`w-[84px] min-h-[48px] px-2 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                  isSelected
                    ? 'border-brand-primary bg-brand-elevated text-brand-primary shadow-[0_0_0_1px_var(--color-border-opacity-10)] font-extrabold'
                    : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary hover:border-brand-border-opacity-20'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="absolute bottom-1.5 w-4 h-px rounded-full bg-brand-primary" />
                )}
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
