'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FaTrophy, FaChessKing, FaChessPawn, FaChartLine } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralCard from "@/components/ReferralCard";

export default function ProfilePage() {
    const t = useTranslations('Index');

    const [tgUser, setTgUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            const user = tg.initDataUnsafe?.user;
            setTgUser(user);

            if (user?.id) {
                fetch(`/api/v1/users/sync`, {
                    method: "POST",
                    headers: {
                        'X-Telegram-Init-Data': (tg as any).initData || ""
                    }
                })
                    .then(res => res.json())
                    .then(data => setStats(data))
                    .catch(err => console.error("Failed to fetch Stats", err));
            }
        } else {
            // Mock for dev
            setTgUser({ first_name: "Grand", last_name: "Master", photo_url: null });
            setStats({ elo: 1450, xp: 850, level: 5, win_rate: 58 });
        }
    }, []);

    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto space-y-8">

                {/* Profile Header */}
                <div className="w-full flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-brand-surface border-2 border-brand-primary/20 flex items-center justify-center mb-4 relative overflow-hidden">
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <FaChessKing className="text-4xl text-brand-primary/40" />
                        )}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                            {stats?.elo > 1500 ? "GrandMaster" : "Neural Knight"}
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-brand-primary italic tracking-tighter uppercase mb-1">
                        {tgUser?.first_name} {tgUser?.last_name || ""}
                    </h1>
                    <div className="mb-6 w-full max-w-[200px]">
                        <XPProgressBar xp={stats?.xp || 0} level={stats?.level || 1} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-primary/5">
                        <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mb-1">{t('elo')}</span>
                        <span className="text-2xl font-black text-brand-primary">{stats?.elo || 1000}</span>
                    </div>
                    <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-primary/5">
                        <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mb-1">{t('win_rate')}</span>
                        <span className="text-2xl font-black text-brand-primary">{stats?.win_rate?.toFixed(0) || 0}%</span>
                    </div>
                </div>

                {/* Gamification Sections */}
                <DailyTasks />
                <ReferralCard />

            </div>
        </LayoutWrapper>
    );
}
