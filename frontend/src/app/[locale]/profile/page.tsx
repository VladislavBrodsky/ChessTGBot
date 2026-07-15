'use client';

import LayoutWrapper from "@/components/LayoutWrapper";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch, getFullPhotoUrl } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaTrophy, FaChessKing, FaChessPawn, FaChartLine, FaFire } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useUser } from "@/context/UserContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// SVG Elo history chart component
function EloHistoryChart({ recentGames, currentElo }: { recentGames: any[], currentElo: number }) {
  const WIDTH = 300;
  const HEIGHT = 80;
  const PAD = 8;

  if (!recentGames || recentGames.length === 0) {
    // Empty state with subtle flat line
    const midY = PAD + (HEIGHT - PAD * 2) / 2;
    return (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }}>
        <defs>
          <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${PAD},${midY} L ${WIDTH - PAD},${midY}`} stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" fill="none" />
        <text x={WIDTH / 2} y={HEIGHT / 2 + 4} textAnchor="middle" fill="#10b981" fontSize="9" opacity="0.4" fontWeight="700" letterSpacing="1">NO RATING HISTORY</text>
      </svg>
    );
  }

  // Reconstruct Elo history points (reverse chronological order)
  const history = [currentElo];
  let tempElo = currentElo;
  for (let i = 0; i < Math.min(recentGames.length, 10); i++) {
    tempElo -= (recentGames[i].elo_change || 0);
    history.push(tempElo);
  }
  history.reverse(); // oldest to newest

  const minVal = Math.min(...history) - 20;
  const maxVal = Math.max(...history) + 20;
  const range = maxVal - minVal;

  const pts = history.map((val, i) => {
    const x = PAD + (i / (history.length - 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - (val - minVal) / range) * (HEIGHT - PAD * 2);
    return { x, y, val };
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x},${HEIGHT - PAD} L ${pts[0].x},${HEIGHT - PAD} Z`;

  const isPositiveTrend = history[history.length - 1] >= history[0];
  const strokeColor = isPositiveTrend ? "#10b981" : "#f43f5e"; // Emerald if up, Rose if down

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full drop-shadow-sm" style={{ height: HEIGHT }}>
      <defs>
        <linearGradient id="eloChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#eloChartGrad)" />
      <path d={pathD} stroke={strokeColor} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={strokeColor} className="drop-shadow-md" />
      ))}
    </svg>
  );
}

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

  // Parse unlocked items
  const unlockedItems: string[] = typeof stats?.unlocked_items === 'string' 
    ? JSON.parse(stats.unlocked_items) 
    : (stats?.unlocked_items || []);

  // Determine active profile border
  let borderOuterClass = "absolute inset-0 rounded-full border border-brand-primary/30 animate-pulse scale-110 shadow-[0_0_24px_rgba(var(--brand-primary),0.2)] pointer-events-none";
  let borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-2 border-brand-primary/10 flex items-center justify-center relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.15)]";
  
  if (unlockedItems.includes("border_platinum")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-purple-500/50 animate-pulse scale-110 shadow-[0_0_32px_rgba(168,85,247,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-purple-500/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)]";
  } else if (unlockedItems.includes("border_gold")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-amber-400/50 animate-pulse scale-110 shadow-[0_0_32px_rgba(251,191,36,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-amber-400/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.3)]";
  } else if (unlockedItems.includes("border_silver")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-slate-300/50 animate-pulse scale-110 shadow-[0_0_24px_rgba(203,213,225,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-slate-300/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(203,213,225,0.2)]";
  } else if (unlockedItems.includes("border_bronze")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-orange-700/50 animate-pulse scale-110 shadow-[0_0_24px_rgba(194,65,12,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-orange-700/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(194,65,12,0.2)]";
  }

 return (
 <LayoutWrapper className="justify-start pt-8 pb-32">
 <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center px-4 mx-auto space-y-8">

 {/* Profile Header */}
 <div className="w-full flex flex-col items-center text-center">
 <div className="relative mb-4">
 {/* Outer rotating/pulsing ring */}
 <div className={borderOuterClass} />
 <div className={borderInnerClass}>
 {(stats?.photo_url || tgUser?.photo_url) && !photoError ? (
 <img 
   src={getFullPhotoUrl(stats?.photo_url || tgUser?.photo_url)} 
   alt="Profile" 
   className="w-full h-full object-cover" 
   onError={() => setPhotoError(true)}
 />
 ) : (
 <FaChessKing className="text-4xl text-brand-primary opacity-40 drop-shadow-md" />
 )}
 </div>
  {/* Premium overlay badge */}
  {stats?.is_premium ? (
    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-700/20 text-amber-400 text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_12px_rgba(251,191,36,0.25)] backdrop-blur-md">
      👑 PREMIUM
    </div>
  ) : (
    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full border border-brand-primary/30 bg-gradient-to-br from-brand-surface to-brand-void text-brand-primary/80 text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_12px_rgba(255,255,255,0.05)] backdrop-blur-md">
      {stats?.elo > 1500 ? t('grandmaster') : t('cyber_knight')}
    </div>
  )}
 </div>
 <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1">
 {stats ? `${stats.first_name} ${stats.last_name || ""}`.trim() : (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : "Combatant")}
 </h1>
 
 {stats && stats.study_streak > 0 && (
    <div className="flex items-center gap-1.5 mb-4 text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
        <FaFire className="text-sm" />
        <span className="text-[10px] font-black uppercase tracking-widest">{stats.study_streak} {t('day_streak') || 'Day Streak'}</span>
    </div>
 )}
 
 <div className="mb-6 w-full max-w-[200px]">
 <XPProgressBar xp={stats?.xp || 0} level={stats?.level || 1} />
 </div>
 </div>

  {/* Stats Grid */}
  <div className="w-full grid grid-cols-2 gap-3">
    {/* ELO & Rank Card */}
    {!stats ? (
      <Card variant="glass" className="p-4 flex flex-col items-center justify-center border-brand-border-opacity-10 relative overflow-hidden animate-pulse h-24 w-full">
        <div className="h-2 bg-brand-primary opacity-10 rounded w-12 mb-2" />
        <div className="h-6 bg-brand-primary opacity-15 rounded w-16 mb-2" />
        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-24" />
      </Card>
    ) : (
      <Card variant="glass" className="p-4 flex flex-col items-center justify-center border-brand-border-opacity-10 relative overflow-hidden">
        <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1">{t('elo')}</span>
        <span className="text-2xl font-black text-brand-primary leading-tight">{stats.elo || 1000}</span>
        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-black text-brand-primary/50 uppercase tracking-wider">
          <span>{labels.global_rank} #{stats.global_rank || 1}</span>
          <span>•</span>
          <span>{stats.percentile?.toFixed(0) || 100}%</span>
        </div>
      </Card>
    )}

    {/* Games Played & Total Score Card */}
    {!stats ? (
      <Card variant="glass" className="p-4 flex flex-col items-center justify-center border-brand-border-opacity-10 relative overflow-hidden animate-pulse h-24 w-full">
        <div className="h-2 bg-brand-primary opacity-10 rounded w-16 mb-2" />
        <div className="h-6 bg-brand-primary opacity-15 rounded w-12 mb-2" />
        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-20" />
      </Card>
    ) : (
      <Card variant="glass" className="p-4 flex flex-col items-center justify-center border-brand-border-opacity-10 relative overflow-hidden">
        <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest mb-1">{labels.games_played}</span>
        <span className="text-2xl font-black text-brand-primary leading-tight">{stats.games_played || 0}</span>
        <div className="flex items-center gap-1 mt-1.5 text-[10px] font-black text-brand-primary/50 uppercase tracking-wider">
          <span>{labels.total_score}: {stats.total_score?.toFixed(1) || "0.0"} PTS</span>
        </div>
      </Card>
    )}
  </div>

  {/* Visual W - D - L Breakdown Bar */}
  {!stats ? (
    <Card variant="glass" className="w-full p-4 border-brand-border-opacity-10 animate-pulse space-y-3.5">
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
    </Card>
  ) : (
    <Card variant="glass" className="w-full p-4 border-brand-border-opacity-10 space-y-3.5">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">{labels.breakdown}</span>
        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{stats.win_rate?.toFixed(1) || 0}% WR</span>
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
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{labels.wins}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.wins || 0}</span>
          <span className="text-[10px] font-bold text-brand-primary opacity-40">({stats.win_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col border-x border-brand-border-opacity-10">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{labels.draws}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.draws || 0}</span>
          <span className="text-[10px] font-bold text-brand-primary opacity-40">({stats.draw_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest">{labels.losses}</span>
          <span className="text-xs font-black text-brand-primary mt-0.5">{stats.losses || 0}</span>
          <span className="text-[10px] font-bold text-brand-primary opacity-40">({stats.loss_rate?.toFixed(0) || 0}%)</span>
        </div>
      </div>
    </Card>
  )}

  {/* ELO History Chart */}
  {stats && (
    <Card variant="glass" className="w-full p-4 border-brand-border-opacity-10 space-y-2">
      <div className="flex justify-between items-center px-1 mb-2">
        <span className="text-[10px] font-black text-brand-primary opacity-45 uppercase tracking-widest">Rating Trajectory</span>
        <span className="text-[10px] font-black text-brand-primary opacity-30 uppercase tracking-widest">Last 10 Games</span>
      </div>
      <EloHistoryChart recentGames={stats.recent_games} currentElo={stats.elo || 1000} />
    </Card>
  )}

 {/* Gamification Sections */}
 <DailyTasks />
 <ReferralDashboard />

 {/* Inventory & Boosters */}
 {stats && (stats.xp_multiplier > 1.0 || unlockedItems.length > 0) && (
   <div className="w-full space-y-4">
     <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">Inventory & Boosters</h2>
     <div className="grid grid-cols-2 gap-3">
       {/* Active Boosters */}
       {stats.xp_multiplier > 1.0 && (
         <Card variant="glass" className="p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden flex flex-col items-center text-center">
           <div className="absolute -right-4 -top-4 text-6xl opacity-5">🚀</div>
           <span className="text-[10px] font-black text-amber-400/80 uppercase tracking-widest mb-2">Active Booster</span>
           <span className="text-2xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]">
             {stats.xp_multiplier}x XP
           </span>
           {stats.multiplier_expires_at && (
             <span className="text-[10px] text-amber-400/60 font-bold mt-2">
               Expires: {new Date(stats.multiplier_expires_at).toLocaleDateString()}
             </span>
           )}
         </Card>
       )}
       {/* Cosmetics Count */}
       {unlockedItems.length > 0 && (
         <Card variant="glass" className="p-4 border-brand-primary/20 flex flex-col items-center text-center justify-center">
           <span className="text-[10px] font-black text-brand-primary/60 uppercase tracking-widest mb-1">Cosmetics Owned</span>
           <span className="text-2xl font-black text-brand-primary">
             {unlockedItems.length}
           </span>
           <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-widest mt-1">Profile Styles</span>
         </Card>
       )}
     </div>
   </div>
 )}

 {/* Recent Games History */}
 <div className="w-full space-y-4">
   <h2 className="text-sm font-black text-brand-primary uppercase tracking-[0.2em]">{t('recent_activity')}</h2>
   
   {!stats ? (
     <div className="flex flex-col gap-3">
       {[1, 2].map((n) => (
         <Card key={n} variant="glass" className="p-4 border-brand-border-opacity-10 flex justify-between items-center animate-pulse">
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
         </Card>
       ))}
     </div>
   ) : stats.recent_games && stats.recent_games.length > 0 ? (
     <div className="flex flex-col gap-3">
       {stats.recent_games.map((game: any) => {
         const isWin = game.result === 'win';
         const isLoss = game.result === 'loss';
         const badgeColor = isWin 
           ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]" 
           : isLoss 
             ? "border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]" 
             : "border-brand-primary/20 bg-brand-primary/10 text-brand-primary opacity-60";
         
         const rowGlow = isWin
           ? "hover:border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.03] to-transparent shadow-[0_2px_12px_rgba(16,185,129,0.03)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.06)]"
           : isLoss
             ? "hover:border-red-500/20 bg-gradient-to-r from-red-500/[0.03] to-transparent shadow-[0_2px_12px_rgba(239,68,68,0.03)] hover:shadow-[0_4px_16px_rgba(239,68,68,0.06)]"
             : "hover:border-brand-primary/20 bg-brand-surface border-brand-border-opacity-10 shadow-[0_2px_8px_rgba(0,0,0,0.03)]";

         return (
           <motion.div
             key={game.game_id}
             whileHover={{ scale: 1.01 }}
             whileTap={{ scale: 0.99 }}
             onClick={() => router.push(`/${locale}/game/review/${game.game_id}`)}
             className={`p-4 rounded-2xl border border-brand-border-opacity-10 flex justify-between items-center cursor-pointer transition-all duration-300 relative overflow-hidden ${rowGlow}`}
           >
             {/* Ambient hover glow indicator */}
             {isWin && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />}
             {isLoss && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />}

             <div className="flex items-center gap-3 relative z-10">
               <div className="w-9 h-9 rounded-xl bg-brand-void border border-brand-border-opacity-10 flex items-center justify-center">
                 <FaChessPawn className="text-brand-primary opacity-40 drop-shadow-sm" />
               </div>
               <div className="flex flex-col">
                 <span className="text-xs font-black text-brand-primary uppercase tracking-tight">
                   vs {game.opponent?.name || "AI Engine"}
                 </span>
                 <span className="text-[10px] font-bold text-brand-primary opacity-30 uppercase tracking-[0.2em]">
                   {t('opponent_elo')}: {game.opponent?.elo || 1000}
                 </span>
               </div>
             </div>
             
             <div className="flex items-center gap-4 relative z-10">
               <div className="flex flex-col items-end">
                 <span className={`px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-widest ${badgeColor}`}>
                   {game.result}
                 </span>
                 <span className="text-[10px] font-black text-brand-primary mt-1.5 drop-shadow-sm">
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
      <Card variant="glass" className="p-6 border-brand-border-opacity-10 text-center">
        <span className="text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest block mb-1">
          {t('no_games_logged')}
        </span>
        <span className="text-[10px] font-medium text-brand-primary opacity-20 uppercase tracking-widest">
          {t('initiate_combat')}
        </span>
      </Card>
   )}
 </div>

 </div>
 </LayoutWrapper>
 );
}
