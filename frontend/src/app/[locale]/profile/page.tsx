'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaTrophy, FaChessKing, FaChessPawn, FaChartLine } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralCard from "@/components/ReferralCard";

export default function ProfilePage() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();

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
 {(stats?.photo_url || tgUser?.photo_url) ? (
 <img src={stats?.photo_url || tgUser.photo_url} alt="Profile" className="w-full h-full object-cover" />
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
 {stats ? `${stats.first_name} ${stats.last_name || ""}`.trim() : (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : "Combatant")}
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

 {/* Recent Games History */}
 <div className="w-full space-y-4">
   <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">{t('recent_activity')}</h2>
   
   {stats?.recent_games && stats.recent_games.length > 0 ? (
     <div className="flex flex-col gap-3">
       {stats.recent_games.map((game: any) => {
         const isWin = game.result === 'win';
         const isLoss = game.result === 'loss';
         const badgeColor = isWin 
           ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" 
           : isLoss 
             ? "border-red-500/20 bg-red-500/10 text-red-400" 
             : "border-brand-primary/20 bg-brand-primary/10 text-brand-primary opacity-60";
         
         return (
           <motion.div
             key={game.game_id}
             whileHover={{ scale: 1.01 }}
             whileTap={{ scale: 0.99 }}
             onClick={() => router.push(`/${locale}/game/review/${game.game_id}`)}
             className="glass-panel p-4 rounded-xl border border-brand-border-opacity-10 bg-brand-surface flex justify-between items-center cursor-pointer hover:border-brand-primary/20 transition-all"
           >
             <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center">
                 <FaChessPawn className="text-brand-primary opacity-40" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-bold text-brand-primary uppercase tracking-tight">
                   vs {game.opponent?.name || "AI Engine"}
                 </span>
                 <span className="text-[9px] font-medium text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                   Opponent ELO: {game.opponent?.elo || 1000}
                 </span>
               </div>
             </div>
             
             <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                 <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${badgeColor}`}>
                   {game.result}
                 </span>
                 <span className="text-[9px] font-black text-brand-primary mt-1">
                   {game.elo_change >= 0 ? `+${game.elo_change}` : game.elo_change} ELO
                 </span>
               </div>
               <span className="text-brand-primary opacity-30 text-xs">▶</span>
             </div>
           </motion.div>
         );
       })}
     </div>
   ) : (
     <div className="glass-panel p-6 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-center">
       <span className="text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest block mb-1">
         No games logged
       </span>
       <span className="text-[10px] font-medium text-brand-primary opacity-20 uppercase tracking-widest">
         Initiate combat to update history
       </span>
     </div>
   )}
 </div>

 </div>
 </LayoutWrapper>
 );
}
