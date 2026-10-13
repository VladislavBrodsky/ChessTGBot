'use client';

import { Badge } from '@/components/ui/Badge';

import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { FiSettings } from 'react-icons/fi';
import LayoutWrapper from "@/components/LayoutWrapper";
import { useLocale, useTranslations } from 'next-intl';
import { getFullPhotoUrl } from "@/lib/api";
import { FaFire } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralDashboard from "@/components/ReferralDashboard";
import { Skeleton, SkeletonList, StatTileSkeleton, BreakdownSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUser } from "@/context/UserContext";
import { FiUser } from 'react-icons/fi';
import { GameHistoryList } from '@/components/game/GameHistoryList';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';

// SVG Elo history chart component
function EloHistoryChart({ recentGames, currentElo }: { recentGames: any[], currentElo: number }) {
  const t = useTranslations('Index');
  const WIDTH = 300;
  const HEIGHT = 80;
  const PAD = 8;

  if (!recentGames || recentGames.length === 0) {
    // Empty state with subtle flat line
    const midY = PAD + (HEIGHT - PAD * 2) / 2;
    return (
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none" style={{ height: HEIGHT }} aria-hidden="true">
          <path d={`M ${PAD},${midY} L ${WIDTH - PAD},${midY}`} stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" fill="none" />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center text-caption font-medium text-brand-muted">{t('no_rating_history')}</p>
      </div>
    );
  }

  // Reconstruct Elo history points (reverse chronological order)
  const history = [currentElo];
  let tempElo = currentElo;
  for (let i = 0; i < Math.min(recentGames.length, 10); i++) {
    tempElo -= (recentGames[i].elo_change || 0);
    history.push(tempElo);
  }
  history.reverse(); // oldest to newest

  const minVal = Math.min(...history) - 20;
  const maxVal = Math.max(...history) + 20;
  const range = maxVal - minVal;

  const pts = history.map((val, i) => {
    const x = PAD + (i / (history.length - 1)) * (WIDTH - PAD * 2);
    const y = PAD + (1 - (val - minVal) / range) * (HEIGHT - PAD * 2);
    return { x, y, val };
  });

  const pathD = pts.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x},${HEIGHT - PAD} L ${pts[0].x},${HEIGHT - PAD} Z`;

  const isPositiveTrend = history[history.length - 1] >= history[0];
  const strokeColor = isPositiveTrend ? "var(--color-brand-success)" : "var(--color-brand-danger)"; // Emerald if up, Rose if down

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" preserveAspectRatio="none" style={{ height: HEIGHT }} role="img" aria-label={`${t('rating_trend')}: ${history[0]} → ${currentElo}`}>
      <defs>
        <linearGradient id="eloChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#eloChartGrad)" />
      <path d={pathD} stroke={strokeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <path key={i} d={`M ${p.x},${p.y} L ${p.x},${p.y}`} stroke={strokeColor} strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

export default function ProfilePage() {
 const t = useTranslations('Index');
 const locale = useLocale();
  const tc = useTranslations('Common');

 const tp = useTranslations('Profile');


 const { stats, statsError, syncStats } = useUser();
  const tgUser = stats || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null);

  const header = <PageHeader title={t('nav_profile')} icon={<FiUser />} actions={
    <Link href={`/${locale}/settings`} aria-label={t('nav_settings')} className="ui-icon-button"><FiSettings size={20} aria-hidden="true" /></Link>
  } />;
  if (statsError && !stats) {
    return (
      <LayoutWrapper className="w-full" hideHeaderControls>
        <main className="w-full app-page mx-auto">
          {header}
          <ErrorState title={t('load_failed')} message={t('load_failed')} onRetry={() => syncStats()} retryLabel={t('retry')} />
        </main>
      </LayoutWrapper>
    );
  }

  // Parse unlocked items
  const unlockedItems: string[] = (() => {
    if (Array.isArray(stats?.unlocked_items)) return stats.unlocked_items;
    if (typeof stats?.unlocked_items !== 'string') return [];
    try {
      const parsed = JSON.parse(stats.unlocked_items);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  })();

  const displayName = stats ? `${stats.first_name} ${stats.last_name || ''}`.trim() : tgUser?.first_name || t('combatant');
  return (
    <LayoutWrapper className="w-full" hideHeaderControls>
      <main className="w-full app-page flex flex-col items-center mx-auto ">

  {header}
  <Card variant="solid" className="ui-hero-card w-full p-4 space-y-4">
    <div className="flex items-center gap-4">
      {stats ? <Avatar className={`profile-avatar ${unlockedItems.includes('border_platinum') ? 'profile-avatar--platinum' : unlockedItems.includes('border_gold') ? 'profile-avatar--gold' : unlockedItems.includes('border_silver') ? 'profile-avatar--silver' : unlockedItems.includes('border_bronze') ? 'profile-avatar--bronze' : ''}`} size="xl" src={getFullPhotoUrl(stats.photo_url)} name={displayName} /> : <Skeleton variant="circular" width={64} height={64} className="shrink-0" />}
      <div className="min-w-0 flex-1 space-y-2">
        <h2 className="t-title-2 text-brand-primary break-words">{displayName}</h2>
        {stats && stats.study_streak > 0 && <Badge variant="amber" icon={<FaFire />}>{stats.study_streak} {t('day_streak')}</Badge>}
      </div>
    </div>
    {stats ? <XPProgressBar xp={stats.xp} level={stats.level} levelLabel={t('level')} /> : <div aria-busy="true" className="space-y-2"><Skeleton textRole="label" width="60%" /><Skeleton variant="rectangular" height={12} className="rounded-full" /></div>}
  </Card>

  {/* Stats Grid */}
  <section aria-labelledby="profile-stats-heading" className="w-full space-y-2">
    <h2 id="profile-stats-heading" className="sr-only">{t('player_statistics')}</h2>
    <div className="w-full grid grid-cols-2 gap-2">
    {/* ELO & Rank Card */}
    {!stats ? (
      <StatTileSkeleton metaLines={2} />
    ) : (
      <div className="ui-stat ui-stat--accent">
        <span className="ui-stat__label">{t('elo')}</span>
        <span className="ui-stat__value">{Number.isFinite(stats.elo) ? stats.elo : '—'}</span>
        <span className="ui-stat__meta">
          {tp('global_rank')} {Number.isFinite(stats.global_rank) ? `#${stats.global_rank}` : '—'} · {tp('percentile')} {Number.isFinite(stats.percentile) ? `${stats.percentile.toFixed(0)}%` : '—'}
        </span>
      </div>
    )}

    {/* Games Played & Total Score Card */}
    {!stats ? (
      <StatTileSkeleton metaLines={2} />
    ) : (
      <div className="ui-stat">
        <span className="ui-stat__label">{tp('games_played')}</span>
        <span className="ui-stat__value">{stats.games_played || 0}</span>
        <span className="ui-stat__meta">{tp('total_score')}: {stats.total_score?.toFixed(1) || "0.0"} pts</span>
      </div>
    )}
  </div>

  {/* Visual W - D - L Breakdown Bar */}
  {!stats ? (
    <BreakdownSkeleton />
  ) : (
    <div className="w-full p-3 rounded-2xl border border-brand-border bg-brand-surface space-y-2.5 shadow-sm">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{tp('breakdown')}</span>
        <span className="text-caption font-semibold text-brand-success">{stats.win_rate?.toFixed(1) || 0}% {t('win_rate')}</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-brand-elevated border border-brand-border-opacity-10">
        {stats.games_played > 0 ? (
          <>
            <div className="h-full bg-brand-success" style={{ width: `${stats.win_rate}%` }} title={`${t('wins')}: ${stats.win_rate}%`} />
            <div className="h-full bg-brand-muted" style={{ width: `${stats.draw_rate}%` }} title={`${t('draws')}: ${stats.draw_rate}%`} />
            <div className="h-full bg-brand-danger" style={{ width: `${stats.loss_rate}%` }} title={`${t('losses')}: ${stats.loss_rate}%`} />
          </>
        ) : (
          <div className="h-full bg-brand-elevated w-full" />
        )}
      </div>

      {/* Metric readouts */}
      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
        <div className="flex flex-col">
          <span className="text-caption font-semibold normal-case text-brand-success tracking-normal">{tp('wins')}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.wins || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.win_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col border-x border-brand-border-opacity-10">
          <span className="text-caption font-semibold text-brand-muted">{tp('draws')}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.draws || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.draw_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption font-semibold normal-case text-brand-danger tracking-normal">{tp('losses')}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.losses || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.loss_rate?.toFixed(0) || 0}%)</span>
        </div>
      </div>
    </div>
  )}
  </section>

  {/* ELO History Chart */}
  {stats && Number.isFinite(stats.elo) && (
    <section aria-labelledby="elo-history-heading" className="w-full p-3 rounded-2xl border border-brand-border bg-brand-surface space-y-1">
      <div className="flex justify-between items-center px-1">
        <h2 id="elo-history-heading" className="t-title-3 text-brand-primary">{t('rating_trend')}</h2>
        <span className="text-caption font-medium text-brand-muted">{t('recent_games_count', { count: Math.min(stats.recent_games?.length ?? 0, 10) })}</span>
      </div>
      <EloHistoryChart recentGames={stats.recent_games} currentElo={Number.isFinite(stats.elo) ? stats.elo : 0} />
    </section>
  )}

 {/* Gamification Sections */}
 <DailyTasks />
 <ReferralDashboard />

 {/* Inventory & Boosters */}
 {stats && (stats.xp_multiplier > 1.0 || unlockedItems.length > 0) && (
   <section aria-labelledby="inventory-heading" className="w-full space-y-2">
     <SectionHeader id="inventory-heading" title={tc('inventory')} />
     <div className="grid grid-cols-2 gap-2">
       {/* Active Boosters */}
       {stats.xp_multiplier > 1.0 && (
         <div className="ui-stat ui-stat--premium">
           <span className="ui-stat__label">{tc('active_booster')}</span>
           <span className="ui-stat__value">{stats.xp_multiplier}x XP</span>
           {stats.multiplier_expires_at && (
             <span className="ui-stat__meta">{tc('expires')} {new Date(stats.multiplier_expires_at).toLocaleDateString(locale)}</span>
           )}
         </div>
       )}
       {/* Cosmetics Count */}
       {unlockedItems.length > 0 && (
         <div className="ui-stat">
           <span className="ui-stat__label">{tc('cosmetics_owned')}</span>
           <span className="ui-stat__value">{unlockedItems.length}</span>
           <span className="ui-stat__meta">{tc('profile_styles')}</span>
         </div>
       )}
     </div>
   </section>
 )}

 {/* Recent Games History */}
 <section aria-labelledby="recent-activity-heading" className="w-full space-y-2">
   <SectionHeader id="recent-activity-heading" title={t('recent_activity')} />
   
   {!stats ? (
      <SkeletonList count={3} />
   ) : stats.recent_games && stats.recent_games.length > 0 ? (
     <GameHistoryList games={stats.recent_games} />
    ) : (
      <EmptyState
        title={t('no_games_logged')}
        description={t('initiate_combat')}
      />
    )}
 </section>

 </main>
 </LayoutWrapper>
 );
}
