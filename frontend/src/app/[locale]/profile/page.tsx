'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { FaTrophy, FaChessKing, FaChessPawn, FaChartLine } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralCard from "@/components/ReferralCard";

export default function ProfilePage() {
    const t = useTranslations('Index');

    // Mock user
    const user = {
        name: "GrandMaster",
        level: 5,
        xp: 850,
        rank: "Neural Knight",
        elo: 1450
    };

    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto space-y-8">

                {/* Profile Header */}
                <div className="w-full flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-full bg-brand-surface border-2 border-brand-primary/20 flex items-center justify-center mb-4 relative">
                        <FaChessKing className="text-4xl text-brand-primary/40" />
                        <div className="absolute -bottom-2 px-3 py-1 rounded-full bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-widest">
                            {user.rank}
                        </div>
                    </div>
                    <h1 className="text-2xl font-black text-brand-primary italic tracking-tighter uppercase mb-1">{user.name}</h1>
                    <div className="mb-6 w-full max-w-[200px]">
                        <XPProgressBar xp={user.xp} level={user.level} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-2 gap-3">
                    <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-primary/5">
                        <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mb-1">{t('elo')}</span>
                        <span className="text-2xl font-black text-brand-primary">{user.elo}</span>
                    </div>
                    <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-primary/5">
                        <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest mb-1">{t('win_rate')}</span>
                        <span className="text-2xl font-black text-brand-primary">58%</span>
                    </div>
                </div>

                {/* Gamification Sections */}
                <DailyTasks />
                <ReferralCard />

            </div>
        </LayoutWrapper>
    );
}
