'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { 
 FaChessPawn, FaGraduationCap, FaStar, FaChessKnight, 
 FaCoins, FaWallet, FaShareAlt, FaGamepad, FaTrophy, 
 FaListOl, FaNewspaper, FaTimes 
} from "react-icons/fa";
import { useTranslations, useLocale } from 'next-intl';
import XPProgressBar from "@/components/XPProgressBar";
import Leaderboard from "@/components/Leaderboard";
import NewsSection from "@/components/NewsSection";

export default function Home() {
 const t = useTranslations('Index');
 const locale = useLocale();
 const router = useRouter();
 const [tgUser, setTgUser] = useState<any>(null);
 const [stats, setStats] = useState<any>(null);
 const [walletBalance, setWalletBalance] = useState<number>(0);
 const [showReferralPopup, setShowReferralPopup] = useState<boolean>(false);

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
 const timer = setTimeout(() => {
 if (Math.random() > 0.3) {
 setShowReferralPopup(true);
 setTimeout(() => setShowReferralPopup(false), 5000);
 }
 }, 1500);
 return () => clearTimeout(timer);
 }, []);

 useEffect(() => {
   syncBalance();
   // Init Telegram WebApp Data
   if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
 const tg = window.Telegram.WebApp;
 setTgUser(tg.initDataUnsafe?.user);

 // Fetch User Stats and Sync Profile
 if (tg.initDataUnsafe?.user?.id) {
 apiFetch(`/api/v1/users/sync`, { method: "POST" })
 .then(res => res.json())
 .then(data => setStats(data))
 .catch(err => console.error("Failed to fetch Stats", err));
 }
 } else {
 // Dev Mode Mock
 setTgUser({ first_name: "Master", photo_url: null });
 setStats({
 elo: 1250,
 wins: 15,
 losses: 5,
 draws: 2,
 is_premium: true,
 win_rate: 68.2,
 current_streak: { type: 'win', count: 3 },
 recent_games: [
 { game_id: '1', opponent: { name: 'Player 1', elo: 1230 }, result: 'win', elo_change: 12 },
 { game_id: '2', opponent: { name: 'Player 2', elo: 1190 }, result: 'win', elo_change: 10 },
 { game_id: '3', opponent: { name: 'Player 3', elo: 1270 }, result: 'loss', elo_change: -15 }
 ]
 });
 }
 }, []);

 const syncBalance = async () => {
 try {
 const res = await apiFetch("/api/v1/wallet/balance");
 if (res.ok) {
 const data = await res.json();
 setWalletBalance(data.balance);
 }
 } catch (err) {
 console.error("Failed to sync wallet balance", err);
 }
 };

  const handleShareResult = (game: any) => {
    const resultText = game.result === 'win' ? t('secured_victory') : game.result === 'loss' ? t('fought_battle') : t('reached_stalemate');
    const eloText = game.elo_change > 0 ? `+${game.elo_change}` : `${game.elo_change}`;
    const botUsername = stats?.bot_username || "FinChess_bot";
    const message = `${resultText} ${t('against')} ${game.opponent.name}! 📈 ${t('global_ranking')}: ${eloText} ELO. \n\n${t('join_matrix')}: https://t.me/${botUsername}?start=${stats?.referral_code || ''}`;

    let success = false;
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      try {
        tg.switchInlineQuery(message, ["users", "groups", "channels"]);
        success = true;
        if (tg.HapticFeedback) {
          try {
            tg.HapticFeedback.impactOccurred('medium');
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Telegram switchInlineQuery failed", err);
      }
    }
    if (!success) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(message);
        alert("Share link copied to clipboard!");
      }
    }
  };

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
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full glass-panel p-5 rounded-2xl border-brand-border-opacity-10 shadow-premium relative overflow-hidden group"
 >
 {/* Decorative background chess piece */}
 <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
 <FaChessKnight size={140} />
 </div>

 <div className="flex items-center justify-between mb-4 relative z-10">
 <div className="flex items-center space-x-3.5">
 <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border-opacity-10 p-0.5 relative shadow-inner-glow">
 {(stats?.photo_url || tgUser?.photo_url) ? (
 <img 
   src={stats?.photo_url || tgUser.photo_url} 
   alt="Profile" 
   className="w-full h-full rounded-lg object-cover"
   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
 />
 ) : null}
 <div className={`w-full h-full rounded-lg bg-brand-bg-opacity-5 flex items-center justify-center text-lg font-black text-brand-primary opacity-30 ${(stats?.photo_url || tgUser?.photo_url) ? 'hidden' : ''}`}>
 {stats?.first_name?.[0] || tgUser?.first_name?.[0] || "?"}
 </div>
 {stats?.is_premium && (
 <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-[8px] text-brand-void border-2 border-brand-void shadow-premium">
 <FaStar />
 </div>
 )}
 </div>
 <div className="flex flex-col justify-center">
 <h2 className="text-sm font-extrabold tracking-tight text-brand-primary leading-none mb-1.5">
 {stats ? `${stats.first_name} ${stats.last_name || ""}`.trim() : (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : "Combatant")}
 </h2>
 <span className="text-[11px] font-black text-brand-primary opacity-50 tracking-widest uppercase leading-none">
 {stats?.elo || 1000} {t('elo')}
 </span>
 </div>
 </div>

 {/* Balance pill inside the User Card */}
 <Link href={`/${locale}/wallet`} className="relative z-20">
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
 <XPProgressBar xp={stats?.xp || 0} level={stats?.level || 1} levelLabel={t('level')} />
 </div>

 <div className="h-px w-full bg-brand-border-opacity-10 mb-4" />

 {/* Compact Stats Row */}
 <div className="grid grid-cols-3 divide-x divide-brand-border-opacity-10 text-center relative z-10">
 <div className="flex flex-col items-center">
 <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">{t('win_rate')}</span>
 <span className="text-xs font-black text-brand-primary">{stats?.win_rate?.toFixed(1) || 0}%</span>
 </div>
 <div className="flex flex-col items-center">
 <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">{t('current_streak')}</span>
 <div className="flex items-center gap-1 justify-center">
 <span className="text-xs font-black text-brand-primary">{stats?.current_streak?.count || 0}</span>
 <span className={`text-[8px] font-black uppercase tracking-wider ${stats?.current_streak?.type === 'win' ? 'text-brand-primary' : 'text-brand-primary opacity-45'}`}>
 {stats?.current_streak?.type === 'win' ? (t('wins')?.[0] || 'W') : (t('losses')?.[0] || 'L')}
 </span>
 </div>
 </div>
 <div className="flex flex-col items-center">
 <span className="text-[8px] font-bold text-brand-primary opacity-30 uppercase tracking-widest leading-none mb-1.5">
 {t('wins')?.[0] || 'W'}/{t('losses')?.[0] || 'L'}/{locale === 'ru' ? 'Н' : 'D'}
 </span>
 <span className="text-xs font-black text-brand-primary">
 {stats?.wins || 0}/{stats?.losses || 0}/{stats?.draws || 0}
 </span>
 </div>
 </div>
 </motion.div>

 {/* Quick Shortcuts Hub Grid (3 Columns) */}
 <div className="grid grid-cols-3 gap-3 w-full relative z-10">
 <Link href={`/${locale}/game`}>
 <motion.div
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.97 }}
 className="glass-button w-full py-4.5 flex flex-col items-center justify-center gap-2 cursor-pointer border border-brand-border-opacity-10 hover:border-brand-border-opacity-25 transition-all text-center shadow-sm"
 >
 <FaGamepad className="text-lg text-brand-primary opacity-70" />
 <span className="text-[9px] font-black uppercase tracking-wider">{t('play')}</span>
 </motion.div>
 </Link>

 <Link href={`/${locale}/academy`}>
 <motion.div
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.97 }}
 className="glass-button w-full py-4.5 flex flex-col items-center justify-center gap-2 cursor-pointer border border-brand-border-opacity-10 hover:border-brand-border-opacity-25 transition-all text-center shadow-sm"
 >
 <FaGraduationCap className="text-lg text-brand-primary opacity-70" />
 <span className="text-[9px] font-black uppercase tracking-wider">{t('academy')}</span>
 </motion.div>
 </Link>

 <Link href={`/${locale}/challenges`}>
 <motion.div
 whileHover={{ y: -2 }}
 whileTap={{ scale: 0.97 }}
 className="glass-button w-full py-4.5 flex flex-col items-center justify-center gap-2 cursor-pointer border border-brand-border-opacity-10 hover:border-brand-border-opacity-25 transition-all text-center shadow-sm"
 >
 <FaTrophy className="text-lg text-brand-primary opacity-70" />
 <span className="text-[9px] font-black uppercase tracking-wider">{t('daily_tasks')}</span>
 </motion.div>
 </Link>
 </div>

 {/* Recent Activity Log */}
 {stats?.recent_games && stats.recent_games.length > 0 && (
 <div className="w-full space-y-2 relative z-10">
 <div className="flex items-center justify-center gap-2 px-1 w-full text-center">
 <FaChessPawn className="text-brand-primary opacity-40 text-xs" />
 <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-40">{t('recent_activity')}</h3>
 </div>
 <div className="space-y-2">
 {stats.recent_games.slice(0, 3).map((game: any, idx: number) => (
 <motion.div
 key={game.game_id}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: idx * 0.05 }}
 className="glass-panel p-3 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${
 game.result === 'win' ? 'bg-brand-primary text-brand-void border-brand-primary shadow-sm' :
 game.result === 'loss' ? 'bg-brand-surface text-brand-primary border-brand-border-opacity-20 opacity-80' :
 'bg-brand-surface text-brand-primary border-brand-border-opacity-10 opacity-50'
 }`}>
 {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
 </div>

 <div className="flex flex-col">
 <span className="text-[11px] font-bold text-brand-primary opacity-90 leading-none mb-1">
 {t('vs')} {game.opponent.name}
 </span>
 <span className="text-[8px] font-medium text-brand-primary opacity-30 uppercase tracking-wider">
 {game.opponent.elo} {t('elo')}
 </span>
 </div>
 </div>

 <div className="flex items-center gap-3">
 <div className="flex flex-col items-end">
 <span className={`text-[11px] font-black ${game.elo_change > 0 ? 'text-brand-primary' :
 game.elo_change < 0 ? 'text-brand-primary opacity-60' : 'text-brand-primary opacity-40'
 }`}>
 {game.elo_change > 0 ? '+' : ''}{game.elo_change}
 </span>
 <span className="text-[7px] font-bold text-brand-primary opacity-35 uppercase tracking-widest">ELO</span>
 </div>
 <button
 onClick={() => handleShareResult(game)}
 className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center hover:bg-brand-bg-opacity-5 hover:text-brand-primary transition-all text-brand-primary opacity-40"
 >
 <FaShareAlt size={9} />
 </button>
 </div>
 </motion.div>
 ))}
 </div>
 </div>
 )}

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

 {/* Holographic Referral Gold-Dust Popup */}
 <AnimatePresence>
 {showReferralPopup && (
 <motion.div
 initial={{ opacity: 0, y: -50, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -20, scale: 0.95 }}
 transition={{ type: "spring", damping: 20 }}
 className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
 >
 <div 
 className="w-[90vw] max-w-[300px] p-3 rounded-2xl border border-amber-500/20 bg-brand-surface/95 backdrop-blur-xl shadow-premium flex items-center gap-3 relative overflow-hidden pointer-events-auto"
 >
 <div 
 className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-500/30 bg-amber-500/10 dark:border-amber-400/30 dark:bg-amber-400/10 relative z-10 shrink-0"
 >
 <FaCoins className="text-amber-500 dark:text-amber-400 text-sm" />
 </div>
 
 <div className="flex flex-col relative z-10 min-w-0 flex-1 pr-4">
 <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">{t('referral_commission')}</span>
 <span className="text-xs font-black text-brand-primary tracking-wide">+$2.45 USDT</span>
 <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest truncate mt-0.5">{t('from_player', { name: 'Grandmaster' })}</span>
 </div>

 {/* Close Button */}
 <button
 onClick={() => setShowReferralPopup(false)}
 className="absolute top-3 right-3 text-brand-primary opacity-30 hover:opacity-100 transition-opacity p-0.5 cursor-pointer z-20"
 aria-label="Close notification"
 >
 <FaTimes size={8} />
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 
 </LayoutWrapper >
 );
}
