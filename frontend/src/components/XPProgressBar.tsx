'use client';

import { motion } from 'framer-motion';
import { getXPProgress } from '@/lib/xpProgress';
import { FaLock } from 'react-icons/fa';

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

    const currentLevelCost = 350 + (userLevel - 1) * 50;

    const progressText = levelSecured
        ? `${progress.currentLevelProgress.toLocaleString()} / ${progress.nextLevelXp.toLocaleString()} XP`
        : `${progress.currentLevelProgress.toLocaleString()} / ${currentLevelCost.toLocaleString()} XP`;

    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {/* Label and Progress text */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                        {levelLabel} {userLevel}
                    </span>
                    {levelSecured && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-400/10 border border-slate-400/20 text-[9px] font-black uppercase tracking-wider text-slate-300">
                            <FaLock size={8} /> SECURED
                        </span>
                    )}
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
                aria-valuemax={levelSecured ? progress.nextLevelXp : currentLevelCost}
                aria-valuenow={progress.currentLevelProgress}
                aria-valuetext={levelSecured
                    ? `${progress.currentLevelProgress} of ${progress.nextLevelXp} XP toward ${levelLabel} ${userLevel + 1}`
                    : `${progress.currentLevelProgress} of ${currentLevelCost} XP toward ${levelLabel} ${userLevel + 1}`}
                className="app-progress-track relative h-3.5 w-full rounded-full overflow-hidden border border-brand-border-opacity-10 shadow-inner"
            >
                {levelSecured && (
                    <div 
                        aria-hidden="true" 
                        className="absolute inset-[1px] rounded-full border border-slate-300/30 pointer-events-none z-20" 
                    />
                )}
                
                {/* Progress Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ 
                        width: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className={`absolute top-0 left-0 h-full rounded-full overflow-hidden z-10 ${
                        levelSecured ? 'app-progress-fill--secured' : 'app-progress-fill--gold'
                    }`}
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
