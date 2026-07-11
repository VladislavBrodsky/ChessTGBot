'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCopy, FaUserPlus, FaCheck } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';

interface ReferralCardProps {
    referralCode?: string;
    onInteraction?: () => void;
}

export default function ReferralCard({ referralCode, onInteraction }: ReferralCardProps) {
    const t = useTranslations('Gamification');
    const [userCode, setUserCode] = useState(referralCode || "");
    const [botUsername, setBotUsername] = useState("FinChess_bot");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        apiFetch("/api/v1/users/sync", { method: "POST" })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.referral_code && !referralCode) {
                        setUserCode(data.referral_code);
                    }
                    if (data.bot_username) {
                        setBotUsername(data.bot_username);
                    }
                }
            })
            .catch(err => console.error("Failed to fetch referral code in ReferralCard:", err));

        if (referralCode) {
            setUserCode(referralCode);
        }
    }, [referralCode]);

    const displayCode = userCode || "MATRIX-CORE";
    const inviteLink = `https://t.me/${botUsername}/app?startapp=ref_${displayCode}`;

    const handleCopy = () => {
        copyToClipboard(inviteLink).then((ok) => {
            if (!ok) return;
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
        if (onInteraction) {
            onInteraction();
        }
    };

    const handleInvite = () => {
        const text = encodeURIComponent("Join me in FinChess! ♟️🚀");
        const url = encodeURIComponent(inviteLink);
        window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
        if (onInteraction) {
            onInteraction();
        }
    };

    return (
        <div className="w-full glass-panel p-5 rounded-2xl border-brand-border-opacity-10 bg-brand-surface space-y-4 shadow-sm relative overflow-hidden">
            {/* Visual background gradient glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />

            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
                    <FaUserPlus className="text-base" />
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                    <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight leading-none">
                        {t('referral_program')}
                    </h3>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider leading-none">
                        🎁 Earn 15% Lifetime Commissions + 50 XP
                    </span>
                    <p className="text-[10px] font-bold text-brand-primary opacity-50 leading-relaxed pt-0.5">
                        {t('referral_desc')}
                    </p>
                </div>
            </div>

            <div className="flex items-stretch gap-2 w-full pt-1">
                <div className="flex-1 bg-brand-void/40 border border-brand-border-opacity-15 rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-sm min-w-0">
                    <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1">YOUR CODE</span>
                        <span className="font-mono font-black text-brand-primary tracking-widest text-xs truncate leading-none">{displayCode}</span>
                    </div>
                    <button
                        onClick={handleCopy}
                        className="text-brand-primary opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex items-center gap-1 shrink-0 ml-2"
                    >
                        <span className="text-[10px] font-black uppercase tracking-wider">{copied ? t('copied') : t('copy_code')}</span>
                        {copied ? <FaCheck className="text-green-400 text-xs" /> : <FaCopy className="text-xs" />}
                    </button>
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInvite}
                    className="w-12 rounded-xl bg-brand-primary text-brand-void flex items-center justify-center text-lg shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Send Invite Link"
                >
                    <FaUserPlus />
                </motion.button>
            </div>
        </div>
    );
}
