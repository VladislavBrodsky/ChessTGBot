'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaUserPlus, FaCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

interface ReferralCardProps {
    referralCode?: string;
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
    const t = useTranslations('Gamification');
    const [userCode, setUserCode] = useState(referralCode || "");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (referralCode) {
            setUserCode(referralCode);
        } else {
            // Fetch profile stats to get the real referral code
            apiFetch("/api/v1/users/sync", { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    if (data && data.referral_code) {
                        setUserCode(data.referral_code);
                    }
                })
                .catch(err => console.error("Failed to fetch referral code in ReferralCard:", err));
        }
    }, [referralCode]);

    const displayCode = userCode || "KING-8292";
    const inviteLink = `https://t.me/FinChess_bot/app?startapp=ref_${displayCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleInvite = () => {
        const text = encodeURIComponent("Join me in FinChess! ♟️🚀");
        const url = encodeURIComponent(inviteLink);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
    };

    return (
        <div className="w-full glass-panel p-5 rounded-2xl border-brand-border-opacity-10 bg-brand-surface space-y-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-brand-bg-opacity-10 flex items-center justify-center text-brand-primary">
                    <FaUserPlus />
                </div>
                <div>
                    <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight leading-none mb-1">
                        {t('referral_program')}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
                        {t('invite_friend')} • +50 XP
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 bg-brand-surface border border-brand-border-opacity-10 rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                    <span className="font-mono font-bold text-brand-primary tracking-widest text-sm">{displayCode}</span>
                    <button
                        onClick={handleCopy}
                        className="text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center space-x-1"
                    >
                        <span className="text-[9px] font-black uppercase tracking-wider opacity-60">{copied ? t('copied') : t('copy_code')}</span>
                        {copied ? <FaCheck className="text-green-400 text-xs" /> : <FaCopy className="text-xs" />}
                    </button>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInvite}
                    className="h-full aspect-square bg-brand-primary text-brand-void rounded-xl flex items-center justify-center text-lg shadow-sm cursor-pointer"
                >
                    <FaUserPlus />
                </motion.button>
            </div>
        </div>
    );
}
