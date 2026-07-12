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
      className={`w-full mb-4 p-4 rounded-3xl border relative overflow-hidden backdrop-blur-md transition-all duration-500 ${
        isLive
          ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-brand-surface/90 to-brand-surface shadow-[0_8px_32px_-4px_rgba(245,158,11,0.25)]'
          : 'border-brand-primary/15 bg-brand-surface/60'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 shrink-0 rounded-[14px] flex items-center justify-center transition-all duration-300 ${isLive ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-[0_0_16px_rgba(245,158,11,0.5)]' : 'bg-brand-primary/10 text-brand-primary'}`}>
            <FaTrophy size={16} />
          </div>
          <div className="flex flex-col min-w-0 justify-center">
            <span className="text-[12px] font-black uppercase tracking-widest text-brand-primary truncate leading-tight">
              {t('title')}
            </span>
            {isLive ? (
              <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                {t('live_now')} · {t('ends_in')} {fmtCountdown(endsIn)} · {arena.participants} {t('players')}
              </span>
            ) : arena.status === 'settling' || arena.status === 'finished' ? (
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mt-0.5">
                {t('finished')} · {t('next_in')} {fmtCountdown(startsIn)}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-brand-primary/50 uppercase tracking-wider mt-0.5">
                {t('starts_in')} {fmtCountdown(startsIn)} · 🏆 {prizes} XP
              </span>
            )}
          </div>
        </div>

        {isLive && (
          joined ? (
            <button
              onClick={handleLeave}
              className="shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-500/30 text-red-400 bg-red-500/10 active:scale-95 hover:bg-red-500/20 transition-all duration-200"
            >
              {t('leave')}
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className="shrink-0 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
            >
              <FaBolt size={10} /> {t('join')}
            </button>
          )
        )}
      </div>

      <AnimatePresence>
        {isLive && joined && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 flex items-start gap-2.5">
              <div className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary/40" />
              <p className="text-[11px] font-medium text-brand-primary/70 leading-relaxed">
                {t('waiting_hint')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLive && arena.standings.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          {arena.standings.slice(0, 3).map((row) => (
            <div key={row.user_id} className={`flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl ${row.user_id === arena.me?.user_id ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-brand-surface/50 border border-brand-primary/5 text-brand-primary/70'}`}>
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 text-center text-[13px]">
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : `${row.rank}.`}
                </span>
                <span className="truncate">{row.name} {row.user_id === arena.me?.user_id && <span className="opacity-60 font-medium">({t('you')})</span>}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="opacity-60 text-[10px] font-medium tracking-wide">
                  {row.wins}W {row.draws}D {row.losses}L
                </span>
                <span className="tabular-nums font-black bg-brand-surface/80 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                  {row.score} {t('pts')}
                </span>
              </div>
            </div>
          ))}
          {arena.me && arena.me.rank > 3 && (
            <div className="flex items-center justify-between text-[11px] font-bold p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mt-0.5">
              <div className="flex items-center gap-2 truncate">
                <span className="w-5 text-center opacity-70 text-[11px]">{arena.me.rank}.</span>
                <span className="truncate">{arena.me.name} <span className="opacity-60 font-medium">({t('you')})</span></span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="opacity-60 text-[10px] font-medium tracking-wide">
                  {arena.me.wins}W {arena.me.draws}D {arena.me.losses}L
                </span>
                <span className="tabular-nums font-black bg-brand-surface/80 px-2 py-0.5 rounded-md text-[10px] shadow-sm">
                  {arena.me.score} {t('pts')}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
