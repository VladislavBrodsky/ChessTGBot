'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiGift, FiAward, FiZap, FiCheck } from 'react-icons/fi';

interface UnboxingModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal' | null;
    onSuccess: (prizeName: string) => void;
}

export default function UnboxingModal({ isOpen, onClose, tier, onSuccess }: UnboxingModalProps) {
    const [animationState, setAnimationState] = useState<'shaking' | 'flash' | 'reveal'>('shaking');
    const [revealedPrize, setRevealedPrize] = useState<{ name: string; type: string; icon: React.ReactNode } | null>(null);

    const prizesByTier = {
        common: [
            { name: "50 XR (Full Refund)", type: "refund", icon: <FiZap size={28} /> },
            { name: "Bronze Profile Border", type: "cosmetic", icon: <FiAward size={28} /> },
            { name: "1.2x XR Boost (24h)", type: "boost", icon: <FiZap size={28} /> }
        ],
        rare: [
            { name: "1-Week Premium", type: "premium", icon: <FiGift size={28} /> },
            { name: "Silver Profile Border", type: "cosmetic", icon: <FiAward size={28} /> },
            { name: "1.5x XR Boost (48h)", type: "boost", icon: <FiZap size={28} /> }
        ],
        epic: [
            { name: "1-Month Premium", type: "premium", icon: <FiGift size={28} /> },
            { name: "Gold Profile Border", type: "cosmetic", icon: <FiAward size={28} /> },
            { name: "2x XR Boost (72h)", type: "boost", icon: <FiZap size={28} /> }
        ],
        legendary: [
            { name: "1-Year Premium", type: "premium", icon: <FiGift size={28} /> },
            { name: "Platinum Profile Border", type: "cosmetic", icon: <FiAward size={28} /> },
            { name: "500 XR Jackpot", type: "refund", icon: <FiZap size={28} /> }
        ],
        seasonal: [
            { name: "Limited Season Badge", type: "cosmetic", icon: <FiAward size={28} /> },
            { name: "Season multiplier Boost", type: "boost", icon: <FiZap size={28} /> }
        ]
    };

    useEffect(() => {
        if (isOpen && tier) {
            setAnimationState('shaking');
            setRevealedPrize(null);

            // Shaking suspense: 2.5 seconds
            const shakeTimer = setTimeout(() => {
                setAnimationState('flash');
                
                // Determine a random prize based on tier
                const possiblePrizes = prizesByTier[tier];
                const prize = possiblePrizes[Math.floor(Math.random() * possiblePrizes.length)];
                setRevealedPrize(prize);

                // Flash is very quick: 200ms
                const flashTimer = setTimeout(() => {
                    setAnimationState('reveal');
                    onSuccess(prize.name);
                }, 250);

                return () => clearTimeout(flashTimer);
            }, 2500);

            return () => clearTimeout(shakeTimer);
        }
    }, [isOpen, tier]);

    const tierGradients = {
        common: 'from-white/10 to-black',
        rare: 'from-white/20 to-black',
        epic: 'from-white/30 to-black',
        legendary: 'from-white/50 to-black shadow-[0_0_50px_rgba(255,255,255,0.15)]',
        seasonal: 'from-white/25 to-black'
    };

    return (
        <AnimatePresence>
            {isOpen && tier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />

                    {/* Unboxing Area */}
                    <div className="relative w-full max-w-sm flex flex-col items-center justify-center text-center p-6 text-brand-primary h-[500px]">
                        
                        {/* Shaking State */}
                        {animationState === 'shaking' && (
                            <div className="space-y-8 flex flex-col items-center">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">
                                    UNBOXING MYSTERY...
                                </span>
                                
                                {/* 3D CSS Box Shaking */}
                                <motion.div
                                    animate={{ 
                                        x: [-8, 8, -8, 8, 0],
                                        y: [-4, 4, -4, 4, 0],
                                        rotate: [-2, 2, -2, 2, 0]
                                    }}
                                    transition={{ 
                                        duration: 0.18, 
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-32 h-32 rounded-3xl bg-gradient-to-br from-white/30 to-white/5 border border-white/20 shadow-premium flex items-center justify-center"
                                >
                                    <span className="text-4xl font-black text-white/40">?</span>
                                </motion.div>
                                <div className="h-6" />
                            </div>
                        )}

                        {/* Flash Transition */}
                        {animationState === 'flash' && (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-white z-50 flex items-center justify-center"
                            />
                        )}

                        {/* Reveal State */}
                        {animationState === 'reveal' && revealedPrize && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', duration: 0.6 }}
                                className="space-y-6 flex flex-col items-center w-full"
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">
                                    YOU UNLOCKED
                                </span>

                                {/* Prize Card Container */}
                                <div className={`w-48 h-48 rounded-4xl bg-gradient-to-b ${tierGradients[tier]} border border-white/20 flex flex-col items-center justify-center p-4 relative overflow-hidden`}>
                                    {/* Ambient background glow */}
                                    <div className="absolute inset-0 bg-glass-gradient pointer-events-none" />
                                    
                                    <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-4 text-white shadow-inner-glow">
                                        {revealedPrize.icon}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{revealedPrize.type}</span>
                                </div>

                                <div className="space-y-2">
                                    <h2 className="text-xl font-black uppercase tracking-wider text-white leading-none">
                                        {revealedPrize.name}
                                    </h2>
                                    <p className="text-xs text-brand-muted">Item has been added to your inventory</p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="px-8 py-3 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest shadow-premium hover:bg-white/90 cursor-pointer flex items-center gap-2"
                                >
                                    <FiCheck size={14} />
                                    Acknowledge
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
