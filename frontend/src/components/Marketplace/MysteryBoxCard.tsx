'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface MysteryBoxCardProps {
    tier: 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal';
    name: string;
    cost: number;
    currency: 'xr' | 'xp';
    description: string;
    onUnbox: () => void;
    disabled?: boolean;
}

export default function MysteryBoxCard({ tier, name, cost, currency, description, onUnbox, disabled }: MysteryBoxCardProps) {
    const t = useTranslations('Index');

    // Branding color configurations based on tier, maintaining a premium monochromatic scheme
    const tierStyles = {
        common: {
            bg: 'bg-white/[0.02]',
            border: 'border-white/10 hover:border-white/20',
            badge: 'text-white/40 border-white/10 bg-white/5',
            boxGrad: 'from-[#333] to-[#111]',
            text: 'text-white/80'
        },
        rare: {
            bg: 'bg-white/[0.03]',
            border: 'border-white/15 hover:border-white/30',
            badge: 'text-white/60 border-white/20 bg-white/10',
            boxGrad: 'from-[#666] to-[#222]',
            text: 'text-white/95'
        },
        epic: {
            bg: 'bg-white/[0.04]',
            border: 'border-white/20 hover:border-white/40',
            badge: 'text-white/80 border-white/30 bg-white/15',
            boxGrad: 'from-[#999] to-[#333]',
            text: 'text-white font-extrabold'
        },
        legendary: {
            bg: 'bg-gradient-to-b from-white/[0.06] to-transparent',
            border: 'border-white/30 hover:border-white/60',
            badge: 'text-white border-white/40 bg-white/20 shadow-[0_0_12px_rgba(255,255,255,0.1)]',
            boxGrad: 'from-[#fff] to-[#444]',
            text: 'text-white font-black tracking-tight'
        },
        seasonal: {
            bg: 'bg-white/[0.04]',
            border: 'border-white/20 hover:border-white/40',
            badge: 'text-white/80 border-white/25 bg-white/10',
            boxGrad: 'from-[#888] to-[#222]',
            text: 'text-white font-bold'
        }
    };

    const currentStyle = tierStyles[tier];

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-5 rounded-3xl border ${currentStyle.bg} ${currentStyle.border} transition-all duration-300 flex flex-col justify-between h-[360px] relative overflow-hidden group`}
        >
            {/* Ambient inner shadow/glow */}
            <div className="absolute inset-0 bg-glass-gradient opacity-50 pointer-events-none" />

            {/* Top Row: Tier Badge */}
            <div className="flex justify-between items-start relative z-10">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border ${currentStyle.badge}`}>
                    {tier}
                </span>
                <div className="text-right">
                    <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest block leading-none mb-1">Cost</span>
                    <span className="text-sm font-black text-brand-primary">{cost} {currency.toUpperCase()}</span>
                </div>
            </div>

            {/* Mystery Box Visual (Premium Minimalist 3D CSS / Icon render) */}
            <div className="flex-1 flex items-center justify-center relative my-4">
                <div className="relative w-24 h-24">
                    {/* Background shadow/glow */}
                    <div className="absolute inset-0 bg-white/5 rounded-full filter blur-xl group-hover:bg-white/10 transition-colors duration-300" />
                    
                    {/* Futuristic Monochromatic Cubic Box */}
                    <motion.div 
                        animate={{ 
                            y: [0, -6, 0],
                            rotateY: [0, 360]
                        }}
                        transition={{ 
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                            rotateY: { duration: 25, repeat: Infinity, ease: "linear" }
                        }}
                        className="w-full h-full relative"
                        style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
                    >
                        {/* Elegant Geometric Cube representation using CSS gradients */}
                        <div className={`w-20 h-20 mx-auto mt-2 rounded-2xl bg-gradient-to-br ${currentStyle.boxGrad} border border-white/20 shadow-premium flex items-center justify-center relative overflow-hidden`}>
                            {/* Inner core metallic plate */}
                            <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center shadow-inner-glow">
                                <span className="text-lg font-black text-white/40 group-hover:text-white/80 transition-colors">?</span>
                            </div>
                            
                            {/* Accent geometric lines */}
                            <div className="absolute inset-0 border-t-2 border-white/10 pointer-events-none" />
                            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/15 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bottom Section: Info and CTA */}
            <div className="space-y-3 relative z-10 text-center">
                <div>
                    <h3 className={`text-base uppercase tracking-wider ${currentStyle.text}`}>{name}</h3>
                    <p className="text-[11px] text-brand-muted mt-1 leading-snug line-clamp-2">{description}</p>
                </div>
                <button
                    disabled={disabled}
                    onClick={onUnbox}
                    className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 select-none ${
                        disabled 
                            ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' 
                            : 'bg-white text-black hover:bg-white/90 border border-white shadow-premium hover:shadow-2xl cursor-pointer active:scale-95'
                    }`}
                >
                    {t('claim')}
                </button>
            </div>
        </motion.div>
    );
}
