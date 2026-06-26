'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaUserCircle } from 'react-icons/fa';
import { apiFetch, getFullPhotoUrl } from '@/lib/api';
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
 const [players, setPlayers] = useState<LeaderboardItem[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 apiFetch('/api/v1/users/leaderboard')
 .then(res => res.json())
 .then(data => {
 setPlayers(Array.isArray(data) ? data : []);
 setLoading(false);
 })
 .catch(err => {
 console.error("Failed to fetch leaderboard", err);
 setLoading(false);
 });
 }, []);

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

 return (
 <div className="w-full space-y-6">
 <div className="flex flex-col items-center space-y-2 mb-4">
 <h3 className="text-sm font-black text-brand-primary tracking-tighter uppercase leading-none">{t('global_ranking')}</h3>
 <div className="h-px w-8 bg-brand-border-opacity-20" />
 <span className="text-[8px] font-bold text-brand-primary opacity-30 tracking-[0.4em] uppercase">{t('global_node_sync')}</span>
 </div>

 <div className="glass-panel rounded-3xl overflow-hidden border-brand-border-opacity-5 bg-brand-bg-opacity-5">
 <div className="divide-y divide-brand-border-opacity-10">
 {players.length > 0 ? (
 players.map((item, idx) => (
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
 {item.photo_url ? (
 <img src={getFullPhotoUrl(item.photo_url)} alt="" className="w-8 h-8 rounded-full border border-brand-border-opacity-10" />
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
 <span className="text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-widest">
 {t('active_protocol')}
 </span>
 </div>
 </div>
 <div className="text-right">
 <div className="text-[12px] font-black text-brand-primary tracking-tighter">
 {item.elo} <span className="text-[8px] opacity-40 not-italic">EL</span>
 </div>
 <div className="h-1 w-full bg-brand-bg-opacity-10 rounded-full mt-1 overflow-hidden">
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
 </div>
 </div>
 );
}
