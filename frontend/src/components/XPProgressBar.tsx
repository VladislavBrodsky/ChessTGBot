'use client';

import { getXPProgress } from '@/lib/xpProgress';
import { CountUp } from '@/components/ui/CountUp';

interface XPProgressBarProps {
    xp: number;
    level: number;
    levelLabel?: string;
    className?: string;
}

/** Gold XP bar. Values come from `getXPProgress`; nothing is invented. */
export default function XPProgressBar({ xp, level, levelLabel = 'Level', className = '' }: XPProgressBarProps) {
    const progress = getXPProgress(xp, level);
    const progressPercentage = Math.min(100, Math.max(0, progress.progressPercentage));
    const userLevel = progress.displayedLevel;

    return (
        <div className={`w-full flex flex-col gap-2 ${className}`}>
            <div className="flex justify-between items-baseline gap-3 px-0.5">
                <span className="text-sm font-bold text-brand-primary">
                    {levelLabel} {userLevel}
                </span>
                <span className="text-caption font-semibold text-brand-muted tabular-nums">
                    <CountUp value={progress.currentLevelProgress} /> / {progress.nextLevelXp.toLocaleString()} XP
                </span>
            </div>

            <div
                role="progressbar"
                aria-label={`${levelLabel} ${userLevel}`}
                aria-valuemin={0}
                aria-valuemax={progress.nextLevelXp}
                aria-valuenow={progress.currentLevelProgress}
                aria-valuetext={`${progress.currentLevelProgress} / ${progress.nextLevelXp} XP → ${levelLabel} ${userLevel + 1}`}
                className="app-progress-track relative h-3 w-full rounded-full overflow-hidden border"
            >
                <div style={{ width: `${progressPercentage}%` }}
                    className="absolute top-0 start-0 z-10 h-full rounded-full app-progress-fill--secured transition-[width] duration-700 ease-out" />
            </div>
        </div>
    );
}
