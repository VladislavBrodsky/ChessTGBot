'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCrown, FaTimes, FaCheck } from 'react-icons/fa';
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';

interface VIPConfirmSheetProps {
    isOpen: boolean;
    title: string;
    description: string;
    costText: string;
    balanceText?: string;
    perks?: string[];
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function VIPConfirmSheet({
    isOpen,
    title,
    description,
    costText,
    perks = ['Unlimited Engine Analysis', 'Exclusive Board Themes', 'Priority Matchmaking', 'Daily XP Multipliers'],
    loading = false,
    onConfirm,
    onCancel,
}: VIPConfirmSheetProps) {
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
                    className="relative w-full max-w-md bg-brand-surface border-t sm:border border-purple-500/30 rounded-t-[32px] sm:rounded-[32px] p-6 text-center shadow-2xl overflow-hidden pointer-events-auto pb-[max(1.5rem,var(--app-safe-bottom))]"
                >
                    {/* Ambient Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-elevated border border-brand-border-opacity-10 flex items-center justify-center text-brand-muted hover:text-brand-primary transition-colors cursor-pointer"
                    >
                        <FaTimes size={14} />
                    </button>

                    {/* Icon Crown Artwork */}
                    <div className="relative mx-auto mt-2 mb-3 w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_35px_rgba(168,85,247,0.3)]">
                        <FaCrown size={36} className="drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]" />
                    </div>

                    {/* Title */}
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 block mb-1">
                        VIP MEMBERSHIP PASS
                    </span>
                    <h3 className="text-xl font-black uppercase text-brand-primary tracking-tight">
                        {title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-brand-muted max-w-xs mx-auto">
                        {description}
                    </p>

                    {/* Perks List */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-brand-elevated border border-brand-border-opacity-10 text-left space-y-2">
                        {perks.map((perk, i) => (
                            <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-brand-primary">
                                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                                    <FaCheck size={9} />
                                </div>
                                <span className="truncate">{perk}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing Summary */}
                    <div className="mt-4 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                            PAYMENT AMOUNT
                        </span>
                        <span className="text-base font-black text-brand-primary">
                            {costText}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex flex-col gap-2.5">
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs bg-purple-500 hover:bg-purple-600 text-white shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {loading ? (
                                <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                            ) : (
                                `CONFIRM UPGRADE`
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
