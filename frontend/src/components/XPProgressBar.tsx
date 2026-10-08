'use client';

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
    const userLevel = progress.displayedLevel;

    const progressText = `${progress.currentLevelProgress.toLocaleString()} / ${progress.nextLevelXp.toLocaleString()} XP`;

    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            {/* Label and Progress text */}
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-caption font-semibold normal-case tracking-normal text-brand-primary">
                        {levelLabel} {userLevel}
                    </span>
                </div>
                <span className="text-caption font-semibold normal-case tracking-normal text-brand-muted tabular-nums">
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
                <div style={{ width: `${progressPercentage}%` }}
                    className="absolute top-0 left-0 z-10 h-full rounded-full app-progress-fill--secured transition-[width] duration-200" />
            </div>
        </div>
    );
}
