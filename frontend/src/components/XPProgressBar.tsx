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
    
    const progressPercentage = progress.progressPercentage;
    const levelSecured = progress.isLevelSecured;
    const userLevel = progress.displayedLevel;

    const progressText = levelSecured
        ? 'Level secured'
        : `${progress.currentLevelProgress} / ${XP_PER_LEVEL} XP`;

    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {/* Label and Progress text */}
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                    {levelLabel} {userLevel}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted tabular-nums">
                    {progressText}
                </span>
            </div>

            {/* Premium Track */}
            <div
                role="progressbar"
                aria-label={`${levelLabel} ${userLevel} progress`}
                aria-valuemin={0}
                aria-valuemax={XP_PER_LEVEL}
                aria-valuenow={progress.currentLevelProgress}
                aria-valuetext={levelSecured
                    ? `${levelLabel} ${userLevel} secured`
                    : `${progress.currentLevelProgress} of ${XP_PER_LEVEL} XP toward ${levelLabel} ${userLevel + 1}`}
                className="app-progress-track relative h-3.5 w-full rounded-full overflow-hidden border"
            >
                {levelSecured && (
                    <div 
                        aria-hidden="true" 
                        className="absolute inset-[2px] rounded-full border border-brand-border-opacity-20 pointer-events-none z-20" 
                    />
                )}
                
                {/* Progress Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute top-0 left-0 h-full rounded-full overflow-hidden z-10 ${
                        levelSecured ? 'app-progress-fill--secured' : 'app-progress-fill--gold'
                    }`}
                >
                    {/* Inner Shimmer sweep */}
                    <motion.div
                        aria-hidden="true"
                        animate={{ x: ['-120%', '320%'] }}
                        transition={{ duration: levelSecured ? 3.6 : 2.5, repeat: Infinity, ease: 'linear', delay: 0.5 }}
                        className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    />
                </motion.div>
                
                {/* Outer Shimmer sweep */}
                <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: levelSecured ? 3.6 : 2.5, repeat: Infinity, ease: 'linear', delay: 1.0 }}
                    className="absolute top-0 left-0 h-full w-1/3 pointer-events-none z-15"
                    style={{
                        background: levelSecured
                            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                    }}
                />
            </div>
        </div>
    );
}
