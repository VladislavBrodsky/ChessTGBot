'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserPlus, FaCopy, FaShareAlt, FaCheck } from 'react-icons/fa';

interface ReferralSectionProps {
    referralCode: string;
}

export default function ReferralSection({ referralCode }: ReferralSectionProps) {
    const [copied, setCopied] = useState(false);
    const botUsername = "FinChessBot"; // Replace with your actual bot username
    const inviteLink = `https://t.me/${botUsername}?start=${referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    };

    const handleShare = () => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const text = "Connect to the Neural Matrix and play Move-to-Earn Chess with me! 🚀💻";
            (window as any).Telegram.WebApp.switchInlineQuery(inviteLink, ["users", "groups", "channels"]);
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col items-center space-y-2 mb-2">
                <h3 className="text-xs font-black text-brand-primary italic tracking-tighter uppercase leading-none">Node Recruitment</h3>
                <div className="h-px w-6 bg-brand-primary/20" />
            </div>

            <div className="glass-panel p-5 rounded-3xl border-brand-primary/10 bg-brand-primary/5 relative overflow-hidden group">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaUserPlus size={40} className="text-brand-primary" />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">Referral Protocol</span>
                        <p className="text-[9px] text-brand-primary/40 font-bold uppercase leading-relaxed max-w-[80%]">
                            Expand the neural network. Earn 50 XP and 10% Boost for every node synchronized via your code.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-brand-primary/10 border border-brand-primary/5 rounded-2xl py-3 px-4 flex items-center justify-between">
                            <span className="text-[10px] font-black text-brand-primary/80 tracking-widest uppercase">
                                {referralCode || "MATRIX-CORE"}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="text-brand-primary hover:text-brand-primary/70 transition-colors"
                            >
                                {copied ? <FaCheck size={12} className="text-emerald-500" /> : <FaCopy size={12} />}
                            </button>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleShare}
                            className="bg-brand-primary text-brand-void p-3 rounded-2xl flex items-center justify-center shadow-premium"
                        >
                            <FaShareAlt size={14} />
                        </motion.button>
                    </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-4 pt-4 border-t border-brand-primary/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-brand-primary/20 uppercase tracking-widest">Nodes Recruited</span>
                        <span className="text-[12px] font-black text-brand-primary italic">0.00</span>
                    </div>
                    <div className="text-right flex flex-col">
                        <span className="text-[8px] font-black text-brand-primary/20 uppercase tracking-widest">Active Multiplier</span>
                        <span className="text-[10px] font-black text-brand-primary tracking-tighter">1.0X ALPHA</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
