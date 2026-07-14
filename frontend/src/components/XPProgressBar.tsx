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

            <div className="w-full h-3.5 bg-brand-void/60 rounded-full overflow-hidden border border-brand-border-opacity-10 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)]">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-amber-500/[0.02] pointer-events-none" />

                {/* Fill */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ 
                        width: `${progressPercentage}%`,
                        backgroundPosition: ["0% 50%", "200% 50%"]
                    }}
                    transition={{ 
                        width: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
                        backgroundPosition: { repeat: Infinity, duration: 4, ease: "linear" }
                    }}
                    className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 relative rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    style={{
                        backgroundSize: '200% 100%',
                    }}
                >
                    {/* Glowing Leading-Edge Spark */}
                    {progressPercentage > 0 && (
                        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-4 h-full pointer-events-none overflow-visible">
                            {/* Outer Soft Glow */}
                            <div className="absolute w-5 h-5 bg-amber-400/50 rounded-full blur-xs animate-pulse" />
                            {/* Inner Bright Spark */}
                            <div className="absolute w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_6px_#fff]" />
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
