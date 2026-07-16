'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiChevronDown, FiLock } from 'react-icons/fi';
import MysteryBoxArt from './MysteryBoxArt';
import SeasonalCountdown from './SeasonalCountdown';
import { BOX_CONFIG, DROP_KIND_COLOR, type BoxTier } from './boxConfig';

interface MysteryBoxCardProps {
    tier: BoxTier;
    /** Current user XP — drives affordability gating. */
    userXP: number;
    onUnbox: () => void;
    disabled?: boolean;
    /** Extra classes forwarded to the root element (e.g. col-span-2). */
    className?: string;
}

export default function MysteryBoxCard({ tier, userXP, onUnbox, disabled, className = '' }: MysteryBoxCardProps) {
    const t = useTranslations('Marketplace');
    const [showOdds, setShowOdds] = useState(false);
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
            className={`w-full rounded-[22px] relative group overflow-hidden border bg-brand-surface shadow-[0_14px_40px_rgba(0,0,0,0.28)] ${className}`}
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

                <div className={`flex items-center justify-center relative -mx-2 -mt-1 z-10 ${className.includes('col-span-2') ? 'h-[148px]' : 'h-[132px]'}`}>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div
                            className="w-32 h-20 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500"
                            style={{ background: `radial-gradient(ellipse, ${glow}, transparent 68%)` }}
                        />
                    </div>
                    <MysteryBoxArt tier={tier} size={className.includes('col-span-2') ? 148 : 136} />
                </div>

                <div className="text-left z-10 min-h-[45px]">
                    <h3 className="text-[13px] font-black uppercase tracking-tight leading-tight text-brand-primary">{cfg.name}</h3>
                    <p className="text-[9px] text-brand-muted leading-snug mt-1 font-medium">{cfg.tagline}</p>
                    {cfg.limited && <SeasonalCountdown className="mt-1.5" accent={accent} />}
                </div>

                <button
                    type="button"
                    onClick={() => setShowOdds((value) => !value)}
                    aria-expanded={showOdds}
                    aria-controls={`box-odds-${tier}`}
                    className="z-10 min-h-11 w-full mt-1 flex items-center justify-between gap-2 border-t border-brand-border-opacity-10 text-[8px] font-black uppercase tracking-[0.15em] text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                >
                    <span>{t('whats_inside')}</span>
                    <motion.span animate={{ rotate: showOdds ? 180 : 0 }}><FiChevronDown size={11} /></motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {showOdds && (
                        <motion.div
                            id={`box-odds-${tier}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="z-10 overflow-hidden"
                        >
                            <div className="space-y-1 py-2">
                                {cfg.drops.map((drop) => (
                                    <div key={drop.label} className="flex items-start justify-between gap-1.5">
                                        <div className="flex items-start gap-1.5 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: DROP_KIND_COLOR[drop.kind] }} />
                                            <span className="text-[9px] text-brand-muted leading-snug">{drop.label}</span>
                                        </div>
                                        <span className="text-[9px] font-black tabular-nums shrink-0" style={{ color: DROP_KIND_COLOR[drop.kind] }}>{drop.chance}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    type="button"
                    disabled={locked}
                    onClick={onUnbox}
                    className={`z-10 w-full min-h-11 mt-1 rounded-xl font-black uppercase transition-all duration-300 relative overflow-hidden ${
                        locked
                            ? 'bg-brand-bg-opacity-5 text-brand-muted border border-brand-border-opacity-10 cursor-not-allowed text-[9px] tracking-[0.08em]'
                            : 'text-[10px] tracking-[0.12em] text-black active:scale-[0.98] cursor-pointer shadow-lg'
                    }`}
                    style={locked ? undefined : { background: `linear-gradient(100deg, ${accent}, ${glow})` }}
                >
                    {!locked && (
                        <span className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1 px-1 leading-tight text-center">
                        {!affordable && !disabled && <FiLock size={9} className="shrink-0" />}
                        {disabled
                            ? t('unavailable')
                            : affordable
                                ? `${cfg.costXP.toLocaleString()} XP`
                                : t('need_more_xp', { amount: shortfall.toLocaleString() })}
                    </span>
                </button>
            </div>
        </motion.article>
    );
}
