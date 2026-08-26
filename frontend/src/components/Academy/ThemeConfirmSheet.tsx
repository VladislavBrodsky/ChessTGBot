'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPalette, FaGem, FaTimes } from 'react-icons/fa';
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';

interface ThemeConfirmSheetProps {
    isOpen: boolean;
    themeName: string;
    themeDescription?: string;
    priceXP: number;
    userXP: number;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ThemeConfirmSheet({
    isOpen,
    themeName,
    themeDescription,
    priceXP,
    userXP,
    loading = false,
    onConfirm,
    onCancel,
}: ThemeConfirmSheetProps) {
    useNavbarHideWhileMounted(isOpen);

    if (!isOpen) return null;

    const content = (
        <AnimatePresence>
            <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={loading ? undefined : onCancel}
                    className="absolute inset-0 bg-brand-overlay/80 backdrop-blur-md"
                />

                {/* Sheet Container */}
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                    className="relative w-full max-w-md bg-brand-surface border-t sm:border border-brand-border-opacity-20 rounded-t-[32px] sm:rounded-[32px] p-6 text-center shadow-2xl overflow-hidden pointer-events-auto pb-[max(1.5rem,var(--app-safe-bottom))]"
                >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,transparent_70%)] rounded-full pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-elevated border border-brand-border-opacity-10 flex items-center justify-center text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                    >
                        <FaTimes size={14} />
                    </button>

                    {/* Icon Artwork */}
                    <div className="relative mx-auto mt-2 mb-4 w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.25)]">
                        <FaPalette size={32} className="drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
                    </div>

                    {/* Title */}
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 block mb-1">
                        UNLOCK THEME
                    </span>
                    <h3 className="text-xl font-black uppercase text-brand-primary tracking-tight">
                        {themeName}
                    </h3>
                    {themeDescription && (
                        <p className="mt-1.5 text-xs font-medium text-brand-muted max-w-xs mx-auto">
                            {themeDescription}
                        </p>
                    )}

                    {/* Cost vs. Balance Card */}
                    <div className="mt-5 p-4 rounded-2xl bg-brand-elevated border border-brand-border-opacity-10 grid grid-cols-2 gap-3 text-left">
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-wider text-brand-muted block">
                                UNLOCK COST
                            </span>
                            <span className="text-base font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                                <FaGem size={13} /> {priceXP.toLocaleString()} XP
                            </span>
                        </div>
                        <div className="border-l border-brand-border-opacity-10 pl-3">
                            <span className="text-[9px] font-black uppercase tracking-wider text-brand-muted block">
                                YOUR BALANCE
                            </span>
                            <span className="text-base font-black text-brand-primary flex items-center gap-1.5 mt-0.5">
                                {userXP.toLocaleString()} XP
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-2.5">
                        <button
                            onClick={onConfirm}
                            disabled={loading || userXP < priceXP}
                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            ) : (
                                `CONFIRM UNLOCK (${priceXP.toLocaleString()} XP)`
                            )}
                        </button>

                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                        >
                            CANCEL
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return typeof document !== 'undefined' ? createPortal(content, document.body) : null;
}
