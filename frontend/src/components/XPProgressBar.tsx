'use client';

import { motion } from 'framer-motion';
import { getXPProgress } from '@/lib/xpProgress';

interface XPProgressBarProps {
    xp: number;
    level: number;
    levelLabel?: string;
    className?: string;
}

export default function XPProgressBar({ xp, level, levelLabel = 'Level', className = '' }: XPProgressBarProps) {
    const progress = getXPProgress(xp, level);
    
    const progressPercentage = Math.min(100, Math.max(0, progress.progressPercentage));
    const levelSecured = progress.isLevelSecured;
    const userLevel = progress.displayedLevel;

    const progressText = `${progress.currentLevelProgress.toLocaleString()} / ${progress.nextLevelXp.toLocaleString()} XP`;

    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {/* Label and Progress text */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                        {levelLabel} {userLevel}
                    </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted tabular-nums">
                    {progressText}
                </span>
            </div>

            {/* Premium Track */}
            <div
                role="progressbar"
                aria-label={`${levelLabel} ${userLevel} progress`}
                aria-valuemin={0}
                aria-valuemax={progress.nextLevelXp}
                aria-valuenow={progress.currentLevelProgress}
                aria-valuetext={`${progress.currentLevelProgress} of ${progress.nextLevelXp} XP toward ${levelLabel} ${userLevel + 1}`}
                className="app-progress-track relative h-3.5 w-full rounded-full overflow-hidden border border-brand-border-opacity-10 shadow-inner"
            >
                {/* Progress Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ 
                        width: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className="absolute top-0 left-0 h-full rounded-full overflow-hidden z-10 app-progress-fill--gold"
                >
                    {/* Single Ambient Shimmer sweep */}
                    <motion.div
                        aria-hidden="true"
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none"
                    />
                </motion.div>
            </div>
        </div>
    );
}
