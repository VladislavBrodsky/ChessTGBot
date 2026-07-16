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
            className="w-full rounded-[22px] relative group overflow-hidden self-start border bg-brand-surface shadow-premium"
            style={{ borderColor: `rgba(${rgb},0.3)` }}
        >
            {/* A quiet chessboard texture ties all tiers to the game without
                competing with each chest's piece-specific artwork. */}
            <div
                className="absolute inset-0 pointer-events-none opacity-70"
                style={{
                    backgroundImage: `linear-gradient(45deg, rgba(${rgb},0.035) 25%, transparent 25%, transparent 75%, rgba(${rgb},0.035) 75%), linear-gradient(45deg, rgba(${rgb},0.035) 25%, transparent 25%, transparent 75%, rgba(${rgb},0.035) 75%)`,
                    backgroundPosition: '0 0, 10px 10px',
                    backgroundSize: '20px 20px',
                }}
            />
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
            <div
                className="absolute -top-20 -right-20 text-[150px] font-serif leading-none pointer-events-none select-none opacity-[0.035]"
                style={{ color: accent }}
                aria-hidden="true"
            >
                {cfg.glyph}
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
                    className="flex items-center justify-center relative -mx-2 -mt-1 z-10 h-[118px]"
                    style={{
                        background: 'radial-gradient(circle, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 45%, transparent 68%)'
                    }}
                >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className="w-28 h-16 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300"
                            style={{ background: `radial-gradient(ellipse, ${glow}, transparent 68%)` }}
                        />
                    </div>
                    <MysteryBoxArt tier={tier} size={124} />
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
                            : 'bg-brand-gold text-brand-void active:scale-[0.98] cursor-pointer'
                    }`}
                >
                    <span className="relative z-10 flex items-center justify-center gap-1.5">
                        {!affordable && !disabled && <FiLock size={10} />}
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
