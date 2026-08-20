'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaMedal, FaCrown, FaChessKnight, FaGamepad, FaBook, FaFire } from 'react-icons/fa';
import { FiAward, FiClock, FiChevronRight, FiRadio } from 'react-icons/fi';
import { getFullPhotoUrl } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useTelemetry } from '@/hooks/useTelemetry';

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
  
  const players: LeaderboardItem[] = useMemo(() => {
    const raw = activeTab === 'arena' ? arenaData : academyData;
    return Array.isArray(raw) ? raw : [];
  }, [activeTab, arenaData, academyData]);

  const loading = activeTab === 'arena' ? loadingArena : loadingAcademy;

  const [brokenAvatars, setBrokenAvatars] = useState<Record<number, boolean>>({});
  const [showModal, setShowModal] = useState(false);
  const { trackEvent } = useTelemetry();

  useEffect(() => {
    trackEvent('leaderboard_viewed', { tab: activeTab });
  }, [activeTab, trackEvent]);

  const getRankConfig = (rank: number) => {
    if (rank === 1) return {
      icon: <FaCrown className="text-amber-400" size={14} />,
      label: '1',
      rowBg: 'bg-amber-500/10 border-amber-500/30',
      avatarRing: 'ring-2 ring-amber-400/60 ring-offset-1 ring-offset-brand-surface',
      barColor: 'bg-amber-400',
      rankBg: 'bg-amber-400/20 text-amber-300',
    };
    if (rank === 2) return {
      icon: <FaMedal className="text-slate-300" size={13} />,
      label: '2',
      rowBg: 'bg-slate-500/10 border-slate-400/30',
      avatarRing: 'ring-2 ring-slate-300/40 ring-offset-1 ring-offset-brand-surface',
      barColor: 'bg-slate-300',
      rankBg: 'bg-slate-700/40 text-slate-200',
    };
    if (rank === 3) return {
      icon: <FaMedal className="text-amber-600" size={13} />,
      label: '3',
      rowBg: 'bg-amber-900/10 border-amber-700/30',
      avatarRing: 'ring-2 ring-amber-600/40 ring-offset-1 ring-offset-brand-surface',
      barColor: 'bg-amber-600',
      rankBg: 'bg-amber-900/30 text-amber-400',
    };
    return {
      icon: null,
      label: `#${rank}`,
      rowBg: 'bg-brand-surface border-brand-border',
      avatarRing: 'ring-1 ring-brand-border',
      barColor: 'bg-brand-muted/40',
      rankBg: 'text-brand-muted',
    };
  };

  const displayedPlayers = useMemo(() => players.slice(0, 5), [players]);
  const metricLabel = activeTab === 'arena' ? 'Elo rating' : 'Academy XP';
  const leader = players[0];
  const leaderScore = leader ? (activeTab === 'arena' ? (leader.elo || 0) : (leader.xp || 0)) : 0;
  const secondScore = players[1] ? (activeTab === 'arena' ? (players[1].elo || 0) : (players[1].xp || 0)) : 0;
  const leaderGap = Math.max(0, leaderScore - secondScore);
  const topScore = useMemo(() => {
    if (players.length === 0) return activeTab === 'arena' ? 2500 : 5000;
    return activeTab === 'arena'
      ? Math.max(...players.map(p => p.elo || 1000), 2500)
      : Math.max(...players.map(p => p.xp || 0), 5000);
  }, [players, activeTab]);

  const renderRow = (item: LeaderboardItem, idx: number, isModal = false) => {
    const cfg = getRankConfig(item.rank);
    const score = activeTab === 'arena' ? (item.elo || 0) : (item.xp || 0);
    const barPct = Math.min(100, Math.round((score / topScore) * 100));
    const hasActivity = (item.games_played || 0) > 0 || (item.xp || 0) > 0;
    const avatarSize = item.rank === 1 ? 'w-10 h-10' : 'w-9 h-9';

    return (
      <div
        key={`${item.telegram_id}-${item.rank}`}
        className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${cfg.rowBg}`}
      >
        {/* Left: Rank & Player */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-black text-xs ${cfg.rankBg}`}>
            {cfg.icon || cfg.label}
          </div>

          <div className={`relative shrink-0 rounded-full overflow-hidden ${avatarSize} ${cfg.avatarRing} bg-brand-elevated`}>
            {item.photo_url && !brokenAvatars[item.telegram_id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getFullPhotoUrl(item.photo_url)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setBrokenAvatars(prev => ({ ...prev, [item.telegram_id]: true }))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-brand-muted font-bold text-xs">
                {item.first_name?.[0] || 'C'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold text-brand-primary truncate">
              {item.first_name} {item.last_name || ''}
            </p>
            <p className="text-[10px] text-brand-muted truncate">
              {activeTab === 'arena'
                ? `${item.games_played || 0} games · ${item.win_rate || 0}% win`
                : `${item.study_streak || 0} day streak`}
            </p>
          </div>
        </div>

        {/* Right: Score & Mini Progress */}
        <div className="flex flex-col items-end shrink-0 ml-3">
          <div className="text-right">
            <span className={`text-xs font-black font-mono ${item.rank === 1 ? 'text-amber-400' : 'text-brand-primary'}`}>
              {score.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-brand-muted ml-1">
              {activeTab === 'arena' ? 'ELO' : 'XP'}
            </span>
          </div>
          <div className="h-1 w-14 bg-brand-elevated rounded-full mt-1 overflow-hidden">
            <div
              style={{ width: `${barPct}%` }}
              className={`h-full rounded-full transition-all duration-300 ${cfg.barColor}`}
            />
          </div>
        </div>
      </div>
    );
  };

  const tabOptions = [
    { value: 'arena' as const, label: 'Arena', icon: <FaGamepad size={12} /> },
    { value: 'academy' as const, label: 'Scholars', icon: <FaBook size={12} /> },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex flex-col items-center text-center gap-1.5">
        <div className="flex items-center justify-center gap-2">
          <span className="w-7 h-7 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <FaChessKnight size={13} />
          </span>
          <h3 className="text-base font-black text-brand-primary tracking-tight uppercase leading-none">
            {t('global_ranking')}
          </h3>
        </div>
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider text-brand-muted">
          <span className="flex items-center gap-1 text-amber-400"><FiAward size={11} /> Season 1</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-emerald-400"><FiRadio size={9} /> Live</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <SegmentedControl
        options={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
        size="md"
      />

      {/* Leaderboard Shell */}
      <Card variant="solid" className="rounded-3xl overflow-hidden p-0 border-brand-border bg-brand-surface">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-brand-border bg-brand-elevated/40">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              {activeTab === 'arena' ? 'Arena ladder' : 'Scholar ladder'}
            </p>
            <p className="text-[10px] text-brand-muted truncate">
              {metricLabel} · {activeTab === 'arena' ? 'Win games to climb' : 'Study daily to climb'}
            </p>
          </div>
          <div className="shrink-0 text-right text-[10px] text-brand-muted font-mono">
            {leaderGap > 0 && <span className="text-amber-400 font-bold">Leader +{leaderGap.toLocaleString()}</span>}
          </div>
        </div>

        <div className="p-3 space-y-2">
          {loading ? (
            <SkeletonList count={5} />
          ) : displayedPlayers.length > 0 ? (
            displayedPlayers.map((item, idx) => renderRow(item, idx))
          ) : (
            <div className="py-8 px-4 text-center space-y-2">
              <FaChessKnight className="mx-auto text-brand-muted" size={24} />
              <p className="text-brand-primary font-bold text-xs uppercase tracking-wider">{t('no_data')}</p>
              <p className="text-brand-muted text-xs">Complete a game or lesson to enter the standings.</p>
            </div>
          )}
        </div>

        {!loading && players.length > 5 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-brand-border bg-brand-elevated/50">
            <span className="text-[10px] font-bold text-brand-muted">
              Showing 5 of {Math.min(players.length, 50)} contenders
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="flex shrink-0 items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 transition-colors"
            >
              <FaTrophy size={11} className="opacity-70" />
              View all
              <FiChevronRight size={13} />
            </button>
          </div>
        )}
      </Card>

      {/* Full Standings Drawer */}
      <Drawer
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('global_ranking')}
        description={`${t('global_node_sync')} · ${players.length} players`}
      >
        <div className="space-y-3">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
          />
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {players.map((item, idx) => renderRow(item, idx, true))}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
