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

    // Ultra-Premium Branding Configuration
    const tierStyles = {
        common: {
            bg: 'bg-black/40',
            border: 'border-[#8B4513]/30', // Bronze color
            accent: 'from-[#CD7F32] via-[#8B4513] to-[#5C3317]',
            text: 'text-[#CD7F32]',
            badge: 'bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/20',
            iconColor: 'text-[#CD7F32]'
        },
        rare: {
            bg: 'bg-black/40',
            border: 'border-[#C0C0C0]/30', // Silver color
            accent: 'from-[#E8E8E8] via-[#C0C0C0] to-[#787878]',
            text: 'text-[#E8E8E8]',
            badge: 'bg-[#C0C0C0]/10 text-[#C0C0C0] border-[#C0C0C0]/20',
            iconColor: 'text-[#C0C0C0]'
        },
        epic: {
            bg: 'bg-black/50',
            border: 'border-[#FFD700]/40', // Gold color
            accent: 'from-[#FFE55C] via-[#FFD700] to-[#B8860B]',
            text: 'text-[#FFD700]',
            badge: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20',
            iconColor: 'text-[#FFD700]'
        },
        legendary: {
            bg: 'bg-black/60',
            border: 'border-[#E5E4E2]/50', // Platinum color
            accent: 'from-[#FFFFFF] via-[#E5E4E2] to-[#A09F9C]',
            text: 'text-white',
            badge: 'bg-[#E5E4E2]/15 text-white border-[#E5E4E2]/30 shadow-[0_0_15px_rgba(229,228,226,0.2)]',
            iconColor: 'text-white'
        },
        seasonal: {
            bg: 'bg-black/50',
            border: 'border-[#FF4500]/40', // Fire/Season color
            accent: 'from-[#FF6347] via-[#FF4500] to-[#8B0000]',
            text: 'text-[#FF4500]',
            badge: 'bg-[#FF4500]/10 text-[#FF4500] border-[#FF4500]/20',
            iconColor: 'text-[#FF4500]'
        }
    };

    const style = tierStyles[tier];

    return (
        <motion.div
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full rounded-[32px] p-[1px] bg-gradient-to-b from-white/10 to-transparent relative group overflow-hidden`}
        >
            {/* The Inner Card Content */}
            <div className={`w-full h-full rounded-[31px] ${style.bg} backdrop-blur-2xl border ${style.border} p-6 flex flex-col justify-between relative z-10 min-h-[380px]`}>
                
                {/* Premium Background Glow Effect */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${style.accent} opacity-10 rounded-full blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity duration-700`} />
                <div className={`absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr ${style.accent} opacity-5 rounded-full blur-3xl pointer-events-none group-hover:opacity-15 transition-opacity duration-700`} />

                {/* Top Section */}
                <div className="flex justify-between items-start z-10">
                    <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${style.badge}`}>
                        {tier}
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] block mb-0.5">Price</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-white">{cost.toLocaleString()}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>{currency}</span>
                        </div>
                    </div>
                </div>

                {/* Center Visual Component (The Vault/Chest Concept) */}
                <div className="flex-1 flex flex-col items-center justify-center relative my-6 z-10">
                    <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-32 h-32 flex items-center justify-center"
                    >
                        {/* Glow Behind the Box */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${style.accent} rounded-full opacity-20 blur-xl group-hover:blur-2xl transition-all duration-500 group-hover:scale-110`} />
                        
                        {/* The Box Render (Minimalist geometric crystal shape) */}
                        <div className={`w-20 h-24 bg-gradient-to-b ${style.accent} rounded-t-3xl rounded-b-xl shadow-2xl relative overflow-hidden flex flex-col items-center border border-white/20 z-10`}>
                            {/* Vault Details */}
                            <div className="w-full h-8 bg-black/40 border-b border-white/10 absolute top-0 left-0 flex items-center justify-center backdrop-blur-md">
                                <div className="w-8 h-1 bg-white/20 rounded-full" />
                            </div>
                            
                            {/* Core Crystal */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 rotate-45 border border-white/20 shadow-inner-glow flex items-center justify-center">
                                <span className={`-rotate-45 font-black text-xl ${style.text} drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]`}>?</span>
                            </div>
                            
                            {/* Inner Refractions */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Info & Action */}
                <div className="z-10 text-center space-y-4">
                    <div>
                        <h3 className={`text-base font-black uppercase tracking-widest ${style.text} mb-1.5 leading-tight`}>{name}</h3>
                        <p className="text-[11px] text-white/50 leading-relaxed max-w-[200px] mx-auto line-clamp-2 font-medium">
                            {description}
                        </p>
                    </div>
                    
                    <button
                        disabled={disabled}
                        onClick={onUnbox}
                        className={`w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group/btn ${
                            disabled 
                                ? 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed' 
                                : `bg-gradient-to-r ${style.accent} text-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer`
                        }`}
                    >
                        {/* Shimmer effect on button hover */}
                        {!disabled && (
                            <div className="absolute inset-0 -translate-x-[150%] hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                        )}
                        <span className="relative z-10">{t('claim')}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
