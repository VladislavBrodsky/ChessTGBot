'use client';

import { Badge } from '@/components/ui/Badge';

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
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span
                            className="w-7 h-7 shrink-0 rounded-lg border flex items-center justify-center font-serif text-sm"
                            style={{ color: `color-mix(in srgb, ${accent} 38%, var(--text-primary))`, background: `rgba(${rgb},0.08)`, borderColor: `rgba(${rgb},0.22)` }}
                            aria-hidden="true"
                        >
                            {cfg.glyph}
                        </span>
                        <div className="min-w-0 text-left">
                            <span className="block text-caption font-semibold normal-case tracking-normal truncate" style={{ color: `color-mix(in srgb, ${accent} 38%, var(--text-primary))` }}>{cfg.metal}</span>
                            <span className="block text-caption font-bold normal-case tracking-normal text-brand-muted truncate">{cfg.piece}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span
                            className="px-2 py-0.5 rounded-full text-caption font-semibold tracking-normal border"
                            style={{
                                color: `color-mix(in srgb, ${accent} 40%, var(--text-primary))`,
                                background: `rgba(${rgb},0.08)`,
                                borderColor: `rgba(${rgb},0.22)`,
                            }}
                        >
                            {cfg.badgeLabel}
                        </span>
                    </div>
                </div>

                <div className="relative -mx-1 mt-1 mb-1 z-10 h-[118px] flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <motion.div
                            animate={{ opacity: [0.2, 0.45, 0.2], scale: [1, 1.05, 1] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="w-28 h-16 rounded-full group-hover:opacity-60 group-hover:scale-110 transition-all duration-500 pointer-events-none"
                            style={{ background: `radial-gradient(ellipse, ${glow}, transparent 70%)` }}
                        />
                    </div>
                    <MysteryBoxArt tier={tier} />
                </div>

                <div className="text-left z-10 min-h-[45px]">
                    <h3 className="text-sm font-semibold normal-case tracking-tight leading-tight text-brand-primary">{cfg.name}</h3>
                    <p className="text-caption text-brand-muted leading-snug mt-1 font-medium">{cfg.tagline}</p>
                    {/* Apex Drop Highlight for Viral FOMO */}
                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-elevated border border-brand-border-opacity-10 text-caption font-medium">
                        <span className="text-amber-400 font-bold shrink-0">★</span>
                        <span className="truncate text-brand-primary font-semibold">{cfg.apexDrop}</span>
                    </div>
                    {cfg.limited && <SeasonalCountdown className="mt-1.5" accent={accent} />}
                </div>

                <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    aria-haspopup="dialog"
                    className="ui-tap-target z-10 min-h-11 w-full mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-brand-border-opacity-10 text-caption font-semibold normal-case tracking-normal text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                >
                    <span>{t('whats_inside')}</span>
                    <FiChevronDown size={11} className="-rotate-90" />
                </button>

                <button
                    type="button"
                    disabled={locked}
                    onClick={onUnbox}
                    className={`ui-tap-target z-10 w-full min-h-11 mt-1 rounded-xl text-caption font-semibold normal-case tracking-normal transition-all duration-300 relative overflow-hidden ${
                        locked
                            ? 'bg-brand-elevated/80 text-brand-muted border border-brand-border-opacity-20 cursor-not-allowed shadow-inner'
                            : 'bg-amber-500 text-brand-void font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] active:scale-[0.98] cursor-pointer'
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

                {/* 100% Guaranteed Drop reassurance */}
                <div className="mt-2 flex items-center justify-center gap-1 text-caption text-brand-muted font-medium">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>100% Guaranteed Drop</span>
                </div>
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
