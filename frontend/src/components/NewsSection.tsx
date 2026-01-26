'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaNewspaper, FaClock, FaChevronDown } from 'react-icons/fa';

const NEWS_ITEMS = [
    {
        id: 1,
        tag: "SYSTEM",
        title: "Neural Matrix v1.5 Deployed",
        desc: "New matchmaking protocols are now active. Experience faster pairings and lower latency.",
        fullText: "Our core engineers have successfully optimized the Neural Matrix synchronization protocol. This brings a 40% reduction in matchmaking latency and improved game state stability across across high-ping neural links.",
        date: "2h ago"
    },
    {
        id: 2,
        tag: "ECONOMY",
        title: "Play to Earn is Live!",
        desc: "Premium users can now earn rewards in every official match. Invite friends to boost earnings.",
        fullText: "The decentralized prize pool is now open. Official matches between Premium members now contribute to a global reward matrix. Win games to claim your share of the daily rewards distribution.",
        date: "1d ago"
    }
];

export default function NewsSection() {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);

        // Haptic feedback if available (simulated here for consistency)
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <FaNewspaper className="text-brand-primary/40" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary/40">Latest Updates</h3>
                </div>
                <div className="h-px flex-1 bg-brand-primary/5 mx-4" />
            </div>

            <div className="space-y-3">
                {NEWS_ITEMS.map((item, idx) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => toggleExpand(item.id)}
                            className={`glass-panel p-4 group hover:bg-brand-primary/5 transition-all cursor-pointer overflow-hidden ${isExpanded ? 'bg-brand-primary/5 ring-1 ring-brand-primary/20' : ''}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="px-2 py-0.5 rounded-md bg-brand-primary/10 text-[8px] font-black text-brand-primary tracking-widest">
                                    {item.tag}
                                </span>
                                <div className="flex items-center gap-1.5 text-[8px] font-bold text-brand-primary/30 uppercase">
                                    <FaClock />
                                    {item.date}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <h4 className={`text-sm font-black text-brand-primary/90 transition-colors ${isExpanded ? 'text-brand-primary' : 'group-hover:text-brand-primary'}`}>
                                    {item.title}
                                </h4>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 180 : 0 }}
                                    className="text-brand-primary/20"
                                >
                                    <FaChevronDown fontSize={12} />
                                </motion.div>
                            </div>

                            <p className="text-[10px] font-medium text-brand-primary/40 leading-relaxed mt-1">
                                {item.desc}
                            </p>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-4 pt-4 border-t border-brand-primary/5"
                                    >
                                        <p className="text-[10px] font-medium text-brand-primary/70 leading-relaxed">
                                            {item.fullText}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <div className="h-0.5 w-8 bg-brand-primary rounded-full" />
                                            <div className="h-0.5 w-2 bg-brand-primary/30 rounded-full" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
