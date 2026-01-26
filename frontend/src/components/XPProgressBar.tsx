'use client';

import { motion } from 'framer-motion';

interface XPProgressBarProps {
    xp: number;
    level: number;
    className?: string;
}

export default function XPProgressBar({ xp, level, className = '' }: XPProgressBarProps) {
    // Simple formula: Level N requires N*100 XP total? 
    // Let's assume linear levels for visual simplicity: 100 XP per level.
    // XP towards next level = xp % 100
    // Progress = (xp % 100) / 100

    const xpPerLevel = 200; // Matching backend service
    const currentLevelProgress = xp % xpPerLevel;
    const progressPercentage = (currentLevelProgress / xpPerLevel) * 100;

    return (
        <div className={`w-full flex flex-col gap-1 ${className}`}>
            <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest">
                    Level {level}
                </span>
                <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-widest">
                    {currentLevelProgress} / {xpPerLevel} XP
                </span>
            </div>

            <div className="w-full h-3 bg-brand-surface rounded-full overflow-hidden border border-brand-primary/10 relative">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-brand-primary/5"></div>

                {/* Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-brand-primary/60 to-brand-primary relative"
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
