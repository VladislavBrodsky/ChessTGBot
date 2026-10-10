'use client';

import { Badge, BadgeRow } from '@/components/ui/Badge';

import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import Link from 'next/link';
import { FiSettings, FiCreditCard, FiChevronRight } from 'react-icons/fi';
import LayoutWrapper from "@/components/LayoutWrapper";
import { useLocale, useTranslations } from 'next-intl';
import { getFullPhotoUrl } from "@/lib/api";
import { useState } from "react";
import { FaChessKing, FaChessPawn, FaFire } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import ReferralDashboard from "@/components/ReferralDashboard";
import { SkeletonList, StatTileSkeleton, BreakdownSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUser } from "@/context/UserContext";

// SVG Elo history chart component
function EloHistoryChart({ recentGames, currentElo }: { recentGames: any[], currentElo: number }) {
  const WIDTH = 300;
  const HEIGHT = 80;
  const PAD = 8;

  if (!recentGames || recentGames.length === 0) {
    // Empty state with subtle flat line
    const midY = PAD + (HEIGHT - PAD * 2) / 2;
    return (
      <div className="relative">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: HEIGHT }} aria-hidden="true">
          <path d={`M ${PAD},${midY} L ${WIDTH - PAD},${midY}`} stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" fill="none" />
        </svg>
        <p className="absolute inset-0 flex items-center justify-center text-caption font-medium text-brand-muted">No rating history yet</p>
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
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full drop-shadow-sm" style={{ height: HEIGHT }}>
      <defs>
        <linearGradient id="eloChartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#eloChartGrad)" />
      <path d={pathD} stroke={strokeColor} strokeWidth="2" fill="none" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={strokeColor} className="drop-shadow-md" />
      ))}
    </svg>
  );
}

