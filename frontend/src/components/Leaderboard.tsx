'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { FaTrophy, FaMedal, FaCrown, FaChessKnight, FaGamepad, FaBook } from 'react-icons/fa';
import { FiChevronRight } from 'react-icons/fi';
import { getFullPhotoUrl } from '@/lib/api';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PodiumSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useTelemetry } from '@/hooks/useTelemetry';
import { isLeaderboardPreviewAllowed } from '@/lib/leaderboardPreviewAccess';

const LeaderboardPreview = dynamic(() => import('@/components/leaderboard/LeaderboardPreview'), {
  ssr: false,
  loading: () => <PodiumSkeleton />,
});
const subscribePreviewAccess = () => () => {};
const previewAccessSnapshot = () => isLeaderboardPreviewAllowed(process.env.NODE_ENV, window.location.hostname) ? 'preview' : 'api';
// Reserve the leaderboard space until a development browser supplies its hostname.
const serverPreviewAccessSnapshot = () => process.env.NODE_ENV === 'development' ? 'loading' : 'api';

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
  const mode = useSyncExternalStore(subscribePreviewAccess, previewAccessSnapshot, serverPreviewAccessSnapshot);
  if (mode === 'loading') return <PodiumSkeleton />;
  if (mode === 'preview') return <LeaderboardPreview />;
  return <PlayerLeaderboard />;
}

