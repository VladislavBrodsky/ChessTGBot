'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { getFullPhotoUrl } from "@/lib/api";
import Link from "next/link";
import { 
  FaGraduationCap, FaChessKnight, 
  FaWallet, FaTrophy,
  FaListOl, FaNewspaper, FaArrowRight
} from "react-icons/fa";
import { FiBell, FiSettings } from 'react-icons/fi';
import { useTranslations, useLocale } from 'next-intl';
import Leaderboard from "@/components/Leaderboard";
import NewsSection from "@/components/NewsSection";
import { useUser } from "@/context/UserContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import XPProgressBar from "@/components/XPProgressBar";
import DailyCheckinModal from "@/components/DailyCheckinModal";
import NotificationModal from "@/components/NotificationModal";
import DailyGoalsBento from "@/components/DailyGoalsBento";
import { QuickPlayFAB } from "@/components/ui/QuickPlayFAB";
import { telegramHaptic } from "@/lib/telegram";

// Telegram's `start_param` persists for the whole webview session, so the
// deep-link redirect below re-fired on EVERY Home mount — after finishing a
// deep-linked game, returning to Home yanked the user straight back into that
// (now finished) game's MatchOverModal, with no escape. Honor a deep link at
// most once per session; live-game resume is handled by LayoutWrapper's
// /game/active check (which correctly excludes finished games).
let deepLinkHandled = false;

