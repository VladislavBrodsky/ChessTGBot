import React from 'react';
import { FaCrown, FaCoins } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { telegramHaptic } from "@/lib/telegram";

interface WagerSelectorProps {
  selectedWager: number;
  setSelectedWager: (val: number) => void;
  customWagerInput: string;
  setCustomWagerInput: (val: string) => void;
  isCustomWager: boolean;
  setIsCustomWager: (val: boolean) => void;
  wagerScrollRef: React.RefObject<HTMLDivElement | null>;
  tg: (key: any) => string;
}

export default function WagerSelector({
  selectedWager,
  setSelectedWager,
  customWagerInput,
  setCustomWagerInput,
  isCustomWager,
  setIsCustomWager,
  wagerScrollRef,
  tg
}: WagerSelectorProps) {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-brand-border-opacity-5">
      <div className="flex justify-center items-center mb-2.5">
        <span className="text-[9px] font-black uppercase text-brand-primary opacity-45 tracking-widest flex items-center gap-1.5">
          <FaCoins className="opacity-60" size={8} />
          {tg('select_wager')}
        </span>
      </div>

      <div className="relative fade-edges w-full">
        <motion.div
          ref={wagerScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1.5 px-[calc(50%-38px)] snap-x snap-mandatory"
          initial={{ x: 0 }}
          animate={{ x: [0, -14, 12, -7, 4, 0] }}
          transition={{ delay: 0.5, duration: 0.85, ease: "easeInOut" }}
        >
          {[
            { label: "FREE", val: 0 },
            { label: "$1", val: 100 },
            { label: "$5", val: 500 },
            { label: "$10", val: 1000 },
            { label: "$25", val: 2500 },
            { label: "$50", val: 5000 },
            { label: "$100", val: 10000 },
            { label: "$250", val: 25000 },
            { label: "$500", val: 50000 },
            { label: "$1000", val: 100000 }
          ].map((opt) => {
            const isSelected = !isCustomWager && selectedWager === opt.val;
            return (
              <button
                key={opt.val}
                data-active={isSelected ? "true" : "false"}
                onClick={(e) => {
                  setSelectedWager(opt.val);
                  setIsCustomWager(false);
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
                {opt.val === 100000 && <FaCrown className="text-[9px] text-yellow-400 mr-0.5 animate-pulse" />}
                <span className={isSelected ? "mb-1.5" : ""}>{opt.label}</span>
                {isSelected && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb,255,255,255),0.8)]" />
                )}
              </button>
            );
          })}
          <button
            data-active={isCustomWager ? "true" : "false"}
            onClick={(e) => {
              setIsCustomWager(true);
              telegramHaptic('light');
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              });
            }}
            className={`w-[76px] py-2.5 rounded-xl shrink-0 flex items-center justify-center border text-[10px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center relative ${
              isCustomWager
                ? 'border-brand-primary bg-brand-void text-brand-primary shadow-neon scale-105 font-extrabold'
                : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-primary/50 hover:text-brand-primary/80 hover:border-brand-border-opacity-20 hover:scale-105'
            }`}
          >
            <span className={isCustomWager ? "mb-1.5" : ""}>···</span>
            {isCustomWager && (
              <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb,255,255,255),0.8)]" />
            )}
          </button>
        </motion.div>
      </div>

      {isCustomWager && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
          <input
            type="number"
            value={customWagerInput}
            onChange={(e) => setCustomWagerInput(e.target.value)}
            className="w-full text-center px-3 py-2 rounded-xl border border-brand-border-opacity-20 bg-brand-void text-brand-primary text-xs font-black focus:outline-none shadow-inner tracking-wider"
            placeholder={tg('enter_amount')}
          />
        </motion.div>
      )}
    </div>
  );
}
