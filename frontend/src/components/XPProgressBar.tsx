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
                <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
                    {currentLevelProgress} / {xpPerLevel} XP
                </span>
            </div>

            <div className="w-full h-3 bg-brand-surface rounded-full overflow-hidden border border-brand-border-opacity-10 relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-brand-bg-opacity-5"></div>

                {/* Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 relative"
                >
                    {/* Shimmer Effect */}
                    <motion.div
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/2"
                    />
                </motion.div>
            </div>
        </div>
    );
}
