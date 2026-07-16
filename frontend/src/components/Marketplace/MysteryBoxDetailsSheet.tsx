'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiLock, FiX } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';
import { DROP_KIND_COLOR, BOX_CONFIG, type BoxTier } from './boxConfig';

interface MysteryBoxDetailsSheetProps {
    tier: BoxTier;
    userXP: number;
    disabled?: boolean;
    onClose: () => void;
    onUnbox: () => void;
}

export default function MysteryBoxDetailsSheet({
    tier,
    userXP,
    disabled,
    onClose,
    onUnbox,
}: MysteryBoxDetailsSheetProps) {
    useNavbarHideWhileMounted();
    const t = useTranslations('Marketplace');
    const dialogRef = useRef<HTMLDivElement>(null);
    const cfg = BOX_CONFIG[tier];
    const affordable = userXP >= cfg.costXP;
    const shortfall = cfg.costXP - userXP;
    const locked = disabled || !affordable;

    useEffect(() => {
        dialogRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled])'
            ));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    const content = (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm">
            <button
                type="button"
                aria-label={t('back')}
                className="absolute inset-0 cursor-default"
                onClick={onClose}
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`box-details-title-${tier}`}
                tabIndex={-1}
                className="relative z-10 w-full max-w-md rounded-3xl border border-brand-border-opacity-20 bg-brand-surface p-5 pb-[calc(20px+var(--app-safe-bottom))] shadow-premium"
            >
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-brand-border-opacity-20" />
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: cfg.theme.accent }}>
                            {cfg.metal} · {cfg.piece}
                        </p>
                        <h2 id={`box-details-title-${tier}`} className="mt-1 text-xl font-black text-brand-primary">
                            {cfg.name}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-brand-muted">{cfg.tagline}</p>
                    </div>
                    <button
                        type="button"
                        aria-label={t('back')}
                        onClick={onClose}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-border-opacity-10 text-brand-muted transition-colors hover:text-brand-primary"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <div className="mt-5 rounded-2xl border border-brand-border-opacity-10 bg-brand-void/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-primary">
                            {t('whats_inside')}
                        </h3>
                        <span className="text-[10px] font-black tabular-nums text-brand-gold">{cfg.costXP.toLocaleString()} XP</span>
                    </div>
                    <ul className="mt-3 space-y-2.5">
                        {cfg.drops.map((drop) => (
                            <li key={drop.label} className="flex items-center justify-between gap-4 text-sm">
                                <span className="flex min-w-0 items-center gap-2 text-brand-muted">
                                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DROP_KIND_COLOR[drop.kind] }} />
                                    <span>{drop.label}</span>
                                </span>
                                <span className="shrink-0 font-black tabular-nums text-brand-primary">{drop.chance}%</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                        onClose();
                        onUnbox();
                    }}
                    className={`mt-4 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black uppercase tracking-[0.12em] transition-all ${
                        locked
                            ? 'cursor-not-allowed border border-brand-border-opacity-10 bg-brand-bg-opacity-5 text-brand-muted'
                            : 'bg-brand-gold text-brand-void active:scale-[0.98]'
                    }`}
                >
                    {locked && <FiLock size={14} />}
                    {disabled ? t('unavailable') : affordable ? `${t('unbox')} · ${cfg.costXP.toLocaleString()} XP` : t('need_more_xp', { amount: shortfall.toLocaleString() })}
                </button>
            </div>
        </div>
    );

    return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
