'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { FaGraduationCap, FaFire } from 'react-icons/fa';

interface AcademyProgressCardProps {
  completedCount: number;
  totalCount: number;
  totalXp: number;
  streak: number;
}

export default function AcademyProgressCard({ completedCount, totalCount, totalXp, streak }: AcademyProgressCardProps) {
  const t = useTranslations('Academy');
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-1">
            {t.has('academy_progress') ? t('academy_progress') : 'Academy Progress'}
          </h2>
          <p className="text-xs text-brand-primary/60 font-medium">
            {t.has('master_the_game') ? t('master_the_game') : 'Master the game step by step'}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <FaGraduationCap className="text-lg" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-brand-void/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-brand-primary/50 tracking-widest mb-1">{t.has('completed') ? t('completed') : 'Completed'}</span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-brand-primary">{completedCount}</span>
            <span className="text-xs font-bold text-brand-primary/40">/ {totalCount}</span>
          </div>
        </div>
        <div className="bg-brand-void/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-brand-primary/50 tracking-widest mb-1">XP Earned</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-amber-400">{totalXp.toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-brand-void/30 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase font-bold text-brand-primary/50 tracking-widest mb-1">Streak</span>
          <div className="flex items-center gap-1.5">
            <FaFire className="text-orange-500 text-sm" />
            <span className="text-lg font-black text-orange-500">{streak}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest">
          <span>{t.has('course_completion') ? t('course_completion') : 'Course Completion'}</span>
          <span className="text-emerald-500">{percentage}%</span>
        </div>
        <div className="w-full h-2.5 bg-brand-void/50 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(52,211,153,0.5)] relative"
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ animation: 'shimmer 2s infinite' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
