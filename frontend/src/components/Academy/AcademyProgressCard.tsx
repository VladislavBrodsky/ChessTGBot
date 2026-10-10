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
      className="ui-hero-card w-full p-5"
    >

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-section-title font-semibold text-brand-primary mb-0.5">
              {t('academy_progress')}
            </h2>
            <p className="text-caption text-brand-muted font-medium">
              {t('master_the_game')}
            </p>
          </div>
          <span className="ui-icon-tile ui-icon-tile--success"><FaGraduationCap className="text-base" aria-hidden="true" /></span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {/* Completed */}
          <div className="ui-stat items-center p-3 text-center">
            <FaBookOpen className="text-brand-muted text-sm mb-1" aria-hidden="true" />
            <span className="ui-stat__label">{t('completed')}</span>
            <span className="ui-stat__value text-base">{safeCompleted}<span className="text-caption font-medium text-brand-muted">/{totalCount}</span></span>
          </div>

          {/* XP Earned */}
          <div className="ui-stat ui-stat--gold items-center p-3 text-center">
            <FaStar className="text-brand-gold text-sm mb-1" aria-hidden="true" />
            <span className="ui-stat__label">XP</span>
            <span className="ui-stat__value text-base">{totalXp.toLocaleString()}</span>
          </div>

          {/* Streak */}
          <div className="ui-stat ui-stat--accent items-center p-3 text-center">
            <FaFire className="text-brand-success text-sm mb-1" aria-hidden="true" />
            <span className="ui-stat__label">Streak</span>
            <span className="ui-stat__value text-base">{streak}</span>
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
          <div className="w-full h-2 bg-brand-elevated rounded-full overflow-hidden" role="progressbar" aria-label={t('course_completion')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="h-full rounded-full bg-brand-action"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