export default function Home() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const [showNotifications, setShowNotifications] = useState(false);
 const [mounted, setMounted] = useState(false);
 const { stats, walletBalance, loadingStats, balanceError, statsError, syncStats } = useUser();
 const hasCombatant = typeof t?.has === 'function' && t.has('combatant');
 const fallbackCombatant = hasCombatant ? t('combatant') : 'Combatant';
 const displayName = !mounted 
   ? fallbackCombatant
   : stats
     ? `${stats.first_name}${stats.last_name ? ` ${stats.last_name}` : ''}`
     : (tgUser ? `${tgUser.first_name}${tgUser.last_name ? ` ${tgUser.last_name}` : ''}` : fallbackCombatant);

 useEffect(() => {
   if (typeof window !== 'undefined') {
     let startParam = '';
     if (window.Telegram?.WebApp?.initDataUnsafe?.start_param) {
       startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
     } else {
       const params = new URLSearchParams(window.location.search);
       startParam = params.get('startapp') || params.get('start') || '';
     }
     
     if (startParam && !startParam.startsWith('ref_') && !deepLinkHandled) {
       deepLinkHandled = true;
       if (startParam === 'arena') {
         router.push(`/${locale}/game`);
       } else {
         router.push(`/${locale}/game?id=${startParam}`);
       }
     }
   }
 }, [locale, router]);

 useEffect(() => {
   setMounted(true);
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
 <LayoutWrapper className="px-4 md:px-6 w-full" hideHeaderControls>
 <DailyCheckinModal />
 <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
 <main className="flex flex-col items-center w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-5 py-4">

  {/* Dashboard Welcome Header — a two-line greeting keeps the profile moment clear at every width. */}
  <header className="mb-1 w-full px-1">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <h1 className={`min-w-0 text-start text-xl font-black uppercase leading-[0.95] tracking-tighter text-brand-primary sm:text-2xl transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`} title={t('welcome', { name: displayName })}>
        <span className="block">{t('welcome_greeting')}</span>
        <span className="mt-1 block break-words">{displayName}</span>
      </h1>

      {/* Inline Header Controls — explicitly aligned with the title baseline row. */}
      <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={() => setShowNotifications(true)}
        aria-label="Notifications"
        className="relative w-10 h-10 pb-[0.5px] flex items-center justify-center rounded-2xl bg-brand-surface border border-brand-border-opacity-10 shadow-lg text-brand-muted hover:text-brand-primary hover:border-brand-border-opacity-20 transition-all active:scale-95 cursor-pointer"
      >
        <FiBell size={16} />
        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-premium" />
      </button>
      <Link
        href={`/${locale}/settings`}
        aria-label={t('nav_settings')}
        className="w-10 h-10 pb-[0.5px] flex items-center justify-center rounded-2xl bg-brand-surface border border-brand-border-opacity-10 shadow-lg text-brand-muted hover:text-brand-primary hover:border-brand-border-opacity-20 transition-all active:scale-95"
      >
          <FiSettings size={16} />
      </Link>
      </div>
    </div>
  </header>

 {/* Unified Premium Profile Card */}
  <AnimatePresence mode="wait" initial={false}>
  {(!stats && !loadingStats && statsError) ? (
    /* Stats failed to load — say so and offer a retry instead of pulsing a
       skeleton forever (the old behavior when the API was unreachable). */
    <motion.div
      key="stats-error"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="w-full"
    >
      <Card variant="glass" className="w-full p-5 border-brand-border-opacity-10 shadow-premium flex flex-col items-center text-center space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">
          {t('load_failed')}
        </span>
        <Button
          variant="action"
          size="sm"
          onClick={() => syncStats()}
        >
          {t('retry')}
        </Button>
      </Card>
    </motion.div>
  ) : (!stats || loadingStats) ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="w-full"
    >
      <Card variant="glass" className="w-full p-5 border-brand-border-opacity-10 shadow-premium relative overflow-hidden animate-pulse">
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
        <div className="grid grid-cols-4 divide-x divide-brand-border-opacity-10 text-center">
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
          <div className="flex flex-col items-center">
            <div className="h-2 bg-brand-primary opacity-5 rounded w-10 mb-2" />
            <div className="h-3 bg-brand-primary opacity-10 rounded w-6" />
          </div>
        </div>
      </Card>
    </motion.div>
  ) : (
    <motion.div
      key="card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/${locale}/profile`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          router.push(`/${locale}/profile`);
        }
      }}
      className="w-full"
    >
      <Card variant="solid" className="w-full relative overflow-hidden p-5 bg-gradient-to-br from-brand-surface to-brand-bg-opacity-5 group cursor-pointer hover:border-brand-primary/20 hover:shadow-md transition-all duration-300">
      {/* Indicator dot */}
      <div className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-brand-primary/80" aria-hidden="true" />
      {/* Decorative background chess piece */}
      <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
      <FaChessKnight size={140} />
      </div>

      <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="flex items-center space-x-3.5">
        <Avatar
          src={stats.photo_url || tgUser?.photo_url ? getFullPhotoUrl(stats.photo_url || tgUser?.photo_url) : undefined}
          name={`${stats.first_name} ${stats.last_name || ""}`.trim() || tgUser?.first_name}
          size="lg"
          badge={
            <div className="px-1.5 py-0.5 rounded-full flex items-center gap-0.5 text-[8px] font-black border border-amber-400/40 bg-brand-surface text-amber-400 shadow-sm">
              <span>{stats.level || 1}</span>
              <span className="text-[7px]">⚡</span>
            </div>
          }
        />
        <div className="flex flex-col justify-center text-left">
          <h2 className="text-sm font-extrabold tracking-tight text-brand-primary leading-none mb-1.5">
            {`${stats.first_name} ${stats.last_name || ""}`.trim()}
          </h2>
          <span className="text-[11px] font-black text-brand-muted tracking-widest uppercase leading-none">
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
      <FaWallet className="text-[10px] text-brand-muted" />
      <span className={`text-[10px] font-black uppercase tracking-wider ${balanceError ? 'text-brand-danger' : 'text-brand-primary'}`}>
      {/* Never present a failed balance fetch as "$0.00" */}
      {balanceError ? '$ —' : `$${(walletBalance / 100).toFixed(2)}`}
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
      <span className="min-h-5 flex items-center justify-center text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-tight mb-1.5">{t('win_rate')}</span>
      <span className="text-xs font-black text-brand-primary">{stats.win_rate?.toFixed(1) || '0.0'}%</span>
      </div>
      <div className="flex flex-col items-center">
      <span className="min-h-5 flex items-center justify-center text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-tight mb-1.5">{t('current_streak')}</span>
      <div className="flex items-center gap-1 justify-center">
      <span className="text-xs font-black text-brand-primary">{stats.current_streak?.count || 0}</span>
      {(stats.current_streak?.count ?? 0) > 0 && stats.current_streak?.type !== 'none' && (
      <span className={`text-[10px] font-black uppercase tracking-wider ${stats.current_streak?.type === 'win' ? 'text-brand-primary' : stats.current_streak?.type === 'draw' ? 'text-brand-muted' : 'text-brand-muted'}`}>
      {stats.current_streak?.type === 'win' ? (t('wins')?.[0] || 'W') : stats.current_streak?.type === 'draw' ? (t('draws')?.[0] || 'D') : (t('losses')?.[0] || 'L')}
      </span>
      )}
      </div>
      </div>
      <div className="flex flex-col items-center">
      <span className="min-h-5 flex items-center justify-center text-[10px] font-bold text-brand-muted uppercase tracking-widest leading-tight mb-1.5">{t('games_played')}</span>
      <span className="text-xs font-black text-brand-primary">{(stats.games_played ?? 0).toLocaleString(locale)}</span>
      </div>
      </div>
      </Card>
    </motion.div>
  )}
  </AnimatePresence>


 {/* Primary action first, supporting actions second. */}
 <div className="w-full space-y-3 relative z-10">
  <Link
   href={`/${locale}/game`}
   onClick={() => telegramHaptic('medium')}
   className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-void"
  >
   <motion.div
     whileHover={{ y: -2 }}
     whileTap={{ scale: 0.985 }}
     className="play-chess-card-premium min-h-[96px] w-full px-5 py-4 flex items-center gap-4 cursor-pointer"
    >
     <div className="play-chess-card-piece relative z-10 w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center">
      <FaChessKnight className="text-2xl" aria-hidden="true" />
     </div>
     <div className="relative z-10 min-w-0 flex-1 text-left">
      <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary mb-1.5">{t('play')}</span>
      <span className="block text-xl font-black tracking-tight text-brand-primary leading-none">{t('execute_matchmaking')}</span>
     </div>
     <div className="play-chess-card-arrow relative z-10 w-11 h-11 shrink-0 rounded-xl flex items-center justify-center">
      <FaArrowRight className="text-sm rtl:rotate-180" aria-hidden="true" />
     </div>
    </motion.div>
  </Link>

  <div className="grid grid-cols-2 gap-3">
   <Link href={`/${locale}/academy`} className="block w-full">
    <Card
     variant="solid"
     interactive
     className="min-h-[76px] w-full px-4 flex items-center gap-3 cursor-pointer"
    >
     <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-brand-bg-opacity-5 border border-brand-border-opacity-5">
      <FaGraduationCap className="text-lg text-brand-muted" />
     </div>
     <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary leading-tight">{t('academy')}</span>
    </Card>
   </Link>

   <Link href={`/${locale}/challenges`} className="block w-full">
    <Card
     variant="solid"
     interactive
     className="min-h-[76px] w-full px-4 flex items-center gap-3 cursor-pointer"
    >
     <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-brand-bg-opacity-5 border border-brand-border-opacity-5">
      <FaTrophy className="text-base text-brand-muted" />
     </div>
     <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary leading-tight">{t('daily_tasks')}</span>
    </Card>
   </Link>
   </div>
  </div>

  {/* Daily Combat Goals Bento */}
  {stats && (
    <DailyGoalsBento
      percentile={stats.percentile || 74}
      xpCurrent={Math.min(300, (stats.xp || 0) % 500)}
    />
  )}

  {/* Global Leaderboard Panel */}
  <div className="w-full space-y-2 relative z-10">
 <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
 <FaListOl className="text-brand-muted text-xs" />
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted">{t('leaderboard')}</h3>
 </div>
 <Leaderboard />
 </div>

 {/* Cyber News Panel */}
 <div className="w-full space-y-2 relative z-10">
 <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
 <FaNewspaper className="text-brand-muted text-xs" />
 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-muted">{t('latest_updates')}</h3>
 </div>
 <NewsSection />
 </div>

 {/* Footer Decor */}
 <footer className="flex flex-col items-center py-6 select-none pointer-events-none opacity-5 w-full">
 <div className="flex items-center gap-4 w-full px-8">
 <div className="h-px flex-1 bg-linear-to-r from-transparent to-brand-border-opacity-20" />
 <span className="text-[10px] font-black tracking-[1.5em] uppercase text-brand-muted shrink-0">ANTIGRAVITY</span>
 <div className="h-px flex-1 bg-linear-to-l from-transparent to-brand-border-opacity-20" />
 </div>
 </footer>
 </main>
 
 <QuickPlayFAB />
 </LayoutWrapper >
 );
}
