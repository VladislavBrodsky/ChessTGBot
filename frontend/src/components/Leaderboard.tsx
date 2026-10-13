'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { FiArrowDown, FiArrowUp, FiChevronRight } from 'react-icons/fi';
import { FaCrown, FaBookOpen, FaChessKnight, FaTrophy } from 'react-icons/fa';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { CountUp } from '@/components/ui/CountUp';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useReducedMotionPreference } from '@/context/ReducedMotionContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { getFullPhotoUrl } from '@/lib/api';
import { useTelemetry } from '@/hooks/useTelemetry';
import { type GramQuote } from '@/lib/gram';
import {
  PREVIEW_FRAME_INTERVAL_MS,
  PREVIEW_PORTRAIT_IDS,
  previewStandings,
  type PreviewLadder,
} from '@/lib/leaderboardPreview';

export interface LeaderboardItem {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  elo?: number;
  gram_value?: string;
  games_played?: number;
  win_rate?: number;
  xp?: number;
  study_streak?: number;
  rank?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  country?: string;
  photoUrl?: string;
  isReal: boolean;
  studyStreak?: number;
  score: number;
  rank: number;
  rankChange: number;
  dailyGain: number;
}

function LeaderboardScore({ entry, unit, locale, reduceMotion, gainLabel, podium = false }: {
  entry: LeaderboardEntry; unit: 'GRAM' | 'XP'; locale: string; reduceMotion: boolean; gainLabel: string; podium?: boolean;
}) {
  const prefix = unit === 'GRAM' ? '+' : '';
  const isHot = entry.dailyGain >= 30;
  return (
    <div className={`leaderboard-preview-metric ${podium ? 'leaderboard-preview-metric--podium' : ''}`}>
      <bdi dir="ltr" data-preview-score={entry.score} aria-label={`${prefix}${entry.score.toLocaleString(locale)} ${unit}`}
        className={`leaderboard-preview-value ${unit === 'GRAM' ? 'leaderboard-preview-value--gram' : 'leaderboard-preview-value--xp'} ${podium ? 'podium__score' : 't-numeric-sm'}`}>
        {unit === 'GRAM' && (
          // Official vector mark, served locally at its original colors.
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/leaderboard-preview/gram.svg" width={100} height={100} alt="" aria-hidden="true" className="leaderboard-preview-coin" />
        )}
        <span aria-hidden="true">{prefix}<CountUp key={unit} value={entry.score} duration={reduceMotion ? 0 : 0.42} format={value => value.toLocaleString(locale)} /> {unit}</span>
      </bdi>
      <motion.span key={entry.score} initial={reduceMotion ? false : { opacity: 0.6, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.24 }} className={`leaderboard-daily-badge ${isHot ? 'leaderboard-daily-badge--hot' : ''}`} data-preview-daily-gain={entry.dailyGain}>
        <span className="leaderboard-daily-dot" aria-hidden="true" />
        <span>{gainLabel}</span>
      </motion.span>
    </div>
  );
}

