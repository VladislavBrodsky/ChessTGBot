'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaUserPlus, FaCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export default function ReferralCard() {
    const t = useTranslations('Gamification');
    // Mock user data for now
    const userCode = "KING-8292";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://t.me/MyChessBot?start=ref_${userCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = () => {
        const text = encodeURIComponent("Join me in Neural Chess! ♟️🚀");
        const url = encodeURIComponent(`https://t.me/MyChessBot?start=ref_${userCode}`);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    };

    return (
        <div className="w-full glass-panel p-5 rounded-2xl border-brand-primary/5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <FaUserPlus />
                </div>
                <div>
                    <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight leading-none mb-1">
                        {t('referral_program')}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest">
                        {t('invite_friend')} • +50 XP
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 bg-brand-surface border border-brand-primary/10 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-primary tracking-widest text-sm">{userCode}</span>
                    <button
                        onClick={handleCopy}
                        className="text-brand-primary/60 hover:text-brand-primary transition-colors"
                    >
                        {copied ? <FaCheck className="text-green-400" /> : <FaCopy />}
                    </button>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInvite}
                    className="h-full aspect-square bg-brand-primary text-brand-void rounded-xl flex items-center justify-center text-lg shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                    <FaUserPlus />
                </motion.button>
            </div>
        </div>
    );
}
