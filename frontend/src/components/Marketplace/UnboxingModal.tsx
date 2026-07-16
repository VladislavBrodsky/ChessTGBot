'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiGift, FiAward, FiZap, FiCheck, FiStar, FiRefreshCw } from 'react-icons/fi';
import { telegramHaptic } from '@/lib/telegram';
import { useNavbar } from '@/context/NavbarContext';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';
import { BOX_CONFIG, type BoxTier, type DropRarity } from './boxConfig';

interface UnboxingModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: BoxTier | null;
    prizeName: string | null;
    prizeType: string | null;
}

const KIND_ICON: Record<string, React.ReactNode> = {
    refund: <FiRefreshCw size={30} />,
    boost: <FiZap size={30} />,
    cosmetic: <FiAward size={30} />,
    premium: <FiStar size={30} />,
};

// Rarity → celebration intensity. Higher tiers get confetti + longer glow.
const INTENSITY: Record<BoxTier, number> = { common: 0, rare: 1, epic: 2, legendary: 3, seasonal: 2 };

export default function UnboxingModal({ isOpen, onClose, tier, prizeName, prizeType }: UnboxingModalProps) {
    const t = useTranslations('Marketplace');
    const [state, setState] = useState<'shaking' | 'flash' | 'reveal'>('shaking');
    const { pushHide, popHide } = useNavbar();
    const dialogRef = useDialogAccessibility(isOpen, onClose);

    useEffect(() => {
        if (!isOpen) return;
        pushHide();
        return () => popHide();
    }, [isOpen, popHide, pushHide]);

    useEffect(() => {
        if (isOpen && tier && prizeName && prizeType) {
            setState('shaking');
            telegramHaptic('medium');
            const shake = setTimeout(() => {
                setState('flash');
                // Rarity-scaled haptic on reveal.
                telegramHaptic(INTENSITY[tier] >= 2 ? 'success' : 'light');
            }, 760);
            const flash = setTimeout(() => setState('reveal'), 980);
            return () => {
                clearTimeout(shake);
                clearTimeout(flash);
            };
        }
    }, [isOpen, tier, prizeName, prizeType]);

    const cfg = tier ? BOX_CONFIG[tier] : null;
    const intensity = tier ? INTENSITY[tier] : 0;
    const icon = KIND_ICON[prizeType || ''] || <FiGift size={30} />;

    // Pre-compute confetti particles (only for higher rarities).
    const confetti = useMemo(() => {
        if (!cfg || intensity < 2) return [];
        const colors = [cfg.theme.accent, cfg.theme.glow, '#ffffff'];
        return Array.from({ length: intensity >= 3 ? 40 : 24 }, (_, i) => ({
            id: i,
            x: (Math.random() - 0.5) * 360,
            y: -(Math.random() * 300 + 120),
            rotate: Math.random() * 360,
            delay: Math.random() * 0.25,
            color: colors[i % colors.length],
            size: 5 + Math.random() * 6,
        }));
    }, [cfg, intensity]);

    if (!cfg) return null;

    const KNOWN_KINDS: DropRarity[] = ['refund', 'boost', 'cosmetic', 'premium'];
    const kindLabel = KNOWN_KINDS.includes(prizeType as DropRarity)
        ? t(`prize_kind_${prizeType}` as 'prize_kind_refund' | 'prize_kind_boost' | 'prize_kind_cosmetic' | 'prize_kind_premium')
        : (prizeType || t('reward'));

    return (
        <AnimatePresence>
            {isOpen && tier && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
                >
                    {/* Tier ambient glow */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: `radial-gradient(circle at 50% 45%, rgba(${cfg.theme.rgb},${0.05 + intensity * 0.04}), transparent 60%)` }} />

                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="unboxing-title"
                        tabIndex={-1}
                        className="relative flex h-[500px] w-full max-w-sm flex-col items-center justify-center p-6 text-center"
                    >

                        {state === 'shaking' && (
                            <div className="space-y-8 flex flex-col items-center">
                                <span id="unboxing-title" role="status" aria-live="polite" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">{t('unboxing')}</span>
                                <motion.div
                                    animate={{ x: [-8, 8, -8, 8, 0], y: [-4, 4, -4, 4, 0], rotate: [-3, 3, -3, 3, 0], scale: [1, 1.03, 1] }}
                                    transition={{ duration: 0.55, repeat: 1, ease: 'easeInOut' }}
                                    className="w-36 h-36 rounded-3xl border flex items-center justify-center"
                                    style={{ background: `linear-gradient(160deg, rgba(${cfg.theme.rgb},0.4), rgba(0,0,0,0.6))`, borderColor: `rgba(${cfg.theme.rgb},0.4)` }}
                                >
                                    <span className="text-5xl font-black" style={{ color: cfg.theme.accent }}>?</span>
                                </motion.div>
                                <div className="h-6" />
                            </div>
                        )}

                        {state === 'flash' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-white z-50" />
                        )}

                        {state === 'reveal' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className="space-y-6 flex flex-col items-center w-full relative"
                            >
                                {/* Confetti */}
                                {confetti.map((c) => (
                                    <motion.span key={c.id}
                                        initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                                        animate={{ opacity: 0, x: c.x, y: c.y, rotate: c.rotate }}
                                        transition={{ duration: 1.4, delay: c.delay, ease: 'easeOut' }}
                                        className="absolute left-1/2 top-1/3 rounded-sm pointer-events-none"
                                        style={{ width: c.size, height: c.size, background: c.color }} />
                                ))}

                                <span className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: cfg.theme.accent }}>{t('you_unlocked')}</span>

                                <motion.div
                                    className="w-48 h-48 rounded-[32px] border flex flex-col items-center justify-center p-4 relative overflow-hidden"
                                    style={{
                                        background: `linear-gradient(180deg, rgba(${cfg.theme.rgb},0.18), rgba(0,0,0,0.9))`,
                                        borderColor: `rgba(${cfg.theme.rgb},0.35)`,
                                        boxShadow: intensity >= 2 ? `0 0 32px rgba(${cfg.theme.rgb},0.35)` : undefined,
                                    }}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-3" style={{ color: cfg.theme.accent }}>
                                        {icon}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{kindLabel}</span>
                                </motion.div>

                                <div className="space-y-2">
                                    <h2 id="unboxing-title" className="text-xl font-black uppercase tracking-wider text-white leading-tight">{prizeName}</h2>
                                    <p className="text-xs text-white/50">{t('added_to_inventory')}</p>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    onClick={onClose}
                                    className="px-8 py-3 rounded-full text-black text-xs font-black uppercase tracking-widest shadow-premium cursor-pointer flex items-center gap-2"
                                    style={{ background: `linear-gradient(90deg, ${cfg.theme.accent}, ${cfg.theme.glow})` }}
                                >
                                    <FiCheck size={14} />
                                    {t('awesome')}
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
