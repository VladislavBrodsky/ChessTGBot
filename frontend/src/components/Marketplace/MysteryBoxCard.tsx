'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiChevronDown, FiLock } from 'react-icons/fi';
import MysteryBoxArt from './MysteryBoxArt';
import SeasonalCountdown from './SeasonalCountdown';
import MysteryBoxDetailsSheet from './MysteryBoxDetailsSheet';
import { BOX_CONFIG, type BoxTier } from './boxConfig';

interface MysteryBoxCardProps {
    tier: BoxTier;
    /** Current user XP — drives affordability gating. */
    userXP: number;
    onUnbox: () => void;
    disabled?: boolean;
}

export default function MysteryBoxCard({ tier, userXP, onUnbox, disabled }: MysteryBoxCardProps) {
    const t = useTranslations('Marketplace');
    const [showDetails, setShowDetails] = useState(false);
    const cfg = BOX_CONFIG[tier];
    const { accent, glow, rgb } = cfg.theme;

    const affordable = userXP >= cfg.costXP;
    const shortfall = cfg.costXP - userXP;
    const locked = disabled || !affordable;

    return (
        <motion.article
            whileHover={{ y: locked ? 0 : -3 }}
            whileTap={{ scale: locked ? 1 : 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full rounded-[22px] relative group self-start bg-brand-surface shadow-premium border border-brand-border-opacity-10"
        >
            {/* Inner wrapper for overflow-hidden to prevent shadow clipping on Safari */}
            <div className="absolute inset-0 rounded-[22px] overflow-hidden pointer-events-none">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
                <div
                    className="absolute -top-20 -right-20 text-[150px] font-serif leading-none opacity-[0.035]"
                    style={{ color: accent }}
                    aria-hidden="true"
                >
                    {cfg.glyph}
                </div>
            </div>

            <div className="w-full h-full p-3 flex flex-col relative z-10">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span
                            className="w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center font-serif text-sm"
                            style={{ color: accent, background: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.22)` }}
                            aria-hidden="true"
                        >
                            {cfg.glyph}
                        </span>
                        <div className="min-w-0 text-left">
                            <span className="block text-[8px] font-black uppercase tracking-[0.16em] truncate" style={{ color: accent }}>{cfg.metal}</span>
                            <span className="block text-[7px] font-bold uppercase tracking-widest text-brand-muted truncate">{cfg.piece}</span>
                        </div>
                    </div>
                    {cfg.limited && (
                        <span
                            className="shrink-0 px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-[0.14em] border"
                            style={{ color: accent, background: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.22)` }}
                        >
                            {t('limited')}
                        </span>
                    )}
                </div>

                <div
                    className="relative -mx-1 mt-1 mb-1 z-10 h-[118px] rounded-2xl overflow-hidden border border-white/5"
                    style={{
                        background: 'radial-gradient(120% 100% at 50% 30%, #202027 0%, #0c0c10 62%, #060607 100%)'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <motion.div
                            animate={{ opacity: [0.12, 0.28, 0.12], scale: [1, 1.05, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-28 h-16 rounded-full blur-2xl group-hover:opacity-40 group-hover:scale-110 transition-all duration-500 mix-blend-screen"
                            style={{ background: `radial-gradient(ellipse, ${glow}, transparent 68%)` }}
                        />
                    </div>
                    <MysteryBoxArt tier={tier} />
                </div>

                <div className="text-left z-10 min-h-[45px]">
                    <h3 className="text-[13px] font-black uppercase tracking-tight leading-tight text-brand-primary">{cfg.name}</h3>
                    <p className="text-[9px] text-brand-muted leading-snug mt-1 font-medium">{cfg.tagline}</p>
                    {cfg.limited && <SeasonalCountdown className="mt-1.5" accent={accent} />}
                </div>

                <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    aria-haspopup="dialog"
                    className="z-10 min-h-11 w-full mt-1 flex items-center justify-between gap-2 border-t border-brand-border-opacity-10 text-[8px] font-black uppercase tracking-[0.15em] text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                >
                    <span>{t('whats_inside')}</span>
                    <FiChevronDown size={11} className="-rotate-90" />
                </button>

                <button
                    type="button"
                    disabled={locked}
                    onClick={onUnbox}
                    className={`z-10 w-full min-h-11 mt-1 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 relative overflow-hidden ${
                        locked
                            ? 'bg-brand-bg-opacity-5 text-brand-muted border border-brand-border-opacity-10 cursor-not-allowed'
                            : 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] active:scale-[0.98] cursor-pointer'
                    }`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                        {!affordable && !disabled && (
                            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                                <FiLock size={10} />
                            </motion.div>
                        )}
                        {disabled
                            ? t('unavailable')
                            : affordable
                                ? `${cfg.costXP.toLocaleString()} XP`
                                : t('need_more_xp', { amount: shortfall.toLocaleString() })}
                    </span>
                </button>
            </div>
            {showDetails && (
                <MysteryBoxDetailsSheet
                    tier={tier}
                    userXP={userXP}
                    disabled={disabled}
                    onClose={() => setShowDetails(false)}
                    onUnbox={onUnbox}
                />
            )}
        </motion.article>
    );
}
