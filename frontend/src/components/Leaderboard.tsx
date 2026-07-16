'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaUserCircle, FaFire, FaBook, FaGamepad, FaCrown, FaChessKnight } from 'react-icons/fa';
import { FiX, FiAward, FiClock, FiChevronRight, FiRadio, FiZap } from 'react-icons/fi';
import { getFullPhotoUrl } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { useNavbar } from '@/context/NavbarContext';

interface LeaderboardItem {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  elo?: number;
  games_played?: number;
  win_rate?: number;
  xp?: number;
  study_streak?: number;
  rank: number;
}

export default function Leaderboard() {
 const t = useTranslations('Index');
 const [activeTab, setActiveTab] = useState<'arena' | 'academy'>('arena');
 const { data: arenaData, isLoading: loadingArena } = useSWRFetch('/api/v1/users/leaderboard');
 const { data: academyData, isLoading: loadingAcademy } = useSWRFetch('/api/v1/users/leaderboard/academy');
 
 const players: LeaderboardItem[] = activeTab === 'arena' 
   ? (Array.isArray(arenaData) ? arenaData : [])
   : (Array.isArray(academyData) ? academyData : []);
 const loading = activeTab === 'arena' ? loadingArena : loadingAcademy;

 const [brokenAvatars, setBrokenAvatars] = useState<Record<number, boolean>>({});
 const [showModal, setShowModal] = useState(false);
 const { pushHide, popHide } = useNavbar();

 useEffect(() => {
   if (!showModal) return;
   pushHide();
   const originalOverflow = document.body.style.overflow;
   const originalOverflowX = document.body.style.overflowX;
   document.body.style.overflow = 'hidden';
   document.body.style.overflowX = 'hidden';
   return () => {
     document.body.style.overflow = originalOverflow;
     document.body.style.overflowX = originalOverflowX;
     popHide();
   };
 }, [showModal, pushHide, popHide]);

 const getRankConfig = (rank: number) => {
   if (rank === 1) return {
     icon: <FaCrown className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)]" size={14} />,
     label: '1',
     rowBg: 'bg-gradient-to-r from-yellow-500/15 via-yellow-500/5 to-transparent',
     borderLeft: '',
     glow: 'shadow-[inset_0_0_30px_rgba(250,204,21,0.08)]',
     avatarRing: 'ring-2 ring-yellow-400/60 ring-offset-1 ring-offset-transparent',
     barColor: 'bg-gradient-to-r from-yellow-400 to-amber-300',
     rankBg: 'bg-yellow-500/10 text-yellow-400',
   };
   if (rank === 2) return {
     icon: <FaMedal className="text-slate-300" size={13} />,
     label: '2',
     rowBg: 'bg-gradient-to-r from-slate-300/10 via-slate-300/5 to-transparent',
     borderLeft: '',
     glow: 'shadow-[inset_0_0_20px_rgba(203,213,225,0.05)]',
     avatarRing: 'ring-2 ring-slate-300/50 ring-offset-1 ring-offset-transparent',
     barColor: 'bg-gradient-to-r from-slate-300 to-slate-200',
     rankBg: 'bg-slate-300/10 text-slate-300',
   };
   if (rank === 3) return {
     icon: <FaMedal className="text-amber-600" size={13} />,
     label: '3',
     rowBg: 'bg-gradient-to-r from-amber-700/12 via-amber-700/5 to-transparent',
     borderLeft: '',
     glow: 'shadow-[inset_0_0_20px_rgba(180,83,9,0.08)]',
     avatarRing: 'ring-2 ring-amber-600/50 ring-offset-1 ring-offset-transparent',
     barColor: 'bg-gradient-to-r from-amber-600 to-amber-500',
     rankBg: 'bg-amber-700/10 text-amber-600',
   };
   return {
     icon: null,
     label: `#${rank}`,
     rowBg: 'hover:bg-white/[0.02]',
     borderLeft: '',
     glow: '',
     avatarRing: 'ring-1 ring-white/10',
     barColor: 'bg-white/25',
     rankBg: 'text-white/25',
   };
 };

 if (loading) {
   return (
     <div className="w-full space-y-6">
       <div className="flex flex-col items-center space-y-2 mb-4 animate-pulse">
         <div className="h-4 bg-brand-primary opacity-10 rounded w-32" />
         <div className="h-px w-8 bg-brand-border-opacity-20" />
         <div className="h-2 bg-brand-primary opacity-5 rounded w-24" />
       </div>
       <Card variant="glass" className="rounded-3xl overflow-hidden border-brand-border-opacity-5 bg-brand-bg-opacity-5 p-1 space-y-2">
         {Array.from({ length: 5 }).map((_, idx) => (
           <div key={idx} className="flex items-center justify-between p-4 bg-brand-surface/30 rounded-2xl animate-pulse border border-brand-border-opacity-5">
             <div className="flex items-center gap-4 w-2/3">
               <div className="w-6 h-4 bg-brand-primary opacity-10 rounded shrink-0" />
               <div className="w-9 h-9 rounded-full bg-brand-primary opacity-10 shrink-0" />
               <div className="flex flex-col space-y-1.5 w-full">
                 <div className="h-2.5 bg-brand-primary opacity-10 rounded w-2/3" />
                 <div className="h-1.5 bg-brand-primary opacity-5 rounded w-1/3" />
               </div>
             </div>
             <div className="h-3 bg-brand-primary opacity-10 rounded w-12" />
           </div>
         ))}
       </Card>
     </div>
   );
 }

 const displayedPlayers = players.slice(0, 5);
 const metricLabel = activeTab === 'arena' ? 'Elo rating' : 'Academy XP';
 const leader = players[0];
 const leaderScore = leader ? (activeTab === 'arena' ? (leader.elo || 0) : (leader.xp || 0)) : 0;
 const secondScore = players[1] ? (activeTab === 'arena' ? (players[1].elo || 0) : (players[1].xp || 0)) : 0;
 const leaderGap = Math.max(0, leaderScore - secondScore);
 const topScore = activeTab === 'arena'
   ? Math.max(...players.map(p => p.elo || 1000), 2500)
   : Math.max(...players.map(p => p.xp || 0), 5000);

 const renderRow = (item: LeaderboardItem, idx: number, isModal = false) => {
   const cfg = getRankConfig(item.rank);
   const score = activeTab === 'arena' ? (item.elo || 0) : (item.xp || 0);
   const barPct = Math.min(100, Math.round((score / topScore) * 100));
   const hasActivity = (item.games_played || 0) > 0 || (item.xp || 0) > 0;
   const isPodium = item.rank <= 3;
   const rankCallout = item.rank === 1 ? 'Crown holder' : item.rank === 2 ? 'First challenger' : item.rank === 3 ? 'Rising force' : null;
   const avatarSize = item.rank === 1 ? 'w-11 h-11' : 'w-9 h-9';
   const rowFrame = item.rank === 1
     ? 'border border-yellow-400/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.18)]'
     : item.rank === 2
       ? 'border border-slate-300/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
       : item.rank === 3
         ? 'border border-amber-600/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
         : 'border border-white/[0.055]';

   return (
     <motion.div
       key={item.telegram_id + (isModal ? '-modal' : '')}
       initial={{ opacity: 0, x: -8 }}
       animate={{ opacity: 1, x: 0 }}
       whileHover={{ x: isModal ? 0 : 3 }}
       transition={{ delay: Math.min(idx * 0.04, 0.2), type: 'spring', stiffness: 380, damping: 28 }}
       className={`relative flex items-center justify-between px-4 ${item.rank === 1 ? 'py-4' : 'py-3.5'} group transition-colors duration-200 overflow-hidden rounded-2xl
         ${cfg.rowBg} ${cfg.borderLeft} ${cfg.glow} ${rowFrame}
         ${isModal ? 'mb-2' : ''}
       `}
     >
       {item.rank === 1 && (
        <div aria-hidden="true" className="absolute inset-y-0 left-1/2 w-16 -translate-x-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-yellow-200/10 to-transparent pointer-events-none" />
       )}
       {/* Rank Badge */}
       <div className="w-9 flex justify-center shrink-0 relative z-10">
         {item.rank <= 3 ? (
           <div className={`flex flex-col items-center justify-center ${item.rank === 1 ? 'w-9 h-9 rounded-xl' : 'w-8 h-8 rounded-lg'} ${cfg.rankBg} ${item.rank === 1 ? 'shadow-[0_0_20px_rgba(250,204,21,0.16)]' : ''}`}>
             {cfg.icon}
             <span className="text-[8px] font-black leading-none mt-0.5">{cfg.label}</span>
           </div>
         ) : (
           <span className={`text-[10px] font-black ${cfg.rankBg}`}>{cfg.label}</span>
         )}
       </div>

       {/* Avatar */}
       <div className={`relative shrink-0 mx-2 ${item.rank === 1 ? 'p-0.5 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-500 to-amber-700 shadow-[0_0_22px_rgba(250,204,21,0.22)]' : ''}`}>
         {item.photo_url && !brokenAvatars[item.telegram_id] ? (
           <img
             src={getFullPhotoUrl(item.photo_url)}
             alt=""
             loading={idx < 5 ? 'eager' : 'lazy'}
             decoding={idx < 5 ? 'sync' : 'async'}
             fetchPriority={idx < 3 ? 'high' : 'auto'}
             onError={() => setBrokenAvatars(prev => ({ ...prev, [item.telegram_id]: true }))}
             className={`${avatarSize} rounded-full object-cover ${cfg.avatarRing}`}
           />
         ) : (
           <div className={`${avatarSize} rounded-full flex items-center justify-center bg-white/5 ${cfg.avatarRing}`}>
             <FaUserCircle className="text-brand-primary opacity-20" size={22} />
           </div>
         )}
         {/* Online pulse for top 3 */}
         {item.rank <= 3 && (
           <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-void
             ${item.rank === 1 ? 'bg-yellow-400' : item.rank === 2 ? 'bg-slate-300' : 'bg-amber-600'}
             animate-pulse`}
           />
         )}
       </div>

       {/* Name + Stats */}
       <div className="flex flex-col flex-1 min-w-0 relative z-10">
         <div className="flex items-center gap-2 min-w-0">
           <span className={`text-[11px] font-black uppercase tracking-tight truncate leading-none ${isPodium ? 'text-brand-primary' : 'text-brand-primary/70'}`}>
             {item.first_name}{item.last_name ? ` ${item.last_name}` : ''}
           </span>
           {rankCallout && (
             <span className={`hidden sm:inline-flex items-center shrink-0 px-1.5 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.12em] ${item.rank === 1 ? 'border-yellow-400/25 bg-yellow-400/10 text-yellow-300/90' : 'border-white/10 bg-white/[0.04] text-brand-primary/35'}`}>
               {item.rank === 1 && <FiZap size={8} className="mr-0.5" />}{rankCallout}
             </span>
           )}
         </div>
         <div className="flex items-center gap-1.5 mt-1">
           {activeTab === 'arena' ? (
             <>
               <span className={`text-[8px] font-bold uppercase tracking-widest ${hasActivity ? 'text-brand-primary/50' : 'text-brand-primary/20'}`}>
                 {item.games_played || 0}G
               </span>
               {hasActivity && (
                 <>
                   <span className="w-px h-2.5 bg-white/10" />
                   <span className={`text-[8px] font-black uppercase tracking-widest ${(item.win_rate || 0) >= 50 ? 'text-emerald-400/80' : 'text-brand-primary/40'}`}>
                     {item.win_rate || 0}% W
                   </span>
                 </>
               )}
               {!hasActivity && (
                 <span className="text-[8px] font-bold text-white/15 uppercase tracking-widest">No games yet</span>
               )}
             </>
           ) : (
             <span className={`text-[8px] font-black flex items-center gap-1 uppercase tracking-widest ${(item.study_streak || 0) > 0 ? 'text-orange-400/80' : 'text-white/20'}`}>
               {(item.study_streak || 0) > 0 ? <><FaFire size={8} /> {item.study_streak} streak</> : 'No streak yet'}
             </span>
           )}
         </div>
       </div>

       {/* Score + Bar */}
       <div className="flex flex-col items-end shrink-0 ml-2 relative z-10">
         <div className="text-right">
           <span className={`text-[13px] font-black tracking-tighter leading-none ${item.rank === 1 ? 'text-yellow-300' : item.rank === 2 ? 'text-slate-200' : item.rank === 3 ? 'text-amber-500' : 'text-brand-primary/80'}`}>
             {score.toLocaleString()}
           </span>
           <span className="text-[8px] font-black opacity-30 ml-1 not-italic">
             {activeTab === 'arena' ? 'ELO' : 'XP'}
           </span>
         </div>
         {/* Progress bar — colored & proportional to top score */}
         <div className={`h-1 ${item.rank === 1 ? 'w-16' : 'w-14'} bg-white/5 rounded-full mt-1.5 overflow-hidden`}>
           <motion.div
             initial={{ width: 0 }}
             animate={{ width: `${barPct}%` }}
             transition={{ delay: idx * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
             className={`h-full rounded-full ${cfg.barColor}`}
           />
         </div>
       </div>
     </motion.div>
   );
 };

 return (
   <div className="w-full space-y-4">
     {/* Section Header */}
     <div className="flex flex-col items-center text-center gap-2">
       <div className="flex items-center justify-center gap-2">
         <span className="w-7 h-7 rounded-lg border border-yellow-400/25 bg-gradient-to-br from-yellow-400/20 to-amber-600/10 text-yellow-300 flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.12)]">
           <FaChessKnight size={13} />
         </span>
         <h3 className="text-base font-black text-brand-primary tracking-tighter uppercase leading-none">{t('global_ranking')}</h3>
       </div>
       <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.18em]">
         <span className="flex items-center gap-1.5 text-yellow-300/85"><FiAward size={11} /> Season 1</span>
         <span className="w-1 h-1 rounded-full bg-white/20" />
         <span className="flex items-center gap-1 text-brand-primary/35"><FiRadio size={8} className="text-emerald-400" /> Live ladder</span>
       </div>
     </div>

     {/* Tab Switcher */}
     <div className="flex bg-black/35 rounded-2xl p-1 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] relative">
      <button
         onClick={() => setActiveTab('arena')}
         aria-pressed={activeTab === 'arena'}
         className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl z-10 ${activeTab === 'arena' ? 'text-yellow-100' : 'text-brand-primary/50 hover:text-brand-primary/80'}`}
       >
         <FaGamepad size={10} /> Arena
       </button>
      <button
         onClick={() => setActiveTab('academy')}
         aria-pressed={activeTab === 'academy'}
         className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl z-10 ${activeTab === 'academy' ? 'text-yellow-100' : 'text-brand-primary/50 hover:text-brand-primary/80'}`}
       >
         <FaBook size={10} /> Scholars
       </button>
       <motion.div
         initial={false}
         animate={{ x: activeTab === 'arena' ? '0%' : '100%' }}
         transition={{ type: 'spring', stiffness: 400, damping: 30 }}
         className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-600 rounded-xl shadow-[0_0_18px_rgba(250,204,21,0.22)]"
       />
     </div>

     {/* Leaderboard Card */}
     <Card variant="glass" className="rounded-3xl overflow-hidden border-white/[0.08] bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.10),transparent_42%),linear-gradient(135deg,rgba(255,255,255,0.035),rgba(0,0,0,0.16))] shadow-[0_18px_45px_rgba(0,0,0,0.28)] p-0">
       <div className="relative flex items-center justify-between gap-3 px-5 py-4 border-b border-yellow-400/10 bg-gradient-to-r from-yellow-400/[0.07] via-transparent to-transparent overflow-hidden">
         <div aria-hidden="true" className="absolute -right-8 -top-10 w-32 h-32 rounded-full bg-yellow-400/[0.05] blur-2xl" />
         <div className="min-w-0">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-200/85">{activeTab === 'arena' ? 'Arena ladder' : 'Scholar ladder'}</p>
           <p className="text-[8px] font-bold uppercase tracking-wider text-brand-primary/35 mt-1 truncate">
             {metricLabel} · {activeTab === 'arena' ? 'Win games to climb' : 'Study daily to climb'}
           </p>
         </div>
         <div className="shrink-0 flex flex-col items-end gap-1 text-[8px] font-bold uppercase tracking-wider text-brand-primary/30 relative z-10">
           <span className="flex items-center gap-1.5"><FiClock size={10} /> Refreshes every 5 min</span>
           {leaderGap > 0 && <span className="text-yellow-300/55">Leader +{leaderGap.toLocaleString()}</span>}
         </div>
       </div>
       <AnimatePresence mode="wait">
         <motion.div
           key={activeTab}
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           transition={{ duration: 0.15 }}
           className="space-y-2 p-2"
         >
           {displayedPlayers.length > 0 ? (
             displayedPlayers.map((item, idx) => renderRow(item, idx))
           ) : (
             <div className="py-10 px-6 text-center">
               <FaChessKnight className="mx-auto text-brand-primary/15 mb-3" size={22} />
               <p className="text-brand-primary/40 uppercase font-black text-[10px] tracking-widest">{t('no_data')}</p>
               <p className="text-brand-primary/25 text-[9px] font-bold mt-2">Complete a game or lesson to enter the standings.</p>
             </div>
           )}
         </motion.div>
       </AnimatePresence>

       {players.length > 5 && (
         <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-white/[0.06] bg-gradient-to-r from-black/20 to-white/[0.02]">
           <span className="text-[8px] font-bold uppercase tracking-wider text-brand-primary/25">Showing 5 of {Math.min(players.length, 50)} contenders</span>
           <button
             onClick={() => setShowModal(true)}
             className="flex shrink-0 items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/15 to-amber-500/10 hover:from-yellow-500/25 hover:to-amber-500/20 border border-yellow-400/20 text-[9px] font-black uppercase tracking-wider text-yellow-100/85 hover:text-yellow-100 active:scale-95 transition-all shadow-[0_6px_20px_rgba(0,0,0,0.16)]"
           >
             <FaTrophy size={10} className="opacity-60" />
             View all
             <FiChevronRight size={12} />
           </button>
         </div>
       )}
     </Card>

     {/* Full Ranking Modal */}
     {typeof document !== 'undefined' && createPortal(
       <AnimatePresence>
         {showModal && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-brand-void/80 backdrop-blur-md modal-backdrop"
             onClick={() => setShowModal(false)}
           >
             <motion.div
               initial={{ y: '100%', scale: 1 }}
               animate={{ y: 0, scale: 1 }}
               exit={{ y: '100%' }}
               transition={{ type: 'spring', damping: 32, stiffness: 360 }}
               className="w-full max-w-md max-h-[85vh] bg-brand-surface border border-white/8 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
               onClick={(e) => e.stopPropagation()}
             >
               {/* Modal Header */}
               <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
                 <div>
                   <h3 className="text-sm font-black text-brand-primary tracking-tighter uppercase leading-none">{t('global_ranking')}</h3>
                   <span className="text-[9px] font-bold text-brand-primary/30 tracking-[0.3em] uppercase mt-1 block">{t('global_node_sync')} · {players.length} players</span>
                 </div>
                 <button
                   onClick={() => setShowModal(false)}
                   className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center text-brand-primary/50 hover:text-brand-primary active:scale-95 transition-all"
                 >
                   <FiX size={14} />
                 </button>
               </div>

               {/* Tab switcher inside modal */}
               <div className="px-4 pt-3 pb-0">
                 <div className="flex bg-white/[0.03] rounded-xl p-0.5 border border-white/[0.05] relative">
                   <button onClick={() => setActiveTab('arena')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all rounded-lg z-10 ${activeTab === 'arena' ? 'text-brand-void' : 'text-brand-primary/40'}`}>
                     <FaGamepad size={9} /> Arena
                   </button>
                   <button onClick={() => setActiveTab('academy')} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all rounded-lg z-10 ${activeTab === 'academy' ? 'text-brand-void' : 'text-brand-primary/40'}`}>
                     <FaBook size={9} /> Scholars
                   </button>
                   <motion.div
                     initial={false}
                     animate={{ x: activeTab === 'arena' ? '0%' : '100%' }}
                     transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                     className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] bg-brand-primary rounded-[9px]"
                   />
                 </div>
               </div>

               {/* Scrollable list */}
               <div className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth">
                 <AnimatePresence mode="wait">
                   <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     {players.map((item, idx) => renderRow(item, idx, true))}
                   </motion.div>
                 </AnimatePresence>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>,
       document.body
     )}
   </div>
 );
}
