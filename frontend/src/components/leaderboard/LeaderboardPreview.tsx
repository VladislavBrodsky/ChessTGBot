'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { FiArrowDown, FiArrowUp, FiFastForward, FiInfo, FiPause, FiPlay, FiRotateCcw } from 'react-icons/fi';
import { FaCrown, FaBookOpen, FaChessKnight } from 'react-icons/fa';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, BadgeRow } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CountUp } from '@/components/ui/CountUp';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useReducedMotionPreference } from '@/context/ReducedMotionContext';
import {
  PREVIEW_FRAME_INTERVAL_MS, PREVIEW_FRAMES_PER_DAY, previewDay, previewStandings, type PreviewLadder, type PreviewStanding,
} from '@/lib/leaderboardPreview';

function PreviewScore({ entry, unit, locale, reduceMotion, gainLabel, podium = false }: {
  entry: PreviewStanding; unit: 'GRAM' | 'XP'; locale: string; reduceMotion: boolean; gainLabel: string; podium?: boolean;
}) {
  const prefix = unit === 'GRAM' ? '+' : '';
  return (
    <div className={`leaderboard-preview-metric ${podium ? 'leaderboard-preview-metric--podium' : ''}`}>
      <bdi dir="ltr" data-preview-score={entry.score} aria-label={`${prefix}${entry.score.toLocaleString(locale)} ${unit}`}
        className={`leaderboard-preview-value ${podium ? 'podium__score' : 't-numeric-sm text-brand-primary'}`}>
        {unit === 'GRAM' && (
          // Official vector mark, served locally at its original colors.
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/images/leaderboard-preview/gram.svg" width={100} height={100} alt="" aria-hidden="true" className="leaderboard-preview-coin" />
        )}
        <span aria-hidden="true">{prefix}<CountUp key={unit} value={entry.score} duration={reduceMotion ? 0 : 0.42} format={value => value.toLocaleString(locale)} /> {unit}</span>
      </bdi>
      <motion.span key={entry.score} initial={reduceMotion ? false : { opacity: 0.6, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.24 }} className="block t-caption text-brand-success" data-preview-daily-gain={entry.dailyGain}>
        {gainLabel}
      </motion.span>
    </div>
  );
}

