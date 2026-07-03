'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch, getFullPhotoUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaTrophy, FaChessKing, FaChessPawn, FaChartLine } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralDashboard from "@/components/ReferralDashboard";

export default function ProfilePage() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();

 // Dynamic locales mapping for Chess.com-style metric parameters
 const localizedLabels: Record<string, Record<string, string>> = {
   en: { global_rank: "Global Rank", percentile: "Percentile", games_played: "Games Played", total_score: "Total Score", breakdown: "W - D - L Breakdown", wins: "Wins", losses: "Losses", draws: "Draws" },
   es: { global_rank: "Rango Global", percentile: "Percentil", games_played: "Partidas Jugadas", total_score: "Puntaje Total", breakdown: "Desglose V - E - D", wins: "Victorias", losses: "Derrotas", draws: "Empates" },
   fr: { global_rank: "Rang Global", percentile: "Centile", games_played: "Parties Jouées", total_score: "Score Total", breakdown: "Détails V - N - D", wins: "Victoires", losses: "Défaites", draws: "Nuls" },
   de: { global_rank: "Globaler Rang", percentile: "Perzentil", games_played: "Spiele Gespielt", total_score: "Gesamtpunktzahl", breakdown: "S - U - N Details", wins: "Siege", losses: "Niederlagen", draws: "Remis" },
   ru: { global_rank: "Глобальный Ранг", percentile: "Процентиль", games_played: "Сыграно Игр", total_score: "Всего Очков", breakdown: "Статистика В - Н - П", wins: "Победы", draws: "Ничьи", losses: "Поражения" },
   ar: { global_rank: "الترتيب العالمي", percentile: "النسبة المئوية", games_played: "المباريات الملعوبة", total_score: "النتيجة الإجمالية", breakdown: "تفاصيل الفوز - التعادل - الخسارة", wins: "فوز", losses: "خسارة", draws: "تعادل" },
   hi: { global_rank: "वैश्विक रैंक", percentile: "प्रतिशतक", games_played: "खेले गए खेल", total_score: "कुल स्कोर", breakdown: "जीत - ड्रा - हार विवरण", wins: "जीत", losses: "हार", draws: "ड्रा" },
   ja: { global_rank: "グローバルランク", percentile: "パーセンタイル", games_played: "プレイ済みのゲーム", total_score: "トータルスコア", breakdown: "勝 - 分 - 敗 詳細", wins: "勝利", losses: "敗北", draws: "引き分け" },
   pt: { global_rank: "Classificação Global", percentile: "Percentil", games_played: "Jogos Jogados", total_score: "Pontuação Total", breakdown: "Detalhes V - E - D", wins: "Vitórias", losses: "Derrotas", draws: "Empates" },
   zh: { global_rank: "全球排名", percentile: "百分位数", games_played: "已玩游戏", total_score: "总积分", breakdown: "胜 - 平 - 负 详情", wins: "获胜", losses: "失败", draws: "平局" }
 };

 const labels = localizedLabels[locale] || localizedLabels['en'];

 const [tgUser, setTgUser] = useState<any>(null);
 const [stats, setStats] = useState<any>(null);
 const [photoError, setPhotoError] = useState(false);

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
 setStats({
   elo: 1450,
   xp: 850,
   level: 5,
   games_played: 28,
   wins: 16,
   losses: 8,
   draws: 4,
   win_rate: 57.1,
   loss_rate: 28.6,
   draw_rate: 14.3,
   global_rank: 42,
   percentile: 96.8,
   total_score: 18.0,
   recent_games: []
 });
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
 {(stats?.photo_url || tgUser?.photo_url) && !photoError ? (
 <img 
   src={getFullPhotoUrl(stats?.photo_url || tgUser?.photo_url)} 
   alt="Profile" 
   className="w-full h-full object-cover" 
   onError={() => setPhotoError(true)}
 />
 ) : (
 <FaChessKing className="text-4xl text-brand-primary opacity-40" />
 )}
 </div>
 {/* Premium overlay badge */}
 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-brand-border-opacity-20 bg-brand-surface text-brand-primary text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm">
 👑 {stats?.elo > 1500 ? t('grandmaster') : t('cyber_knight')}
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
    {/* ELO & Rank Card */}
    {!stats ? (
      <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden animate-pulse h-24 w-full">
        <div className="h-2 bg-brand-primary opacity-10 rounded w-12 mb-2" />
        <div className="h-6 bg-brand-primary opacity-15 rounded w-16 mb-2" />
        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-24" />
      </div>
    ) : (
      <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden">
        <span className="text-[9px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1">{t('elo')}</span>
        <span className="text-2xl font-black text-brand-primary leading-tight">{stats.elo || 1000}</span>
        <div className="flex items-center gap-1.5 mt-1.5 text-[8.5px] font-black text-brand-primary/50 uppercase tracking-wider">
          <span>{labels.global_rank} #{stats.global_rank || 1}</span>
          <span>•</span>
          <span>{stats.percentile?.toFixed(0) || 100}%</span>
        </div>
      </div>
    )}

    {/* Games Played & Total Score Card */}
    {!stats ? (
      <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden animate-pulse h-24 w-full">
        <div className="h-2 bg-brand-primary opacity-10 rounded w-16 mb-2" />
        <div className="h-6 bg-brand-primary opacity-15 rounded w-12 mb-2" />
        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-20" />
      </div>
    ) : (
      <div className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden">
        <span className="text-[9px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1">{labels.games_played}</span>
        <span className="text-2xl font-black text-brand-primary leading-tight">{stats.games_played || 0}</span>
        <div className="flex items-center gap-1 mt-1.5 text-[8.5px] font-black text-brand-primary/50 uppercase tracking-wider">
          <span>{labels.total_score}: {stats.total_score?.toFixed(1) || "0.0"} PTS</span>
        </div>
      </div>
    )}
  </div>

  {/* Visual W - D - L Breakdown Bar */}
  {!stats ? (
    <div className="w-full glass-panel p-4 rounded-xl border border-brand-border-opacity-10 bg-brand-surface animate-pulse space-y-3.5">
      <div className="flex justify-between items-center px-0.5">
        <div className="h-2.5 bg-brand-primary opacity-10 rounded w-24" />
        <div className="h-2.5 bg-brand-primary opacity-10 rounded w-12" />
      </div>
      <div className="w-full h-2 rounded-full bg-brand-primary opacity-5" />
      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
        <div className="flex flex-col items-center"><div className="h-2 bg-brand-primary opacity-10 rounded w-8 mb-1" /><div className="h-3 bg-brand-primary opacity-10 rounded w-6" /></div>
        <div className="flex flex-col items-center border-x border-brand-border-opacity-10"><div className="h-2 bg-brand-primary opacity-10 rounded w-8 mb-1" /><div className="h-3 bg-brand-primary opacity-10 rounded w-6" /></div>
        <div className="flex flex-col items-center"><div className="h-2 bg-brand-primary opacity-10 rounded w-8 mb-1" /><div className="h-3 bg-brand-primary opacity-10 rounded w-6" /></div>
      </div>
    </div>
  ) : (
    <div className="w-full glass-panel p-4 rounded-xl border border-brand-border-opacity-10 bg-brand-surface space-y-3.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[9px] font-black text-brand-primary opacity-45 uppercase tracking-widest">{labels.breakdown}</span>
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{stats.win_rate?.toFixed(1) || 0}% WR</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2 rounded-full overflow-hidden flex bg-brand-void/50 border border-brand-border-opacity-5">
        {stats.games_played > 0 ? (
          <>
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${stats.win_rate}%` }} title={`Wins: ${stats.win_rate}%`} />
            <div className="h-full bg-slate-500 transition-all duration-500" style={{ width: `${stats.draw_rate}%` }} title={`Draws: ${stats.draw_rate}%`} />
            <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${stats.loss_rate}%` }} title={`Losses: ${stats.loss_rate}%`} />
          </>
        ) : (
          <div className="h-full bg-brand-border-opacity-10 w-full" />
        )}
      </div>

      {/* Metric readouts */}
      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">{labels.wins}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.wins || 0}</span>
          <span className="text-[7.5px] font-bold text-brand-primary opacity-40">({stats.win_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col border-x border-brand-border-opacity-10">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{labels.draws}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.draws || 0}</span>
          <span className="text-[7.5px] font-bold text-brand-primary opacity-40">({stats.draw_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest">{labels.losses}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.losses || 0}</span>
          <span className="text-[7.5px] font-bold text-brand-primary opacity-40">({stats.loss_rate?.toFixed(0) || 0}%)</span>
        </div>
      </div>
    </div>
  )}

 {/* Gamification Sections */}
 <DailyTasks />
 <ReferralDashboard />

 {/* Recent Games History */}
 <div className="w-full space-y-4">
   <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">{t('recent_activity')}</h2>
   
   {!stats ? (
     <div className="flex flex-col gap-3">
       {[1, 2].map((n) => (
         <div key={n} className="glass-panel p-4 rounded-xl border border-brand-border-opacity-10 bg-brand-surface flex justify-between items-center animate-pulse">
           <div className="flex items-center gap-3 w-2/3">
             <div className="w-9 h-9 rounded-lg bg-brand-primary opacity-10 shrink-0" />
             <div className="flex flex-col space-y-1.5 w-full">
               <div className="h-2.5 bg-brand-primary opacity-10 rounded w-1/2" />
               <div className="h-2 bg-brand-primary opacity-5 rounded w-1/3" />
             </div>
           </div>
           <div className="flex flex-col items-end space-y-1">
             <div className="h-3 bg-brand-primary opacity-10 rounded w-10" />
             <div className="h-2 bg-brand-primary opacity-5 rounded w-12" />
           </div>
         </div>
       ))}
     </div>
   ) : stats.recent_games && stats.recent_games.length > 0 ? (
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
                   {t('opponent_elo')}: {game.opponent?.elo || 1000}
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
         {t('no_games_logged')}
       </span>
       <span className="text-[10px] font-medium text-brand-primary opacity-20 uppercase tracking-widest">
         {t('initiate_combat')}
       </span>
     </div>
   )}
 </div>

 </div>
 </LayoutWrapper>
 );
}
