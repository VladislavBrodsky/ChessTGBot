'use client';

import { motion } from 'framer-motion';

interface XPProgressBarProps {
    xp: number;
    level: number;
    levelLabel?: string;
    className?: string;
}

export default function XPProgressBar({ xp, level, levelLabel = 'Level', className = '' }: XPProgressBarProps) {
    // Simple formula: Level N requires N*100 XP total? 
    // Let's assume linear levels for visual simplicity: 100 XP per level.
    // XP towards next level = xp % 100
    // Progress = (xp % 100) / 100

    const xpPerLevel = 200; // Matching backend service
    const currentLevelProgress = xp % xpPerLevel;
    const progressPercentage = (currentLevelProgress / xpPerLevel) * 100;

    return (
        <div className={`w-full flex flex-col gap-1.5 ${className}`}>
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-bold text-brand-primary opacity-60 uppercase tracking-widest">
                    {levelLabel} {level}
                </span>
                <span className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
                    {currentLevelProgress} / {xpPerLevel} XP
                </span>
            </div>

            <div className="w-full h-4 bg-brand-surface border border-brand-border-opacity-10 rounded-full overflow-hidden relative shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)] backdrop-blur-md">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-amber-500/[0.05] pointer-events-none" />
                
                {/* Grid Overlay for texture */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                {/* Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ 
                        width: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="h-full relative rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] border-y border-r border-amber-300/40 overflow-hidden"
                    style={{
                        background: 'linear-gradient(90deg, #92400e 0%, #d97706 55%, #fbbf24 100%)',
                    }}
                >
                    {/* Shimmer sweeps left → right */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] -translate-x-full animate-shimmer" />

                    {/* Glowing Leading-Edge Spark */}
                    {progressPercentage > 0 && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-6 h-full pointer-events-none overflow-visible">
                            {/* Outer Soft Glow */}
                            <div className="absolute w-8 h-8 bg-amber-400/60 rounded-full blur-md animate-pulse" />
                            {/* Inner Bright Spark */}
                            <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff,0_0_20px_#fcd34d]" />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
