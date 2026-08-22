'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaFire, FaTrophy, FaBrain, FaChessKnight } from 'react-icons/fa';
import { telegramHaptic } from '@/lib/telegram';
import { Card } from '@/components/ui/Card';

interface DailyGoalsBentoProps {
  puzzlesGoal?: number;
  puzzlesCurrent?: number;
  winsGoal?: number;
  winsCurrent?: number;
  xpGoal?: number;
  xpCurrent?: number;
  percentile?: number;
  className?: string;
}

export default function DailyGoalsBento({
  puzzlesGoal = 5,
  puzzlesCurrent = 3,
  winsGoal = 3,
  winsCurrent = 2,
  xpGoal = 300,
  xpCurrent = 220,
  percentile = 74,
  className = '',
}: DailyGoalsBentoProps) {
  const puzzlesPercent = Math.min(100, Math.round((puzzlesCurrent / puzzlesGoal) * 100));
  const winsPercent = Math.min(100, Math.round((winsCurrent / winsGoal) * 100));
  const xpPercent = Math.min(100, Math.round((xpCurrent / xpGoal) * 100));

  return (
    <section aria-labelledby="daily-goals-title" className={`w-full ${className}`}>
      <Card
        variant="glass"
        className="w-full p-3.5 sm:p-4 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface/80 backdrop-blur-xl shadow-premium relative overflow-hidden"
      >
        {/* Subtle ambient gradient glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 space-y-2.5">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px]">
                <FaFire />
              </div>
              <h2 id="daily-goals-title" className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary">
                Daily Goals
              </h2>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-brand-muted bg-brand-elevated px-2 py-0.5 rounded-full border border-brand-border-opacity-10">
              Resets 00:00 UTC
            </span>
          </div>

          {/* 3-Column Metric Bento Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Puzzles / Tactics Goal */}
            <motion.div
              whileTap={{ scale: 0.96 }}
              onClick={() => telegramHaptic('selection')}
              className="p-2.5 rounded-2xl bg-brand-void/40 border border-brand-border-opacity-10 flex flex-col items-center justify-between min-h-[78px] cursor-pointer hover:border-emerald-500/30 transition-all group select-none"
            >
              <div className="flex items-center gap-1 text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                <FaBrain className="text-emerald-400 text-[10px]" />
                <span className="truncate">Tactics</span>
              </div>
              <div className="my-1 flex items-baseline gap-0.5">
                <span className="text-sm font-black text-emerald-400 tabular-nums">{puzzlesCurrent}</span>
                <span className="text-[10px] font-bold text-brand-muted tabular-nums">/{puzzlesGoal}</span>
              </div>
              <div className="w-full h-1 bg-brand-border-opacity-10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${puzzlesPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* Wins Goal */}
            <motion.div
              whileTap={{ scale: 0.96 }}
              onClick={() => telegramHaptic('selection')}
              className="p-2.5 rounded-2xl bg-brand-void/40 border border-brand-border-opacity-10 flex flex-col items-center justify-between min-h-[78px] cursor-pointer hover:border-amber-500/30 transition-all group select-none"
            >
              <div className="flex items-center gap-1 text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                <FaChessKnight className="text-amber-400 text-[10px]" />
                <span className="truncate">Victories</span>
              </div>
              <div className="my-1 flex items-baseline gap-0.5">
                <span className="text-sm font-black text-amber-400 tabular-nums">{winsCurrent}</span>
                <span className="text-[10px] font-bold text-brand-muted tabular-nums">/{winsGoal}</span>
              </div>
              <div className="w-full h-1 bg-brand-border-opacity-10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${winsPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* XP Goal */}
            <motion.div
              whileTap={{ scale: 0.96 }}
              onClick={() => telegramHaptic('selection')}
              className="p-2.5 rounded-2xl bg-brand-void/40 border border-brand-border-opacity-10 flex flex-col items-center justify-between min-h-[78px] cursor-pointer hover:border-purple-500/30 transition-all group select-none"
            >
              <div className="flex items-center gap-1 text-[9px] font-bold text-brand-muted uppercase tracking-wider">
                <FaTrophy className="text-purple-400 text-[10px]" />
                <span className="truncate">Daily XP</span>
              </div>
              <div className="my-1 flex items-baseline gap-0.5">
                <span className="text-sm font-black text-purple-400 tabular-nums">{xpCurrent}</span>
                <span className="text-[10px] font-bold text-brand-muted tabular-nums">/{xpGoal}</span>
              </div>
              <div className="w-full h-1 bg-brand-border-opacity-10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                />
              </div>
            </motion.div>
          </div>

          {/* Motivational Percentile Insight Pill */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-brand-surface to-brand-surface border border-emerald-500/20 text-[10px] font-bold text-brand-primary">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs">⚡</span>
              <span className="truncate header-balanced">
                Stronger combat tempo than <strong className="text-emerald-400 font-black">{percentile}%</strong> of players today
              </span>
            </span>
            <span className="text-emerald-400 text-xs shrink-0 font-black">🔥</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
