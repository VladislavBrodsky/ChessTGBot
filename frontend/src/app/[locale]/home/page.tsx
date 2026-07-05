'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch, getFullPhotoUrl } from "@/lib/api";
import Link from "next/link";
import { 
  FaGraduationCap, FaStar, FaChessKnight, 
  FaWallet, FaGamepad, FaTrophy, 
  FaListOl, FaNewspaper
} from "react-icons/fa";
import { useTranslations, useLocale } from 'next-intl';
import XPProgressBar from "@/components/XPProgressBar";
import Leaderboard from "@/components/Leaderboard";
import NewsSection from "@/components/NewsSection";
import { useUser } from "@/context/UserContext";

export default function Home() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const { stats, walletBalance, loadingStats } = useUser();

 useEffect(() => {
   if (typeof window !== 'undefined') {
     let startParam = '';
     if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
       startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
     } else {
       const params = new URLSearchParams(window.location.search);
       startParam = params.get('startapp') || params.get('start') || '';
     }
     
     if (startParam) {
       if (!startParam.startsWith('ref_')) {
         router.push(`/${locale}/game?id=${startParam}`);
       }
     }
   }
 }, [locale, router]);

 useEffect(() => {
   // Init Telegram WebApp Data
   if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
     const tg = window.Telegram.WebApp;
     setTgUser(tg.initDataUnsafe?.user);
   } else {
     // Dev Mode Mock
     setTgUser({ first_name: "Master", photo_url: null });
   }
 }, []);



 return (
 <LayoutWrapper className="pb-12 px-4 md:px-6">
 <div className="flex flex-col items-center w-full max-w-sm md:max-w-md mx-auto space-y-5 py-4">

 {/* Dashboard Welcome Header */}
 <div className="w-full text-center px-1 mb-1">
 <h1 className="text-xl font-black tracking-tighter text-brand-primary leading-none uppercase animate-float">
 {t('welcome', { name: stats ? `${stats.first_name}${stats.last_name ? ' ' + stats.last_name : ''}` : (tgUser ? `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}` : 'Combatant') })}
 </h1>
 <p className="text-[8px] font-black text-brand-muted uppercase tracking-[0.4em] mt-2">
 {t('subtitle')}
 </p>
 </div>

 {/* Unified Premium Profile Card */}
  <AnimatePresence mode="wait" initial={false}>
  {(!stats || loadingStats) ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="w-full glass-panel p-5 rounded-2xl border-brand-border-opacity-10 shadow-premium relative overflow-hidden animate-pulse bg-brand-surface"
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3.5 w-2/3">
          <div className="w-12 h-12 rounded-xl bg-brand-primary opacity-10 shrink-0" />
          <div className="flex flex-col space-y-1.5 w-full">
            <div className="h-3.5 bg-brand-primary opacity-10 rounded w-2/3" />
            <div className="h-2 bg-brand-primary opacity-5 rounded w-1/3" />
          </div>
        </div>
        <div className="w-16 h-5 rounded-full bg-brand-primary opacity-5" />
      </div>
      
      {/* Simulated XP Progress Section (matching XPProgressBar height) */}
      <div className="mb-5">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <div className="h-2 bg-brand-primary opacity-5 rounded w-12" />
            <div className="h-2 bg-brand-primary opacity-5 rounded w-8" />
          </div>
          <div className="w-full h-1.5 bg-brand-primary opacity-5 rounded-full" />
        </div>
      </div>

      {/* Separator Line */}
      <div className="h-px w-full bg-brand-border-opacity-10 mb-4" />

      {/* Bottom Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-brand-border-opacity-10 text-center">
        <div className="flex flex-col items-center">
          <div className="h-2 bg-brand-primary opacity-5 rounded w-10 mb-2" />
          <div className="h-3 bg-brand-primary opacity-10 rounded w-6" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-2 bg-brand-primary opacity-5 rounded w-10 mb-2" />
          <div className="h-3 bg-brand-primary opacity-10 rounded w-6" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-2 bg-brand-primary opacity-5 rounded w-10 mb-2" />
          <div className="h-3 bg-brand-primary opacity-10 rounded w-6" />
        </div>
      </div>
    </motion.div>
  ) : (
    <motion.div
      key="card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      onClick={() => router.push(`/${locale}/profile`)}
      className="w-full relative overflow-hidden rounded-2xl p-5 border border-brand-border-opacity-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5 group cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all duration-300"
    >
      {/* Indicator dot */}
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-brand-primary/80 shadow-[0_0_8px_rgba(var(--brand-primary),0.8)]"
      />
      {/* Decorative background chess piece */}
      <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
      <FaChessKnight size={140} />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="flex items-center space-x-3.5">
      <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border-opacity-10 p-0.5 relative shadow-inner-glow">
      {(() => {
        const rawPhoto = stats.photo_url || tgUser?.photo_url;
        const hasPhoto = rawPhoto && rawPhoto !== 'null' && rawPhoto !== 'undefined' && rawPhoto !== '';
        return (
          <>
            {hasPhoto ? (
              <img 
                src={getFullPhotoUrl(rawPhoto)} 
                alt="Profile" 
                className="w-full h-full rounded-lg object-cover"
                fetchPriority="high"
                onError={(e) => { 
                  (e.target as HTMLImageElement).style.display = 'none'; 
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); 
                }}
              />
            ) : null}
            <div className={`w-full h-full rounded-lg bg-brand-bg-opacity-5 flex items-center justify-center text-lg font-black text-brand-primary opacity-30 ${hasPhoto ? 'hidden' : ''}`}>
              {stats.first_name?.[0] || tgUser?.first_name?.[0] || "?"}
            </div>
          </>
        );
      })()}
      {stats.is_premium && (
      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-brand-primary/40 bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.3)] backdrop-blur-md">
      <FaStar />
      </div>
      )}
      </div>
      <div className="flex flex-col justify-center">
      <h2 className="text-sm font-extrabold tracking-tight text-brand-primary leading-none mb-1.5">
      {`${stats.first_name} ${stats.last_name || ""}`.trim()}
      </h2>
      <span className="text-[11px] font-black text-brand-primary opacity-50 tracking-widest uppercase leading-none">
      {stats.elo || 1000} {t('elo')}
      </span>
      </div>
      </div>

      {/* Balance pill inside the User Card */}
      <Link href={`/${locale}/wallet`} className="relative z-20" onClick={(e) => e.stopPropagation()}>
      <motion.div 
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="flex items-center space-x-1.5 px-3 py-1 rounded-full border border-brand-border-opacity-10 bg-brand-void hover:bg-brand-bg-opacity-5 transition-all cursor-pointer shadow-sm"
      >
      <FaWallet className="text-[9px] text-brand-primary opacity-60" />
      <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary">
      ${(walletBalance / 100).toFixed(2)}
      </span>
      </motion.div>
      </Link>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-5 relative z-10">
      <XPProgressBar xp={stats.xp || 0} level={stats.level || 1} levelLabel={t('level')} />
      </div>

      <div className="h-px w-full bg-brand-border-opacity-10 mb-4" />

      {/* Compact Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-brand-border-opacity-10 text-center relative z-10">
      <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">{t('win_rate')}</span>
      <span className="text-xs font-black text-brand-primary">{stats.win_rate?.toFixed(1) || 0}%</span>
      </div>
      <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">{t('current_streak')}</span>
      <div className="flex items-center gap-1 justify-center">
      <span className="text-xs font-black text-brand-primary">{stats.current_streak?.count || 0}</span>
      <span className={`text-[8px] font-black uppercase tracking-wider ${stats.current_streak?.type === 'win' ? 'text-brand-primary' : 'text-brand-primary opacity-45'}`}>
      {stats.current_streak?.type === 'win' ? (t('wins')?.[0] || 'W') : (t('losses')?.[0] || 'L')}
      </span>
      </div>
      </div>
      <div className="flex flex-col items-center">
      <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">
      {t('wins')?.[0] || 'W'}/{t('losses')?.[0] || 'L'}/{locale === 'ru' ? 'Н' : 'D'}
      </span>
      <span className="text-xs font-black text-brand-primary">
      {stats.wins || 0}/{stats.losses || 0}/{stats.draws || 0}
      </span>
      </div>
      </div>
    </motion.div>
  )}
  </AnimatePresence>


 {/* Quick Shortcuts Hub Grid (3 Columns) */}
 <div className="grid grid-cols-3 gap-3 w-full relative z-10">
 <Link href={`/${locale}/academy`}>
 <motion.div
 whileHover={{ y: -2, scale: 1.02 }}
 whileTap={{ scale: 0.97 }}
 className="relative overflow-hidden w-full py-[18px] flex flex-col items-center justify-center gap-2 cursor-pointer border border-brand-border-opacity-10 rounded-2xl bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-brand-primary/20 hover:shadow-md transition-all duration-300 text-center"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 via-brand-primary/[0.03] to-brand-primary/0 pointer-events-none" />
 <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} className="absolute top-2 right-2 w-1 h-1 rounded-full bg-brand-primary/40" />
 <FaGraduationCap className="text-lg text-brand-primary opacity-80" />
 <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary">{t('academy')}</span>
 </motion.div>
 </Link>

  <Link href={`/${locale}/game`}>
  <motion.div
  whileHover={{ y: -2, scale: 1.02 }}
  whileTap={{ scale: 0.97 }}
  className="play-chess-card-premium w-full py-5 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
  >
  <FaGamepad className="text-lg text-brand-primary opacity-70 relative z-10 drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]" />
  <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary relative z-10">{t('play')}</span>
  </motion.div>
  </Link>

 <Link href={`/${locale}/challenges`}>
 <motion.div
 whileHover={{ y: -2, scale: 1.02 }}
 whileTap={{ scale: 0.97 }}
 className="relative overflow-hidden w-full py-[18px] flex flex-col items-center justify-center gap-2 cursor-pointer border border-brand-border-opacity-10 rounded-2xl bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:border-brand-primary/20 hover:shadow-md transition-all duration-300 text-center"
 >
 <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 via-brand-primary/[0.03] to-brand-primary/0 pointer-events-none" />
 <motion.div animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute top-2 right-2 w-1 h-1 rounded-full bg-brand-primary/40" />
 <FaTrophy className="text-lg text-brand-primary opacity-80" />
 <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary">{t('daily_tasks')}</span>
 </motion.div>
 </Link>
 </div>

 {/* Global Leaderboard Panel */}
 <div className="w-full space-y-2 relative z-10">
 <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
 <FaListOl className="text-brand-primary opacity-40 text-xs" />
 <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-40">{t('leaderboard')}</h3>
 </div>
 <Leaderboard />
 </div>

 {/* Cyber News Panel */}
 <div className="w-full space-y-2 relative z-10">
 <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
 <FaNewspaper className="text-brand-primary opacity-40 text-xs" />
 <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-40">{t('latest_updates')}</h3>
 </div>
 <NewsSection />
 </div>

 {/* Footer Decor */}
 <footer className="flex flex-col items-center py-6 select-none pointer-events-none opacity-5 w-full">
 <div className="flex items-center gap-4 w-full px-8">
 <div className="h-px flex-1 bg-linear-to-r from-transparent to-brand-border-opacity-20" />
 <span className="text-[7px] font-black tracking-[1.5em] uppercase text-brand-primary opacity-30 shrink-0">ANTIGRAVITY</span>
 <div className="h-px flex-1 bg-linear-to-l from-transparent to-brand-border-opacity-20" />
 </div>
 </footer>
 </div>
 
 </LayoutWrapper >
 );
}
