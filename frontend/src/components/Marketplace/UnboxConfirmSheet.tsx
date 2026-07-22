'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FiX, FiCheck } from 'react-icons/fi';
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';
import MysteryBoxArt from './MysteryBoxArt';
import { BOX_CONFIG, type BoxTier } from './boxConfig';

interface UnboxConfirmSheetProps {
    isOpen: boolean;
    tier: BoxTier | null;
    userXP: number;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function UnboxConfirmSheet({
    isOpen,
    tier,
    userXP,
    loading = false,
    onConfirm,
    onCancel,
}: UnboxConfirmSheetProps) {
    useNavbarHideWhileMounted();
    const t = useTranslations('Marketplace');
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        dialogRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen || !tier) return null;

    const cfg = BOX_CONFIG[tier];
    const { accent, rgb, glow } = cfg.theme;
    const affordable = userXP >= cfg.costXP;

    const content = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[var(--color-brand-overlay)] p-4 backdrop-blur-md">
                    {/* Backdrop tap to close */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 cursor-default"
                        onClick={onCancel}
                    />

                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`unbox-confirm-title-${tier}`}
                        tabIndex={-1}
                        initial={{ y: 40, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 40, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative z-10 w-full max-w-sm rounded-[28px] border border-brand-border-opacity-20 bg-brand-surface p-6 pb-[calc(1.5rem+var(--app-safe-bottom))] shadow-[0_24px_60px_rgba(0,0,0,0.8)] text-center overflow-hidden"
                    >
                        {/* Ambient Glow */}
                        <div
                            className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20"
                            style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
                        />

                        {/* Top Handle */}
                        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-brand-border-opacity-20" />

                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                                className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.18em] border"
                                style={{ color: accent, background: `rgba(${rgb},0.1)`, borderColor: `rgba(${rgb},0.3)` }}
                            >
                                {cfg.metal} · {cfg.piece} {cfg.glyph}
                            </span>
                            <button
                                type="button"
                                aria-label={t('back')}
                                onClick={onCancel}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Mystery Box Artwork */}
                        <div className="relative my-3 h-32 flex items-center justify-center">
                            <MysteryBoxArt tier={tier} />
                        </div>

                        {/* Title & Tagline */}
                        <h2 id={`unbox-confirm-title-${tier}`} className="text-xl font-black uppercase tracking-tight text-brand-primary">
                            {cfg.name}
                        </h2>
                        <p className="mt-1 text-xs text-brand-muted font-medium">{cfg.tagline}</p>

                        {/* Price vs Balance Card */}
                        <div className="my-5 rounded-2xl border border-brand-border-opacity-10 bg-brand-void/60 p-3.5 flex items-center justify-between text-left">
                            <div>
                                <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-brand-muted">
                                    {t('xp_balance')}
                                </span>
                                <span className="block text-sm font-black text-amber-400 tabular-nums">
                                    {userXP.toLocaleString()} XP
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] font-black uppercase tracking-[0.16em] text-brand-muted">
                                    {t('cost')}
                                </span>
                                <span className="block text-sm font-black tabular-nums" style={{ color: accent }}>
                                    {cfg.costXP.toLocaleString()} XP
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="py-3.5 rounded-xl border border-brand-border-opacity-20 bg-brand-void/50 text-brand-muted hover:text-brand-primary text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
                            >
                                {t('back')}
                            </button>
                            <button
                                type="button"
                                disabled={!affordable || loading}
                                onClick={onConfirm}
                                className="py-3.5 rounded-xl text-slate-950 text-xs font-black uppercase tracking-widest shadow-premium cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: affordable
                                        ? `linear-gradient(135deg, ${accent}, ${cfg.theme.accent2 || accent})`
                                        : 'var(--color-brand-border-opacity-10)',
                                }}
                            >
                                <FiCheck size={14} />
                                {loading ? t('unboxing') : t('confirm')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
