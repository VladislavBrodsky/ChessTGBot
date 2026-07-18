'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBookOpen, FiClock, FiInfo } from 'react-icons/fi';
import { useNavbar } from '@/context/NavbarContext';
import { useDialogAccessibility } from '@/hooks/useDialogAccessibility';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
    const [activeTab, setActiveTab] = useState<'news' | 'guide'>('guide');
    const { pushHide, popHide } = useNavbar();
    const dialogRef = useDialogAccessibility(isOpen, onClose);

    useEffect(() => {
        if (!isOpen) return;
        pushHide();
        return () => popHide();
    }, [isOpen, popHide, pushHide]);

    const newsItems = [
        {
            id: 1,
            title: "Marketplace vaults",
            date: "July 15, 2026",
            excerpt: "Spend XP on mystery vaults, premium upgrades, and board themes. Review reward odds before opening a vault.",
            readTime: "2 min read"
        },
        {
            id: 2,
            title: "Arena season is live",
            date: "July 12, 2026",
            excerpt: "Step into the arena, challenge opponents, and climb the leaderboard. Top players at the end of the season will receive exclusive token airdrops.",
            readTime: "3 min read"
        }
    ];

    const guideSteps = [
        {
            step: "01",
            title: "Connect Your Wallet",
            desc: "Use your profile to link a non-custodial wallet when you want to fund a paid match."
        },
        {
            step: "02",
            title: "Earn XP",
            desc: "Play chess, complete daily quests, and finish Academy lessons to grow your XP."
        },
        {
            step: "03",
            title: "Unlock Mystery Boxes",
            desc: "Spend XP in the Marketplace to open vaults. Each vault shows its rewards and odds before you commit."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="notification-modal-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[var(--color-brand-overlay)] backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        ref={dialogRef}
                        tabIndex={-1}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className="relative max-h-[min(760px,calc(100dvh-32px-var(--app-safe-bottom)))] w-full max-w-md overflow-hidden rounded-3xl border border-brand-border bg-brand-surface p-5 text-brand-primary shadow-[var(--shadow-premium)] outline-none sm:p-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="notification-modal-title" className="text-xl font-bold uppercase tracking-wider text-brand-primary">Updates & Info</h2>
                            <button 
                                onClick={onClose}
                                aria-label="Close updates"
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-brand-border-opacity-10 text-brand-muted transition-colors hover:text-brand-primary"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="mb-5 flex gap-2 rounded-2xl border border-brand-border bg-brand-elevated/70 p-1.5 shadow-inner" role="tablist" aria-label="Notification content">
                            <button 
                                onClick={() => setActiveTab('guide')}
                                role="tab"
                                aria-selected={activeTab === 'guide'}
                                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === 'guide' 
                                        ? 'border border-brand-border bg-brand-surface text-brand-primary shadow-sm'
                                        : 'text-brand-muted hover:text-brand-primary'
                                }`}
                            >
                                <FiBookOpen size={14} />
                                How to Start
                            </button>
                            <button 
                                onClick={() => setActiveTab('news')}
                                role="tab"
                                aria-selected={activeTab === 'news'}
                                className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                                    activeTab === 'news' 
                                        ? 'border border-brand-border bg-brand-surface text-brand-primary shadow-sm'
                                        : 'text-brand-muted hover:text-brand-primary'
                                }`}
                            >
                                <FiInfo size={14} />
                                What's New
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="max-h-[calc(100dvh-260px-var(--app-safe-bottom))] min-h-[260px] overflow-y-auto overflow-x-hidden pr-1">
                            <AnimatePresence mode="wait">
                                {activeTab === 'guide' ? (
                                    <motion.div 
                                        key="guide"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {guideSteps.map((step, idx) => (
                                            <div key={idx} className="flex gap-4 rounded-2xl border border-brand-border bg-brand-elevated p-4 shadow-sm">
                                                <div className="text-xl font-black tracking-tight text-purple-500">
                                                    {step.step}
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-sm font-bold text-brand-primary">{step.title}</h3>
                                                    <p className="text-xs text-brand-muted leading-relaxed">{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="news"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-4"
                                    >
                                        {newsItems.map((item) => (
                                            <div key={item.id} className="space-y-2 rounded-2xl border border-brand-border bg-brand-elevated p-4 shadow-sm transition-colors hover:border-brand-border">
                                                <div className="flex items-center justify-between text-[10px] text-brand-muted uppercase tracking-wider">
                                                    <span>{item.date}</span>
                                                    <span className="flex items-center gap-1">
                                                        <FiClock size={10} />
                                                        {item.readTime}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-brand-primary">{item.title}</h3>
                                                <p className="text-xs text-brand-muted leading-relaxed">{item.excerpt}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