function PlayerLeaderboard() {
  const t = useTranslations('Index');
  const tc = useTranslations('Common');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'arena' | 'academy'>('arena');
  const { data: arenaData, isLoading: loadingArena } = useSWRFetch('/api/v1/users/leaderboard');
  const { data: academyData, isLoading: loadingAcademy } = useSWRFetch('/api/v1/users/leaderboard/academy');
  
  const players: LeaderboardItem[] = useMemo(() => {
    const raw = activeTab === 'arena' ? arenaData : academyData;
    return Array.isArray(raw) ? raw : [];
  }, [activeTab, arenaData, academyData]);

  const loading = activeTab === 'arena' ? loadingArena : loadingAcademy;
  const [showModal, setShowModal] = useState(false);
  const { trackEvent } = useTelemetry();

  useEffect(() => {
    trackEvent('leaderboard_viewed', { tab: activeTab });
  }, [activeTab, trackEvent]);

  // Podium rows use the shared leaderboard recipes from globals.css so every
  // theme keeps the same gold / silver / bronze meaning.
  const getRankConfig = (rank: number) => {
    if (rank === 1) return {
      icon: <FaCrown className="text-brand-gold" size={14} aria-hidden="true" />,
      label: '1',
      rowBg: 'leaderboard-row leaderboard-row--leader',
      barColor: 'bg-brand-gold',
      rankBg: 'ui-icon-tile--gold',
    };
    if (rank === 2) return {
      icon: <FaMedal className="text-brand-primary" size={13} aria-hidden="true" />,
      label: '2',
      rowBg: 'leaderboard-row leaderboard-row--runner-up',
      barColor: 'bg-brand-primary',
      rankBg: '',
    };
    if (rank === 3) return {
      icon: <FaMedal className="text-brand-gold opacity-80" size={13} aria-hidden="true" />,
      label: '3',
      rowBg: 'leaderboard-row leaderboard-row--third',
      barColor: 'bg-brand-gold opacity-70',
      rankBg: '',
    };
    return {
      icon: null,
      label: `${rank}`,
      rowBg: 'leaderboard-row leaderboard-row--standard',
      barColor: 'bg-brand-muted',
      rankBg: '',
    };
  };

  const displayedPlayers = useMemo(() => players.slice(0, 5), [players]);
  const hasPodium = displayedPlayers.length >= 3;
  const podium = hasPodium ? [displayedPlayers[1], displayedPlayers[0], displayedPlayers[2]] : [];
  const scoreOf = (p: LeaderboardItem) => (activeTab === 'arena' ? (p.elo || 0) : (p.xp || 0));
  const unit = activeTab === 'arena' ? 'ELO' : 'XP';
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

  const renderRow = (item: LeaderboardItem, idx: number, _isModal = false) => {
    const cfg = getRankConfig(item.rank);
    const score = activeTab === 'arena' ? (item.elo || 0) : (item.xp || 0);
    const barPct = Math.min(100, Math.round((score / topScore) * 100));
    const fullName = `${item.first_name} ${item.last_name || ''}`.trim();

    return (
      <li
        key={`${item.telegram_id}-${item.rank}`}
        className={`flex items-center justify-between gap-3 p-3 rounded-2xl transition-colors duration-200 ${cfg.rowBg}`}
      >
        {/* Left: Rank & Player */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`ui-icon-tile h-8 w-8 rounded-xl text-caption font-semibold tabular-nums ${cfg.rankBg}`} role="img" aria-label={t('ladder_rank', { rank: item.rank })}>
            {cfg.icon || cfg.label}
          </div>

          <Avatar
            src={item.photo_url ? getFullPhotoUrl(item.photo_url) : undefined}
            name={fullName}
            size={item.rank === 1 ? 'md' : 'sm'}
          />

          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-primary truncate">
              {fullName}
            </p>
            <p className="text-caption text-brand-muted truncate">
              {activeTab === 'arena'
                ? t('ladder_stats', { games: item.games_played || 0, rate: item.win_rate || 0 })
                : t('ladder_streak', { days: item.study_streak || 0 })}
            </p>
          </div>
        </div>

        {/* Right: Score & Mini Progress */}
        <div className="flex flex-col items-end shrink-0 ml-3">
          <div className="text-right">
            <span className={`text-sm font-semibold tabular-nums ${item.rank === 1 ? 'text-brand-gold' : 'text-brand-primary'}`}>
              {score.toLocaleString(locale)}
            </span>
            <span className="text-caption font-medium text-brand-muted ms-1">
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
      </li>
    );
  };

  const tabOptions = [
    { value: 'arena' as const, label: t('ladder_arena_tab'), icon: <FaGamepad size={12} /> },
    { value: 'academy' as const, label: t('nav_learn'), icon: <FaBook size={12} /> },
  ];

  return (
    <section aria-label={t('global_ranking')} className="w-full space-y-3">
      {/* The page owns the section heading; this component only switches ladders. */}
      <SegmentedControl
        options={tabOptions}
        value={activeTab}
        onChange={setActiveTab}
        size="md"
        aria-label={t('global_ranking')}
      />

      {/* Leaderboard Shell */}
      <Card variant="solid" className="leaderboard-shell rounded-3xl overflow-hidden p-0">
        <div className="leaderboard-header flex items-center justify-between gap-3 px-5 py-3.5 border-b">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-primary">
              {activeTab === 'arena' ? t('ladder_arena') : t('ladder_academy')}
            </p>
            <p className="text-caption text-brand-muted truncate">
              {metricLabel} · {activeTab === 'arena' ? t('ladder_arena_hint') : t('ladder_academy_hint')}
            </p>
          </div>
          {leaderGap > 0 && (
            <span className="ui-badge ui-badge--amber shrink-0 tabular-nums">{t('leader_gap', { gap: leaderGap.toLocaleString(locale) })}</span>
          )}
        </div>

        {!loading && hasPodium && (
          <div className="podium" role="group" aria-label={t('global_ranking')}>
            {podium.map((p) => {
              const fullName = `${p.first_name} ${p.last_name || ''}`.trim();
              const first = p.rank === 1;
              const avatar = <Avatar src={p.photo_url ? getFullPhotoUrl(p.photo_url) : undefined} name={fullName} size={first ? 'xl' : 'lg'} />;
              return (
                <div key={`${p.telegram_id}-${p.rank}`} className="podium__slot">
                  <div className="relative">
                    {first && <FaCrown className="absolute -top-4 start-1/2 -translate-x-1/2 text-brand-gold drop-shadow-[0_2px_6px_rgba(245,196,81,0.6)]" size={18} aria-hidden="true" />}
                    {first ? <span className="ui-avatar-ring">{avatar}</span> : avatar}
                  </div>
                  <span className="podium__name" title={fullName}>{p.first_name}</span>
                  <span className="podium__score">{scoreOf(p).toLocaleString(locale)} {unit}</span>
                  <div className={`podium__step podium__step--${p.rank}`} aria-label={t('ladder_rank', { rank: p.rank })}>{p.rank}</div>
                </div>
              );
            })}
          </div>
        )}

        <ol aria-label={tc('standings')} className="p-3 space-y-2 list-none m-0">
          {loading ? (
            <li className="list-none"><PodiumSkeleton label={t('global_ranking')} /></li>
          ) : displayedPlayers.length > 0 ? (
            (hasPodium ? displayedPlayers.slice(3) : displayedPlayers).map((item, idx) => renderRow(item, idx))
          ) : (
            <li className="py-8 px-4 text-center space-y-2 list-none">
              <span className="ui-icon-tile mx-auto h-12 w-12 rounded-2xl"><FaChessKnight size={20} aria-hidden="true" /></span>
              <p className="text-brand-primary font-semibold text-sm">{t('no_data')}</p>
              <p className="text-brand-muted text-sm">{t('ladder_empty')}</p>
            </li>
          )}
        </ol>

        {!loading && players.length > 5 && (
          <div className="leaderboard-header flex items-center justify-between gap-3 px-4 py-3 border-t">
            <span className="text-caption font-medium text-brand-muted">
              {t('ladder_showing', { shown: 5, total: Math.min(players.length, 50) })}
            </span>
            <button type="button"
              onClick={() => setShowModal(true)}
              className="ui-tap-target flex shrink-0 items-center gap-1.5 px-3.5 rounded-xl border border-brand-border bg-brand-surface text-sm font-semibold text-brand-primary hover:bg-brand-elevated transition-colors cursor-pointer"
            >
              <FaTrophy size={11} className="text-brand-gold" aria-hidden="true" />
              {t('show_top_50')}
              <FiChevronRight size={13} aria-hidden="true" />
            </button>
          </div>
        )}
      </Card>

      {/* Full Standings Drawer */}
      <Drawer
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={t('global_ranking')}
        description={t('ladder_players', { count: players.length })}
      >
        <div className="space-y-3">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
          />
          <ol aria-label={tc('all_standings')} className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 list-none m-0">
            {players.map((item, idx) => renderRow(item, idx, true))}
          </ol>
        </div>
      </Drawer>
    </section>
  );
}
