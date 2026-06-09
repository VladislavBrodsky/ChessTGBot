'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useTranslations } from 'next-intl';
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
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
 apiFetch(`/api/v1/users/sync`, {
 method: "POST"
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
 <div className="relative mb-4">
 {/* Outer rotating/pulsing ring */}
 <div className="absolute inset-0 rounded-full border border-brand-primary opacity-10 animate-pulse scale-105" />
 <div className="w-24 h-24 rounded-full bg-brand-surface border border-brand-border-opacity-20 flex items-center justify-center relative overflow-hidden shadow-premium">
 {tgUser?.photo_url ? (
 <img src={tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <FaChessKing className="text-4xl text-brand-primary opacity-40" />
 )}
 </div>
 {/* Premium overlay badge */}
 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-brand-border-opacity-20 bg-brand-surface text-brand-primary text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm">
 👑 {stats?.elo > 1500 ? t('grandmaster') : t('neural_knight')}
 </div>
 </div>
 <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1">
 {tgUser?.first_name} {tgUser?.last_name || ""}
 </h1>
 <div className="mb-6 w-full max-w-[200px]">
 <XPProgressBar xp={stats?.xp || 0} level={stats?.level || 1} />
 </div>
 </div>

 {/* Stats Grid */}
 <div className="w-full grid grid-cols-2 gap-3">
 <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface">
 <span className="text-[9px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1.5">{t('elo')}</span>
 <div className="flex items-baseline space-x-1.5">
 <span className="text-2xl font-black text-brand-primary">{stats?.elo || 1000}</span>
 <span className="text-[9px] font-bold text-brand-primary opacity-60 flex items-center gap-0.5">
 <FaChartLine className="text-[8px]" /> +24
 </span>
 </div>
 </div>
 <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface">
 <span className="text-[9px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1.5">{t('win_rate')}</span>
 <div className="flex items-baseline space-x-1.5">
 <span className="text-2xl font-black text-brand-primary">{stats?.win_rate?.toFixed(0) || 0}%</span>
 <span className="text-[9px] font-bold text-brand-primary opacity-60 flex items-center gap-0.5">
 ▲ 1.2%
 </span>
 </div>
 </div>
 </div>

 {/* Gamification Sections */}
 <DailyTasks />
 <ReferralCard />

 </div>
 </LayoutWrapper>
 );
}
