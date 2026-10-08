'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FaGraduationCap, FaFire, FaStar, FaBookOpen } from 'react-icons/fa';

interface AcademyProgressCardProps {
  completedCount: number;
  totalCount: number;
  totalXp: number;
  streak: number;
}

export default function AcademyProgressCard({ completedCount, totalCount, totalXp, streak }: AcademyProgressCardProps) {
  const t = useTranslations('Academy');
  // Clamp to avoid impossible numbers (e.g., 4/2 if API is stale)
  const safeCompleted = Math.min(completedCount, totalCount);
  const percentage = totalCount > 0 ? Math.round((safeCompleted / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-brand-border-opacity-10 bg-brand-surface p-5 mb-6 shadow-sm"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold normal-case tracking-normal text-brand-primary mb-0.5">
              {t('academy_progress')}
            </h2>
            <p className="text-caption text-brand-muted font-medium">
              {t('master_the_game')}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/25 flex items-center justify-center shadow-sm">
            <FaGraduationCap className="text-emerald-500 text-base" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {/* Completed */}
          <div className="rounded-2xl border border-brand-border-opacity-10 bg-brand-void/20 p-3 flex flex-col items-center justify-center gap-0.5">
            <div className="w-7 h-7 rounded-lg bg-brand-primary/8 flex items-center justify-center mb-1">
              <FaBookOpen className="text-brand-muted text-sm" />
            </div>
            <span className="text-caption normal-case font-semibold text-brand-muted tracking-normal">
              {t('completed')}
            </span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-semibold text-brand-primary">{safeCompleted}</span>
              <span className="text-caption font-bold text-brand-muted">/{totalCount}</span>
            </div>
          </div>

          {/* XP Earned */}
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-3 flex flex-col items-center justify-center gap-0.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400/10 flex items-center justify-center mb-1">
              <FaStar className="text-amber-400 text-sm" />
            </div>
            <span className="text-caption normal-case font-semibold text-amber-400/60 tracking-normal">XP</span>
            <span className="text-base font-semibold text-amber-400">{totalXp.toLocaleString()}</span>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-orange-400/15 bg-orange-400/5 p-3 flex flex-col items-center justify-center gap-0.5">
            <div className="w-7 h-7 rounded-lg bg-orange-400/10 flex items-center justify-center mb-1">
              <FaFire className="text-orange-500 text-sm" />
            </div>
            <span className="text-caption normal-case font-semibold text-orange-400/60 tracking-normal">Streak</span>
            <span className="text-base font-semibold text-orange-500">{streak}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-caption font-semibold normal-case tracking-normal text-brand-muted">
              {t('course_completion')}
            </span>
            <span className={`text-caption font-semibold ${percentage >= 100 ? 'text-emerald-400' : 'text-brand-muted'}`}>
              {percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-brand-border-opacity-10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className={`h-full rounded-full ${
                percentage >= 100
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