export default function Leaderboard() {
  const t = useTranslations('LeaderboardPreview');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { reducedMotion } = useReducedMotionPreference();
  const osReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion || !!osReducedMotion;
  const [ladder, setLadder] = useState<PreviewLadder>('arena');
  const [frame, setFrame] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(true);
  const region = useRef<HTMLDivElement>(null);
  const running = !reduceMotion && visible && foreground;

  const { data: arenaResponse } = useSWRFetch<{
    players?: LeaderboardItem[];
    quote?: GramQuote;
  }>('/api/v1/users/leaderboard/gram', {
    refreshInterval: 300_000,
    dedupingInterval: 60_000,
    revalidateOnFocus: true,
    focusThrottleInterval: 60_000,
  });

  const { data: academyData } = useSWRFetch<LeaderboardItem[]>(
    '/api/v1/users/leaderboard/academy',
    {
      refreshInterval: 300_000,
      dedupingInterval: 60_000,
      revalidateOnFocus: true,
      focusThrottleInterval: 60_000,
    }
  );

  const { trackEvent } = useTelemetry();

  useEffect(() => {
    trackEvent('leaderboard_viewed', { tab: ladder });
  }, [ladder, trackEvent]);

  useEffect(() => {
    const onVisibility = () => setForeground(document.visibilityState !== 'hidden');
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(
      entries => setVisible(entries[0]?.isIntersecting ?? false), { threshold: 0 },
    );
    if (region.current) observer?.observe(region.current);
    return () => { document.removeEventListener('visibilitychange', onVisibility); observer?.disconnect(); };
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setFrame(value => value + 1), PREVIEW_FRAME_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [running]);

  const standings = useMemo<LeaderboardEntry[]>(() => {
    // 1. Marketing baseline demo profiles at current frame
    const demoList = previewStandings(frame, ladder).map(d => ({
      id: d.profile.id,
      name: d.profile.name,
      country: d.profile.country,
      photoUrl: undefined,
      isReal: false,
      studyStreak: undefined,
      score: d.score,
      dailyGain: d.dailyGain,
      prevRank: d.rank - d.rankChange,
    }));

    // 2. Real user entries from active ladder endpoint
    const realRaw = ladder === 'arena'
      ? (Array.isArray(arenaResponse?.players) ? arenaResponse.players : [])
      : (Array.isArray(academyData) ? academyData : []);

    const realList = realRaw.map(p => {
      const isArena = ladder === 'arena';
      const score = Math.max(0, Math.round(isArena ? Number(p.gram_value) || 0 : p.xp || 0));
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Player';
      return {
        id: `real-${p.telegram_id}`,
        name: fullName,
        country: undefined,
        photoUrl: p.photo_url ? getFullPhotoUrl(p.photo_url) : undefined,
        isReal: true,
        studyStreak: p.study_streak,
        score,
        dailyGain: isArena
          ? Math.max(1, Math.round(score * 0.04 + ((p.telegram_id * 17) % 20)))
          : Math.max(50, Math.round(score * 0.05 + ((p.telegram_id * 31) % 150))),
        prevRank: 0,
      };
    });

    // 3. Merge & sort by score descending; real players win ties for professional parity
    const combined = [...realList, ...demoList].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.isReal !== b.isReal) return a.isReal ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

    // 4. Bound to top 50 contenders and re-rank
    return combined.slice(0, 50).map((entry, index) => {
      const rank = index + 1;
      const rankChange = entry.prevRank > 0 ? entry.prevRank - rank : 0;
      return {
        id: entry.id,
        name: entry.name,
        country: entry.country,
        photoUrl: entry.photoUrl,
        isReal: entry.isReal,
        studyStreak: entry.studyStreak,
        score: entry.score,
        dailyGain: entry.dailyGain,
        rank,
        rankChange,
      };
    });
  }, [frame, ladder, arenaResponse, academyData]);

  const podium = useMemo(() => {
    if (standings.length < 3) return standings;
    return [standings[1], standings[0], standings[2]];
  }, [standings]);

  const unit = ladder === 'arena' ? 'GRAM' : 'XP';

  const renderScore = (entry: LeaderboardEntry, isPodium = false) => (
    <LeaderboardScore entry={entry} unit={unit} locale={locale} reduceMotion={reduceMotion} podium={isPodium}
      gainLabel={t('daily_gain', { gain: `\u2066+${entry.dailyGain.toLocaleString(locale)} ${unit}\u2069` })} />
  );

  const portrait = (entry: LeaderboardEntry, size: 'sm' | 'lg' | 'xl') => (
    <Avatar
      src={entry.photoUrl ? entry.photoUrl : (PREVIEW_PORTRAIT_IDS.has(entry.id as any) ? `/images/leaderboard-preview/${entry.id}.webp` : undefined)}
      name={entry.name}
      size={size}
    />
  );

  const countryLabels: Record<string, string> = {
    egypt: t('egypt'),
    japan: t('japan'),
    russia: t('russia'),
    usa: t('usa'),
    morocco: t('morocco'),
    germany: t('germany'),
    uae: t('uae'),
    india: t('india'),
    brazil: t('brazil'),
  };

  const getSubtitle = (entry: LeaderboardEntry) => {
    if (entry.country && countryLabels[entry.country]) {
      return countryLabels[entry.country];
    }
    if (entry.studyStreak && entry.studyStreak > 0) {
      return ti('ladder_streak', { days: entry.studyStreak });
    }
    return ladder === 'arena' ? ti('ladder_arena_tab') : t('academy');
  };

  const tabs = () => <SegmentedControl value={ladder} onChange={setLadder} aria-label={t('ladder_label')}
    options={[
      { value: 'arena', label: t('arena'), icon: <FaChessKnight aria-hidden="true" /> },
      { value: 'academy', label: t('academy'), icon: <FaBookOpen aria-hidden="true" /> },
    ]} />;

  const row = (entry: LeaderboardEntry) => (
    <motion.li layout={reduceMotion ? false : 'position'} initial={false} transition={{ duration: reduceMotion ? 0 : 0.32 }}
      key={entry.id} data-preview-profile={entry.id} className="leaderboard-preview-row leaderboard-row rounded-row">
      <span className="t-caption tabular-nums text-brand-muted" aria-label={t('rank', { rank: entry.rank })}>
        {entry.rank}
        {entry.rankChange !== 0 && <span className="block" aria-label={t('rank_change', { count: Math.abs(entry.rankChange) })}>
          {entry.rankChange > 0 ? <FiArrowUp aria-hidden="true" /> : <FiArrowDown aria-hidden="true" />}
        </span>}
      </span>
      {portrait(entry, 'sm')}
      <div className="min-w-0 space-y-1">
        <p className="truncate t-label text-brand-primary"><bdi title={entry.name}>{entry.name}</bdi></p>
        <span className="block truncate t-caption text-brand-muted">{getSubtitle(entry)}</span>
      </div>
      {renderScore(entry)}
    </motion.li>
  );

  return (
    <div ref={region} data-leaderboard-preview className="space-y-4">
      {tabs()}
      <Card variant="solid" className="leaderboard-shell overflow-hidden p-0">
        <div className="podium" role="group" aria-label={t('podium')}>
          {podium.map(entry => (
            <motion.div layout={reduceMotion ? false : 'position'} initial={false} transition={{ duration: reduceMotion ? 0 : 0.32 }}
              key={entry.id} data-preview-profile={entry.id} className="podium__slot">
              {entry.rank === 1 && <FaCrown className="text-brand-gold" aria-hidden="true" />}
              {portrait(entry, entry.rank === 1 ? 'xl' : 'lg')}
              <bdi className="podium__name" title={entry.name}>{entry.name}</bdi>
              {renderScore(entry, true)}
              <div className={`podium__step podium__step--${entry.rank}`} aria-label={t('rank', { rank: entry.rank })}>{entry.rank}</div>
            </motion.div>
          ))}
        </div>
        <ol start={4} aria-label={t('standings')} className="space-y-2 p-3" aria-live="off">
          {standings.slice(3, 10).map(row)}
        </ol>
        <div className="leaderboard-header flex flex-wrap items-center justify-between gap-2 border-t p-3">
          <span className="t-caption text-brand-muted">{ti('ladder_showing', { shown: Math.min(10, standings.length), total: standings.length })}</span>
          <Button variant="secondary" size="sm" onClick={() => setShowAll(true)} leftIcon={<FaTrophy className="text-brand-gold" />} rightIcon={<FiChevronRight className="rtl:rotate-180" />}>
            {ti('show_top_50')}
          </Button>
        </div>
      </Card>
      {showAll && <Drawer isOpen onClose={() => setShowAll(false)} title={t('top_50')}>
        <div className="space-y-4">
          {tabs()}
          <ol aria-label={t('standings')} className="space-y-2" aria-live="off">{standings.map(row)}</ol>
        </div>
      </Drawer>}
    </div>
  );
}

// Named alias for backwards compatibility
export { Leaderboard as PlayerLeaderboard };
