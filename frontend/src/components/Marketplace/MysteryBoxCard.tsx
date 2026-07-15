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
}

export default function MysteryBoxCard({ tier, userXP, onUnbox, disabled }: MysteryBoxCardProps) {
    const t = useTranslations('Marketplace');
    const [showOdds, setShowOdds] = useState(false);
    const cfg = BOX_CONFIG[tier];
    const { accent, accent2, glow, rgb } = cfg.theme;

    const affordable = userXP >= cfg.costXP;
    const shortfall = cfg.costXP - userXP;
    const locked = disabled || !affordable;

    return (
        <motion.div
            whileHover={{ y: locked ? 0 : -5 }}
            whileTap={{ scale: locked ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="w-full rounded-[24px] p-[1px] relative group overflow-hidden self-start"
            style={{ background: `linear-gradient(160deg, rgba(${rgb},0.4), rgba(255,255,255,0.05) 42%, transparent)` }}
        >
            <div
                className="w-full h-full rounded-[23px] bg-black/50 backdrop-blur-2xl border p-3.5 flex flex-col relative z-10"
                style={{ borderColor: `rgba(${rgb},0.22)` }}
            >
                {/* Ambient rarity glows */}
                <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }} />
                <div className="absolute -bottom-20 -left-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle, ${accent2}, transparent 70%)` }} />

                {/* Limited ribbon */}
                {cfg.limited && (
                    <div className="absolute top-3.5 -right-8 rotate-45 px-9 py-0.5 text-[7px] font-black uppercase tracking-[0.2em] text-black shadow-lg z-20"
                        style={{ background: `linear-gradient(90deg, ${accent}, ${glow})` }}>
                        {t('limited')}
                    </div>
                )}

                {/* Rarity badge */}
                <div className="z-10 self-start px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-[0.15em]"
                    style={{ color: accent, background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.28)` }}>
                    {cfg.metal}
                </div>

                {/* Artwork */}
                <div className="flex items-center justify-center relative my-1 z-10 h-[112px]">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-28 h-28 rounded-full blur-2xl opacity-25 group-hover:opacity-45 group-hover:scale-110 transition-all duration-500"
                            style={{ background: `radial-gradient(circle, ${glow}, transparent 65%)` }} />
                    </div>
                    <MysteryBoxArt tier={tier} size={110} />
                </div>

                {/* Name + tagline */}
                <div className="text-center z-10 min-h-[42px]">
                    <h3 className="text-[13px] font-black uppercase tracking-wide leading-tight" style={{ color: accent }}>{cfg.name}</h3>
                    <p className="text-[9px] text-white/45 leading-snug mt-0.5 font-medium">{cfg.tagline}</p>
                    {cfg.limited && <SeasonalCountdown className="mt-1" accent={accent} />}
                </div>

                {/* What's inside (odds transparency) */}
                <button
                    onClick={() => setShowOdds((v) => !v)}
                    className="z-10 mx-auto mt-1.5 flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.15em] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                    {t('whats_inside')}
                    <motion.span animate={{ rotate: showOdds ? 180 : 0 }}><FiChevronDown size={11} /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                    {showOdds && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="z-10 overflow-hidden">
                            <div className="space-y-1 py-2">
                                {cfg.drops.map((d) => (
                                    <div key={d.label} className="flex items-start justify-between gap-1.5">
                                        <div className="flex items-start gap-1.5 min-w-0">
                                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1" style={{ background: DROP_KIND_COLOR[d.kind] }} />
                                            <span className="text-[9px] text-white/60 leading-snug">{d.label}</span>
                                        </div>
                                        <span className="text-[9px] font-black tabular-nums shrink-0" style={{ color: DROP_KIND_COLOR[d.kind] }}>{d.chance}%</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CTA */}
                <button
                    disabled={locked}
                    onClick={onUnbox}
                    className={`z-10 w-full mt-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-300 relative overflow-hidden ${
                        locked ? 'bg-white/[0.04] text-white/30 border border-white/5 cursor-not-allowed' : 'text-black active:scale-95 cursor-pointer shadow-lg'
                    }`}
                    style={locked ? undefined : { background: `linear-gradient(90deg, ${accent}, ${glow})` }}
                >
                    {!locked && (
                        <span className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                    )}
                    <span className="relative z-10 flex items-center justify-center gap-1">
                        {!affordable && !disabled && <FiLock size={10} />}
                        {disabled
                            ? t('unavailable')
                            : affordable
                                ? `${cfg.costXP.toLocaleString()} XP`
                                : t('need_more_xp', { amount: shortfall.toLocaleString() })}
                    </span>
                </button>
            </div>
        </motion.div>
    );
}
