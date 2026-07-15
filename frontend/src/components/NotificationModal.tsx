'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBookOpen, FiClock, FiCheckCircle, FiInfo } from 'react-icons/fi';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
    const [activeTab, setActiveTab] = useState<'news' | 'guide'>('guide');

    const newsItems = [
        {
            id: 1,
            title: "Web3 Marketplace Launch",
            date: "July 15, 2026",
            excerpt: "The long-awaited Marketplace is finally here. Exchange your hard-earned XR for Mystery Boxes, Premium upgrades, and exclusive profile styles.",
            readTime: "2 min read"
        },
        {
            id: 2,
            title: "Season 1 Arena Commences",
            date: "July 12, 2026",
            excerpt: "Step into the arena, challenge opponents, and climb the leaderboard. Top players at the end of the season will receive exclusive token airdrops.",
            readTime: "3 min read"
        }
    ];

    const guideSteps = [
        {
            step: "01",
            title: "Connect Your Wallet",
            desc: "Use TON Connect in the profile tab to link your non-custodial wallet and secure your assets."
        },
        {
            step: "02",
            title: "Earn XR Tokens",
            desc: "Play chess matches, complete daily quests, and participate in tournaments to accumulate XR."
        },
        {
            step: "03",
            title: "Unlock Mystery Boxes",
            desc: "Spend your XR in the marketplace to open Mystery Boxes. Tiers range from Common to Legendary, with rare drops including 1-year Premium memberships."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4 }}
                        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-brand-surface/90 border border-brand-border-opacity-10 shadow-premium p-6 text-brand-primary"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold uppercase tracking-wider text-white">Updates & Info</h2>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                            >
                                <FiX size={16} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-brand-border-opacity-5 mb-6">
                            <button 
                                onClick={() => setActiveTab('guide')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                    activeTab === 'guide' 
                                        ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                                        : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                                <FiBookOpen size={14} />
                                How to Start
                            </button>
                            <button 
                                onClick={() => setActiveTab('news')}
                                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                                    activeTab === 'news' 
                                        ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                                        : 'text-white/40 hover:text-white/60'
                                }`}
                            >
                                <FiInfo size={14} />
                                What's New
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="min-h-[260px] max-h-[360px] overflow-y-auto pr-1">
                            {activeTab === 'guide' ? (
                                <div className="space-y-4">
                                    {guideSteps.map((step, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                                            <div className="text-xl font-black text-white/30 tracking-tight">
                                                {step.step}
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-bold text-white">{step.title}</h3>
                                                <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {newsItems.map((item) => (
                                        <div key={item.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-2 hover:border-white/[0.08] transition-colors cursor-pointer">
                                            <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wider">
                                                <span>{item.date}</span>
                                                <span className="flex items-center gap-1">
                                                    <FiClock size={10} />
                                                    {item.readTime}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-white">{item.title}</h3>
                                            <p className="text-xs text-white/50 leading-relaxed">{item.excerpt}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
