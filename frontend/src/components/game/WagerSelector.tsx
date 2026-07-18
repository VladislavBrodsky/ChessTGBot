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
    <section className="px-4 pt-4 pb-3 border-b border-brand-border-opacity-10" aria-labelledby="wager-selector-title">
      <div className="flex justify-center items-center mb-3">
        <span id="wager-selector-title" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.18em] flex items-center gap-1.5">
          <FaCoins className="text-emerald-500" size={9} />
          {tg('select_wager')}
        </span>
      </div>

      <div className="relative fade-edges w-full">
        <motion.div
          ref={wagerScrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 px-[calc(50%-42px)] snap-x snap-mandatory"
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
                aria-pressed={isSelected}
                onClick={(e) => {
                  setSelectedWager(opt.val);
                  setIsCustomWager(false);
                  telegramHaptic('light');
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.scrollTo({
                      left: e.currentTarget.offsetLeft - parent.offsetWidth / 2 + e.currentTarget.offsetWidth / 2,
                      behavior: 'smooth'
                    });
                  }
                }}
                className={`w-[84px] min-h-[48px] px-2 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isSelected
                    ? 'arena-option--wager-selected font-extrabold'
                    : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary hover:border-brand-border-opacity-20'
                }`}
              >
                {opt.val === 100000 && <FaCrown className="text-[10px] text-emerald-500 mr-1" />}
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="absolute bottom-1.5 w-4 h-px rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
          <button
            data-active={isCustomWager ? "true" : "false"}
            aria-label={tg('enter_amount')}
            aria-pressed={isCustomWager}
            onClick={(e) => {
              setIsCustomWager(true);
              telegramHaptic('light');
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.scrollTo({
                  left: e.currentTarget.offsetLeft - parent.offsetWidth / 2 + e.currentTarget.offsetWidth / 2,
                  behavior: 'smooth'
                });
              }
            }}
            className={`w-[84px] min-h-[48px] px-2 rounded-xl shrink-0 flex items-center justify-center border text-[11px] font-black tracking-wide transition-all duration-200 cursor-pointer snap-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              isCustomWager
                ? 'arena-option--wager-selected font-extrabold'
                : 'bg-brand-void/50 border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary hover:border-brand-border-opacity-20'
            }`}
          >
            <span>···</span>
            {isCustomWager && (
              <span className="absolute bottom-1.5 w-4 h-px rounded-full bg-emerald-500" />
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
            className="w-full text-center px-3 py-2 rounded-xl border border-brand-border-opacity-20 bg-brand-void text-brand-primary text-[16px] font-black focus:outline-none shadow-inner tracking-wider"
            placeholder={tg('enter_amount')}
          />
        </motion.div>
      )}
    </section>
  );
}
