'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaUserCircle } from 'react-icons/fa';
import { getFullPhotoUrl } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useTranslations } from 'next-intl';

interface LeaderboardItem {
 telegram_id: number;
 first_name: string;
 last_name?: string;
 photo_url?: string;
 elo: number;
 rank: number;
}

 export default function Leaderboard() {
 const t = useTranslations('Index');
 const { data: playersData, isLoading: loading } = useSWRFetch('/api/v1/users/leaderboard');
 const players: LeaderboardItem[] = Array.isArray(playersData) ? playersData : [];
 const [brokenAvatars, setBrokenAvatars] = useState<Record<number, boolean>>({});
 const [showModal, setShowModal] = useState(false);

 // Lock background scroll while the full ranking modal is open — otherwise
 // the Home page underneath can still scroll/repaint behind this "fixed"
 // overlay (observed on iOS Telegram: the News section bled through).
 useEffect(() => {
   if (!showModal) return;
   const originalOverflow = document.body.style.overflow;
   const originalOverflowX = document.body.style.overflowX;
   document.body.style.overflow = 'hidden';
   document.body.style.overflowX = 'hidden';
   return () => {
     document.body.style.overflow = originalOverflow;
     document.body.style.overflowX = originalOverflowX;
   };
 }, [showModal]);



 const getRankIcon = (rank: number) => {
 if (rank === 1) return <FaTrophy className="text-yellow-400 drop-shadow-glow" />;
 if (rank === 2) return <FaMedal className="text-slate-300" />;
 if (rank === 3) return <FaMedal className="text-amber-600" />;
 return <span className="text-[10px] font-black opacity-30">#{rank}</span>;
 };

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex flex-col items-center space-y-2 mb-4 animate-pulse">
          <div className="h-4 bg-brand-primary opacity-10 rounded w-32" />
          <div className="h-px w-8 bg-brand-border-opacity-20" />
          <div className="h-2 bg-brand-primary opacity-5 rounded w-24" />
        </div>
        
        <div className="glass-panel rounded-3xl overflow-hidden border-brand-border-opacity-5 bg-brand-bg-opacity-5 p-1 space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-brand-surface/30 rounded-2xl animate-pulse border border-brand-border-opacity-5">
              <div className="flex items-center gap-4 w-2/3">
                <div className="w-6 h-4 bg-brand-primary opacity-10 rounded shrink-0" />
                <div className="w-8 h-8 rounded-full bg-brand-primary opacity-10 shrink-0" />
                <div className="flex flex-col space-y-1.5 w-full">
                  <div className="h-2.5 bg-brand-primary opacity-10 rounded w-2/3" />
                  <div className="h-1.5 bg-brand-primary opacity-5 rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-brand-primary opacity-10 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayedPlayers = players.slice(0, 5);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col items-center space-y-2 mb-4">
        <h3 className="text-sm font-black text-brand-primary tracking-tighter uppercase leading-none">{t('global_ranking')}</h3>
        <div className="h-px w-8 bg-brand-border-opacity-20" />
        <span className="text-[8px] font-bold text-brand-primary opacity-30 tracking-[0.4em] uppercase">{t('global_node_sync')}</span>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border-brand-border-opacity-5 bg-brand-bg-opacity-5">
        <div className="divide-y divide-brand-border-opacity-10">
          {displayedPlayers.length > 0 ? (
            displayedPlayers.map((item, idx) => (
              <motion.div
                key={item.telegram_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-4 group hover:bg-brand-bg-opacity-10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-6 flex justify-center">
                    {getRankIcon(item.rank)}
                  </div>
                  <div className="relative">
                    {item.photo_url && !brokenAvatars[item.telegram_id] ? (
                      <img 
                        src={getFullPhotoUrl(item.photo_url)} 
                        alt="" 
                        loading="lazy"
                        decoding="async"
                        onError={() => setBrokenAvatars(prev => ({ ...prev, [item.telegram_id]: true }))}
                        className="w-8 h-8 rounded-full border border-brand-border-opacity-10 object-cover" 
                      />
                    ) : (
                      <FaUserCircle className="w-8 h-8 text-brand-primary opacity-20" />
                    )}
                    {item.rank <= 3 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-brand-primary opacity-80 uppercase truncate max-w-[120px]">
                      {item.first_name} {item.last_name}
                    </span>
                    <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mt-0.5">
                      {t('active_protocol')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-black text-brand-primary tracking-tighter">
                    {item.elo} <span className="text-[8px] opacity-40 not-italic">EL</span>
                  </div>
                  <div className="h-1 w-16 bg-brand-bg-opacity-10 rounded-full mt-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item.elo / 2500) * 100)}%` }}
                      className="h-full bg-brand-primary opacity-40"
                    />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center text-brand-primary opacity-20 uppercase font-black text-[10px] tracking-widest">
              {t('no_data')}
            </div>
          )}
        </div>

        {players.length > 5 && (
          <div className="flex justify-center p-4 border-t border-brand-border-opacity-10 bg-brand-surface/20">
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 rounded-2xl bg-brand-surface hover:bg-brand-bg-opacity-10 border border-brand-border-opacity-10 text-[10px] font-black uppercase tracking-wider text-brand-primary/80 hover:text-brand-primary active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <FaTrophy className="text-brand-primary opacity-60 text-[11px]" />
              {t('show_top_50')}
            </button>
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-void/80 backdrop-blur-md modal-backdrop"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="w-full max-w-md max-h-[80vh] bg-brand-surface border border-brand-border-opacity-10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-brand-border-opacity-10 bg-brand-void/20">
                <div className="flex flex-col">
                  <h3 className="text-sm font-black text-brand-primary tracking-tighter uppercase leading-none">{t('global_ranking')}</h3>
                  <span className="text-[8px] font-bold text-brand-primary opacity-30 tracking-[0.4em] uppercase mt-1.5">{t('global_node_sync')}</span>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-brand-bg-opacity-10 hover:bg-brand-bg-opacity-20 border border-brand-border-opacity-10 flex items-center justify-center text-brand-primary opacity-60 hover:opacity-100 active:scale-95 transition-all text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
                {players.map((item, idx) => (
                  <motion.div
                    key={`modal-${item.telegram_id}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(20, idx) * 0.02 }}
                    className="flex items-center justify-between p-4 bg-brand-bg-opacity-5 hover:bg-brand-bg-opacity-10 border border-brand-border-opacity-5 rounded-2xl transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-6 flex justify-center">
                        {getRankIcon(item.rank)}
                      </div>
                      <div className="relative">
                        {item.photo_url && !brokenAvatars[item.telegram_id] ? (
                          <img 
                            src={getFullPhotoUrl(item.photo_url)} 
                            alt="" 
                            loading="lazy"
                            decoding="async"
                            onError={() => setBrokenAvatars(prev => ({ ...prev, [item.telegram_id]: true }))}
                            className="w-10 h-10 rounded-full border border-brand-border-opacity-10 object-cover shadow-lg" 
                          />
                        ) : (
                          <FaUserCircle className="w-8 h-8 text-brand-primary opacity-20" />
                        )}
                        {item.rank <= 3 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-brand-primary opacity-80 uppercase truncate max-w-[140px]">
                          {item.first_name} {item.last_name}
                        </span>
                        <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mt-0.5">
                          {t('active_protocol')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-black text-brand-primary tracking-tighter">
                        {item.elo} <span className="text-[8px] opacity-40 not-italic">EL</span>
                      </div>
                      <div className="h-1 w-16 bg-brand-bg-opacity-10 rounded-full mt-1 overflow-hidden ml-auto">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (item.elo / 2500) * 100)}%` }}
                          className="h-full bg-brand-primary opacity-40"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
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
