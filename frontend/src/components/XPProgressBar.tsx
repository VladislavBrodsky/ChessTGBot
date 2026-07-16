'use client';

import { motion } from 'framer-motion';
import { getXPProgress, XP_PER_LEVEL } from '@/lib/xpProgress';

interface XPProgressBarProps {
    xp: number;
    level: number;
    levelLabel?: string;
    className?: string;
}

export default function XPProgressBar({ xp, level, levelLabel = 'Level', className = '' }: XPProgressBarProps) {
    const progress = getXPProgress(xp, level);
    const progressText = progress.isLevelSecured
        ? 'Level secured'
        : `${progress.currentLevelProgress} / ${XP_PER_LEVEL} XP`;

    return (
        <div className={`w-full flex flex-col gap-2 ${className}`}>
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                    {levelLabel} {progress.displayedLevel}
                </span>
                <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest tabular-nums">
                    {progressText}
                </span>
            </div>

            <div
                role="progressbar"
                aria-label={`${levelLabel} ${progress.displayedLevel} progress`}
                aria-valuemin={0}
                aria-valuemax={XP_PER_LEVEL}
                aria-valuenow={progress.currentLevelProgress}
                aria-valuetext={progress.isLevelSecured
                    ? `${levelLabel} ${progress.displayedLevel} secured`
                    : `${progress.currentLevelProgress} of ${XP_PER_LEVEL} XP toward ${levelLabel} ${progress.displayedLevel + 1}`}
                className="w-full h-3 rounded-full overflow-hidden relative bg-brand-elevated border border-brand-border-opacity-20"
            >
                <motion.div
                    initial={false}
                    animate={{ width: `${progress.progressPercentage}%` }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="h-full rounded-full bg-brand-gold"
                    style={progress.isLevelSecured ? { background: 'var(--accent-silver)' } : undefined}
                />
            </div>
        </div>
    );
}
