'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaBolt } from 'react-icons/fa';

import { apiFetch } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { telegramHaptic } from '@/lib/telegram';

interface StandingRow {
  rank: number;
  user_id: number;
  name: string;
  score: number;
  wins: number;
  draws: number;
  losses: number;
  games_played: number;
}

interface ArenaStatus {
  status: 'scheduled' | 'live' | 'settling' | 'finished';
  starts_at: string;
  ends_at: string;
  server_now: string;
  prizes_xp: number[];
  participation_xp: number;
  participants: number;
  standings: StandingRow[];
  me: StandingRow | null;
  in_pool: boolean;
}

const fmtCountdown = (ms: number): string => {
  if (ms <= 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (hh > 0) return `${hh}:${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
};

export default function ArenaBanner() {
  const t = useTranslations('Arena');
  const [arena, setArena] = useState<ArenaStatus | null>(null);
  const [joined, setJoined] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  // Offset between client clock and server clock, so countdowns are honest
  const serverOffsetRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/arena/status');
      if (!res.ok) return;
      const data: ArenaStatus = await res.json();
      serverOffsetRef.current = new Date(data.server_now).getTime() - Date.now();
      setArena(data);
      setJoined(data.in_pool);
    } catch {
      /* transient — next poll retries */
    }
  }, []);

  // Poll: every 30s normally, every 10s while live
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, arena?.status === 'live' ? 10000 : 30000);
    return () => clearInterval(interval);
  }, [refresh, arena?.status]);

  // Local 1s tick for countdowns
  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Socket confirmations for join/leave
  useEffect(() => {
    const socket = getSocket();
    const onArenaStatus = (data: any) => {
      if (data.status === 'joined') setJoined(true);
      if (data.status === 'left') setJoined(false);
    };
    socket.on('arena_status', onArenaStatus);
    return () => {
      socket.off('arena_status', onArenaStatus);
    };
  }, []);

  const handleJoin = () => {
    telegramHaptic('medium');
    getSocket().emit('join_arena', {});
  };

  const handleLeave = () => {
    telegramHaptic('light');
    getSocket().emit('leave_arena', {});
  };

  if (!arena) return null;

  const serverNow = nowMs + serverOffsetRef.current;
  const startsIn = new Date(arena.starts_at).getTime() - serverNow;
  const endsIn = new Date(arena.ends_at).getTime() - serverNow;
  const isLive = arena.status === 'live';
  const prizes = arena.prizes_xp?.join(' / ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full mb-4 p-4 rounded-3xl border relative overflow-hidden ${
        isLive
          ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-brand-surface shadow-[0_0_24px_rgba(245,158,11,0.15)]'
          : 'border-brand-primary/15 bg-brand-surface/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-9 h-9 shrink-0 rounded-2xl flex items-center justify-center ${isLive ? 'bg-amber-500/20 text-amber-400' : 'bg-brand-primary/10 text-brand-primary'}`}>
            <FaTrophy size={15} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary truncate">
              {t('title')}
            </span>
            {isLive ? (
              <span className="text-[9px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {t('live_now')} · {t('ends_in')} {fmtCountdown(endsIn)} · {arena.participants} {t('players')}
              </span>
            ) : arena.status === 'settling' || arena.status === 'finished' ? (
              <span className="text-[9px] font-bold text-brand-primary/50 uppercase tracking-wider">
                {t('finished')} · {t('next_in')} {fmtCountdown(startsIn)}
              </span>
            ) : (
              <span className="text-[9px] font-bold text-brand-primary/50 uppercase tracking-wider">
                {t('starts_in')} {fmtCountdown(startsIn)} · 🏆 {prizes} XP
              </span>
            )}
          </div>
        </div>

        {isLive && (
          joined ? (
            <button
              onClick={handleLeave}
              className="shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-400/30 text-red-400 bg-red-500/10"
            >
              {t('leave')}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-[0_0_16px_rgba(245,158,11,0.4)] animate-pulse flex items-center gap-1.5"
            >
              <FaBolt size={10} /> {t('join')}
            </button>
          )
        )}
      </div>

      <AnimatePresence>
        {isLive && joined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[9px] font-bold text-brand-primary/60 mt-2.5 leading-relaxed">
              {t('waiting_hint')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {isLive && arena.standings.length > 0 && (
        <div className="mt-3 space-y-1">
          {arena.standings.slice(0, 3).map((row) => (
            <div key={row.user_id} className="flex items-center justify-between text-[10px] font-bold">
              <span className="truncate text-brand-primary/70">
                {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : '🥉'} {row.name}
              </span>
              <span className="text-brand-primary tabular-nums">
                {row.score} {t('pts')} · {row.wins}W {row.draws}D {row.losses}L
              </span>
            </div>
          ))}
          {arena.me && arena.me.rank > 3 && (
            <div className="flex items-center justify-between text-[10px] font-black pt-1 border-t border-brand-primary/10">
              <span className="truncate text-amber-500 dark:text-amber-400">#{arena.me.rank} {t('you')}</span>
              <span className="text-amber-500 dark:text-amber-400 tabular-nums">
                {arena.me.score} {t('pts')} · {arena.me.wins}W {arena.me.draws}D {arena.me.losses}L
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