export default function ProfilePage() {
 const t = useTranslations('Index');
 const locale = useLocale();

 // Dynamic locales mapping for Chess.com-style metric parameters
 const localizedLabels: Record<string, Record<string, string>> = {
   en: { global_rank: "Global Rank", percentile: "Percentile", games_played: "Games Played", total_score: "Total Score", breakdown: "W - D - L Breakdown", wins: "Wins", losses: "Losses", draws: "Draws" },
   es: { global_rank: "Rango Global", percentile: "Percentil", games_played: "Partidas Jugadas", total_score: "Puntaje Total", breakdown: "Desglose V - E - D", wins: "Victorias", losses: "Derrotas", draws: "Empates" },
   fr: { global_rank: "Rang Global", percentile: "Centile", games_played: "Parties Jouées", total_score: "Score Total", breakdown: "Détails V - N - D", wins: "Victoires", losses: "Défaites", draws: "Nuls" },
   de: { global_rank: "Globaler Rang", percentile: "Perzentil", games_played: "Spiele Gespielt", total_score: "Gesamtpunktzahl", breakdown: "S - U - N Details", wins: "Siege", losses: "Niederlagen", draws: "Remis" },
   ru: { global_rank: "Глобальный Ранг", percentile: "Процентиль", games_played: "Сыграно Игр", total_score: "Всего Очков", breakdown: "Статистика В - Н - П", wins: "Победы", draws: "Ничьи", losses: "Поражения" },
   ar: { global_rank: "الترتيب العالمي", percentile: "النسبة المئوية", games_played: "المباريات الملعوبة", total_score: "النتيجة الإجمالية", breakdown: "تفاصيل الفوز - التعادل - الخسارة", wins: "فوز", losses: "خسارة", draws: "تعادل" },
   hi: { global_rank: "वैश्विक रैंक", percentile: "प्रतिशतक", games_played: "खेले गए खेल", total_score: "कुल स्कोर", breakdown: "जीत - ड्रा - हार विवरण", wins: "जीत", losses: "हार", draws: "ड्रा" },
   ja: { global_rank: "グローバルランク", percentile: "パーセンタイル", games_played: "プレイ済みのゲーム", total_score: "トータルスコア", breakdown: "勝 - 分 - 敗 詳細", wins: "勝利", losses: "敗北", draws: "引き分け" },
   pt: { global_rank: "Classificação Global", percentile: "Percentil", games_played: "Jogos Jogados", total_score: "Pontuação Total", breakdown: "Detalhes V - E - D", wins: "Vitórias", losses: "Derrotas", draws: "Empates" },
   zh: { global_rank: "全球排名", percentile: "百分位数", games_played: "已玩游戏", total_score: "总积分", breakdown: "胜 - 平 - 负 详情", wins: "获胜", losses: "失败", draws: "平局" }
 };

 const labels = localizedLabels[locale] || localizedLabels['en'];

 const { stats, statsError, syncStats } = useUser();
 const [photoError, setPhotoError] = useState(false);
  const tgUser = stats || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user : null);

  if (statsError && !stats) {
    return (
      <LayoutWrapper className="w-full" hideHeaderControls>
        <main className="w-full app-page mx-auto">
          <PageHeader title={t('nav_profile')} />
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

  // Determine active profile border
  let borderOuterClass = "absolute inset-0 rounded-full border border-brand-border-opacity-20 scale-110 pointer-events-none";
  let borderInnerClass = "w-24 h-24 rounded-full bg-brand-elevated border-2 border-brand-border flex items-center justify-center relative overflow-hidden shadow-premium";
  
  if (unlockedItems.includes("border_platinum")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-purple-500/50 scale-110 shadow-[0_0_32px_rgba(168,85,247,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-purple-500/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)]";
  } else if (unlockedItems.includes("border_gold")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-amber-400/50 scale-110 shadow-[0_0_32px_rgba(251,191,36,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-amber-400/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_20px_rgba(251,191,36,0.3)]";
  } else if (unlockedItems.includes("border_silver")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-brand-primary/40 scale-110 shadow-[0_0_24px_rgba(203,213,225,0.3)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-brand-primary/70 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(203,213,225,0.2)]";
  } else if (unlockedItems.includes("border_bronze")) {
    borderOuterClass = "absolute inset-0 rounded-full border border-orange-700/50 scale-110 shadow-[0_0_24px_rgba(194,65,12,0.4)] pointer-events-none";
    borderInnerClass = "w-24 h-24 rounded-full bg-brand-surface border-[3px] border-orange-700/80 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(194,65,12,0.2)]";
  }

  return (
    <LayoutWrapper className="w-full" hideHeaderControls>
      <main className="w-full app-page flex flex-col items-center mx-auto ">

  <PageHeader title={t('nav_profile')} actions={<>
    <Link href={`/${locale}/wallet`} aria-label={t('nav_wallet')} className="ui-icon-button"><FiCreditCard size={20} /></Link>
    <Link href={`/${locale}/settings`} aria-label={t('nav_settings')} className="ui-icon-button"><FiSettings size={20} /></Link>
  </>} />
  {/* Profile Header */}
  <header className="ui-hero-card w-full flex flex-col items-center p-6 text-center">
  <div className="mb-3 flex flex-col items-center gap-3">
   <div className="relative">
   {/* Outer rotating/pulsing ring */}
   <div className={borderOuterClass} aria-hidden="true" />
   <div className={borderInnerClass}>
  {(stats?.photo_url || tgUser?.photo_url) && !photoError ? (
  // eslint-disable-next-line @next/next/no-img-element -- remote avatar; static export runs with images.unoptimized so next/image adds no benefit
  <img
    src={getFullPhotoUrl(stats?.photo_url || tgUser?.photo_url)}
    alt="Profile" 
    className="w-full h-full object-cover" 
    onError={() => setPhotoError(true)}
  />
  ) : (
  <FaChessKing className="text-4xl text-brand-muted drop-shadow-md" />
  )}
  </div>
   <span className="ui-level-chip absolute -bottom-1 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 h-6 min-w-6 text-sm" aria-label={`${t('level')} ${stats?.level ?? 1}`}>{stats?.level ?? 1}</span>
   </div>
  </div>
  <h2 className="text-xl sm:text-2xl font-semibold text-brand-primary tracking-tight mb-2 header-balanced">
  {stats ? `${stats.first_name} ${stats.last_name || ""}`.trim() : (tgUser ? `${tgUser.first_name} ${tgUser.last_name || ""}`.trim() : t('combatant'))}
  </h2>
  <BadgeRow className="justify-center mb-4">
    <Badge variant="primary">{t('level')} {stats?.level ?? '—'}</Badge>
    {stats && Number.isFinite(stats.elo) && <Badge variant="secondary">{stats.elo} {t('elo')}</Badge>}
    {stats && stats.study_streak > 0 && (
      <Badge variant="amber" icon={<FaFire />}>{stats.study_streak} {t('day_streak')}</Badge>
    )}
  </BadgeRow>
  <div className="w-full max-w-[280px]">
  <XPProgressBar xp={stats?.xp || 0} level={stats?.level || 1} levelLabel={t('level')} />
  </div>
  </header>

  {/* Stats Grid */}
  <section aria-labelledby="profile-stats-heading" className="w-full space-y-3">
    <h2 id="profile-stats-heading" className="sr-only">Player Statistics</h2>
    <div className="w-full grid grid-cols-2 gap-3">
    {/* ELO & Rank Card */}
    {!stats ? (
      <StatTileSkeleton metaLines={2} />
    ) : (
      <div className="ui-stat ui-stat--accent">
        <span className="ui-stat__label">{t('elo')}</span>
        <span className="ui-stat__value">{Number.isFinite(stats.elo) ? stats.elo : '—'}</span>
        <span className="ui-stat__meta">
          {labels.global_rank} {Number.isFinite(stats.global_rank) ? `#${stats.global_rank}` : '—'} · {labels.percentile} {Number.isFinite(stats.percentile) ? `${stats.percentile.toFixed(0)}%` : '—'}
        </span>
      </div>
    )}

    {/* Games Played & Total Score Card */}
    {!stats ? (
      <StatTileSkeleton metaLines={2} />
    ) : (
      <div className="ui-stat">
        <span className="ui-stat__label">{labels.games_played}</span>
        <span className="ui-stat__value">{stats.games_played || 0}</span>
        <span className="ui-stat__meta">{labels.total_score}: {stats.total_score?.toFixed(1) || "0.0"} pts</span>
      </div>
    )}
  </div>

  {/* Visual W - D - L Breakdown Bar */}
  {!stats ? (
    <BreakdownSkeleton />
  ) : (
    <div className="w-full p-4 rounded-2xl border border-brand-border bg-brand-surface space-y-3.5 shadow-sm">
      <div className="flex justify-between items-center px-0.5">
        <span className="text-caption font-semibold text-brand-muted normal-case tracking-normal">{labels.breakdown}</span>
        <span className="text-caption font-semibold text-brand-success normal-case tracking-normal">{stats.win_rate?.toFixed(1) || 0}% WR</span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-brand-elevated border border-brand-border-opacity-10">
        {stats.games_played > 0 ? (
          <>
            <div className="h-full bg-brand-success transition-all duration-700" style={{ width: `${stats.win_rate}%` }} title={`Wins: ${stats.win_rate}%`} />
            <div className="h-full bg-brand-muted transition-all duration-700" style={{ width: `${stats.draw_rate}%` }} title={`Draws: ${stats.draw_rate}%`} />
            <div className="h-full bg-brand-danger transition-all duration-700" style={{ width: `${stats.loss_rate}%` }} title={`Losses: ${stats.loss_rate}%`} />
          </>
        ) : (
          <div className="h-full bg-brand-elevated w-full" />
        )}
      </div>

      {/* Metric readouts */}
      <div className="grid grid-cols-3 gap-2 text-center pt-0.5">
        <div className="flex flex-col">
          <span className="text-caption font-semibold normal-case text-brand-success tracking-normal">{labels.wins}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.wins || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.win_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col border-x border-brand-border-opacity-10">
          <span className="text-caption font-semibold text-brand-muted">{labels.draws}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.draws || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.draw_rate?.toFixed(0) || 0}%)</span>
        </div>
        <div className="flex flex-col">
          <span className="text-caption font-semibold normal-case text-brand-danger tracking-normal">{labels.losses}</span>
          <span className="text-sm font-semibold text-brand-primary mt-0.5">{stats.losses || 0}</span>
          <span className="text-caption font-bold text-brand-muted">({stats.loss_rate?.toFixed(0) || 0}%)</span>
        </div>
      </div>
    </div>
  )}
  </section>

  {/* ELO History Chart */}
  {stats && Number.isFinite(stats.elo) && (
    <section aria-labelledby="elo-history-heading" className="w-full p-4 rounded-2xl border border-brand-border bg-brand-surface space-y-2">
      <div className="flex justify-between items-center px-1 mb-2">
        <h2 id="elo-history-heading" className="text-sm font-semibold text-brand-primary">Rating trend</h2>
        <span className="text-caption font-medium text-brand-muted">Last 10 games</span>
      </div>
      <EloHistoryChart recentGames={stats.recent_games} currentElo={Number.isFinite(stats.elo) ? stats.elo : 0} />
    </section>
  )}

 {/* Gamification Sections */}
 <DailyTasks />
 <ReferralDashboard />

 {/* Inventory & Boosters */}
 {stats && (stats.xp_multiplier > 1.0 || unlockedItems.length > 0) && (
   <section aria-labelledby="inventory-heading" className="w-full space-y-4">
     <SectionHeader id="inventory-heading" title="Inventory & boosters" />
     <div className="grid grid-cols-2 gap-3">
       {/* Active Boosters */}
       {stats.xp_multiplier > 1.0 && (
         <div className="ui-stat ui-stat--premium">
           <span className="ui-stat__label">Active booster</span>
           <span className="ui-stat__value">{stats.xp_multiplier}x XP</span>
           {stats.multiplier_expires_at && (
             <span className="ui-stat__meta">Expires {new Date(stats.multiplier_expires_at).toLocaleDateString()}</span>
           )}
         </div>
       )}
       {/* Cosmetics Count */}
       {unlockedItems.length > 0 && (
         <div className="ui-stat">
           <span className="ui-stat__label">Cosmetics owned</span>
           <span className="ui-stat__value">{unlockedItems.length}</span>
           <span className="ui-stat__meta">Profile styles</span>
         </div>
       )}
     </div>
   </section>
 )}

 {/* Recent Games History */}
 <section aria-labelledby="recent-activity-heading" className="w-full space-y-3">
   <SectionHeader id="recent-activity-heading" title={t('recent_activity')} />
   
   {!stats ? (
      <SkeletonList count={3} />
   ) : stats.recent_games && stats.recent_games.length > 0 ? (
     <ol role="list" className="flex flex-col gap-3 list-none m-0 p-0">
       {stats.recent_games.map((game: any) => {
         const isWin = game.result === 'win';
         const isLoss = game.result === 'loss';
         const tileClass = isWin ? 'ui-icon-tile ui-icon-tile--success' : isLoss ? 'ui-icon-tile ui-icon-tile--danger' : 'ui-icon-tile';

         return (
           <li key={game.game_id} className="list-item-contain">
             <Link
               href={`/${locale}/game/review?gameId=${encodeURIComponent(game.game_id)}`}
               aria-label={`${t('recent_activity')}: ${game.opponent?.name || t('ai_engine')}, ${game.result}`}
               className="ui-list-row ui-list-row--interactive focus-visible:outline-2 focus-visible:outline-brand-action"
             >
             <div className="flex items-center gap-3 min-w-0 flex-1">
               <span className={tileClass}><FaChessPawn aria-hidden="true" /></span>
               <div className="flex flex-col min-w-0 flex-1">
                 <span className="text-sm font-semibold text-brand-primary truncate">
                   {t('vs')} {game.opponent?.name || t('ai_engine')}
                 </span>
                 <span className="text-caption font-medium text-brand-muted truncate">
                   {t('opponent_elo')}: {game.opponent?.elo ?? '—'}
                 </span>
               </div>
             </div>

             <div className="flex items-center gap-3 shrink-0">
               <div className="flex flex-col items-end gap-1">
                 <Badge variant={isWin ? 'emerald' : isLoss ? 'rose' : 'secondary'}>{isWin ? 'Win' : isLoss ? 'Loss' : 'Draw'}</Badge>
                 <span className={`text-caption font-semibold tabular-nums ${
                    game.elo_change > 0 ? 'text-brand-success' : game.elo_change < 0 ? 'text-brand-danger' : 'text-brand-muted'
                  }`}>
                    {game.elo_change >= 0 ? `+${game.elo_change}` : game.elo_change} {t('elo')}
                  </span>
               </div>
               <FiChevronRight size={18} className="text-brand-muted rtl:rotate-180" aria-hidden="true" />
             </div>
             </Link>
           </li>
         );
       })}
     </ol>
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