export default function LeaderboardPreview() {
  const t = useTranslations('LeaderboardPreview');
  const locale = useLocale();
  const { reducedMotion } = useReducedMotionPreference();
  const osReducedMotion = useReducedMotion();
  const reduceMotion = reducedMotion || !!osReducedMotion;
  const [ladder, setLadder] = useState<PreviewLadder>('arena');
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(true);
  const region = useRef<HTMLDivElement>(null);
  const running = playing && !reduceMotion && visible && foreground;
  const standings = useMemo(() => previewStandings(frame, ladder), [frame, ladder]);
  const podium = [standings[1], standings[0], standings[2]];
  const unit = ladder === 'arena' ? 'GRAM' : 'XP';

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

  const score = (entry: PreviewStanding, podium = false) => (
    <PreviewScore entry={entry} unit={unit} locale={locale} reduceMotion={reduceMotion} podium={podium}
      gainLabel={t('daily_gain', { gain: `\u2066+${entry.dailyGain.toLocaleString(locale)} ${unit}\u2069` })} />
  );
  const portrait = (entry: PreviewStanding, size: 'sm' | 'lg' | 'xl') => (
    <Avatar src={`/images/leaderboard-preview/${entry.profile.id}.webp`} name={entry.profile.name} size={size} />
  );

  return (
    <div ref={region} data-leaderboard-preview className="space-y-4">
      <div className="leaderboard-preview-notice space-y-2">
        <BadgeRow><Badge variant="amber" icon={<FiInfo />}>{t('badge')}</Badge><span className="t-caption text-brand-muted">{t('day', { day: previewDay(frame) })}</span></BadgeRow>
        <p className="t-body text-brand-muted">{t('disclosure')}</p>
      </div>
      <SegmentedControl value={ladder} onChange={setLadder} aria-label={t('ladder_label')}
        options={[
          { value: 'arena', label: t('arena'), icon: <FaChessKnight aria-hidden="true" /> },
          { value: 'academy', label: t('academy'), icon: <FaBookOpen aria-hidden="true" /> },
        ]} />
      <div className="grid grid-cols-[var(--size-control-sm)_minmax(0,1fr)_var(--size-control-sm)] items-start gap-2">
        <Button variant="secondary" className="p-0" size="sm" onClick={() => setPlaying(value => !value)} disabled={reduceMotion}
          aria-label={running ? t('pause') : t('play')} title={running ? t('pause') : t('play')}
          leftIcon={playing && !reduceMotion ? <FiPause /> : <FiPlay />} />
        <Button variant="secondary" size="sm" onClick={() => setFrame(value => (Math.floor(value / PREVIEW_FRAMES_PER_DAY) + 1) * PREVIEW_FRAMES_PER_DAY)} leftIcon={<FiFastForward />}>{t('advance_day')}</Button>
        <Button variant="ghost" className="p-0" size="sm" onClick={() => setFrame(0)} aria-label={t('reset')} title={t('reset')} leftIcon={<FiRotateCcw />} />
      </div>
      <p className="t-caption text-brand-muted" role="status">{reduceMotion ? t('reduced_motion') : running ? t('running') : t('paused')}</p>
      <Card variant="solid" className="leaderboard-shell overflow-hidden p-0">
        <div className="leaderboard-header space-y-1 border-b px-4 py-3">
          <h3 className="t-title-3 text-brand-primary">{ladder === 'arena' ? t('arena_metric') : t('academy_metric')}</h3>
          <p className="t-caption text-brand-muted">{ladder === 'arena' ? t('arena_range') : t('academy_range')}</p>
        </div>
        <div className="podium" role="group" aria-label={t('podium')}>
          {podium.map(entry => (
            <motion.div layout={reduceMotion ? false : 'position'} initial={false} transition={{ duration: reduceMotion ? 0 : 0.32 }}
              key={entry.profile.id} data-preview-profile={entry.profile.id} className="podium__slot">
              {entry.rank === 1 && <FaCrown className="text-brand-gold" aria-hidden="true" />}
              {portrait(entry, entry.rank === 1 ? 'xl' : 'lg')}
              <bdi className="podium__name" title={entry.profile.name}>{entry.profile.name}</bdi>
              {score(entry, true)}
              <div className={`podium__step podium__step--${entry.rank}`} aria-label={t('rank', { rank: entry.rank })}>{entry.rank}</div>
            </motion.div>
          ))}
        </div>
        <ol start={4} aria-label={t('standings')} className="space-y-2 p-3" aria-live="off">
          {standings.slice(3).map(entry => (
            <motion.li layout={reduceMotion ? false : 'position'} initial={false} transition={{ duration: reduceMotion ? 0 : 0.32 }}
              key={entry.profile.id} data-preview-profile={entry.profile.id} className="leaderboard-preview-row leaderboard-row rounded-row">
              <span className="t-caption tabular-nums text-brand-muted" aria-label={t('rank', { rank: entry.rank })}>
                {entry.rank}
                {entry.rankChange !== 0 && <span className="block" aria-label={t('rank_change', { count: Math.abs(entry.rankChange) })}>
                  {entry.rankChange > 0 ? <FiArrowUp aria-hidden="true" /> : <FiArrowDown aria-hidden="true" />}
                </span>}
              </span>
              {portrait(entry, 'sm')}
              <div className="min-w-0 space-y-1">
                <p className="truncate t-label text-brand-primary"><bdi title={entry.profile.name}>{entry.profile.name}</bdi></p>
                <span className="block truncate t-caption text-brand-muted">{t(entry.profile.country)}</span>
              </div>
              {score(entry)}
            </motion.li>
          ))}
        </ol>
      </Card>
      <p className="t-caption text-brand-muted">{t('footnote')}</p>
    </div>
  );
}
