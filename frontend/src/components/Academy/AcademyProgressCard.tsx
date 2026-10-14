'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocale, useTranslations } from 'next-intl';
import { FaGraduationCap, FaTrophy } from 'react-icons/fa';

interface AcademyProgressCardProps {
  completedCount: number;
  totalCount: number;
  totalXp: number;
  streak: number;
  loading?: boolean;
  level?: number;
  playerTitle?: string;
  isPremium?: boolean;
}

/** The initial loading state uses the exact same title, metric grid and progress geometry. */
export default function AcademyProgressCard({
  completedCount,
  totalCount,
  totalXp,
  streak,
  loading = false,
  level,
  playerTitle,
  isPremium,
}: AcademyProgressCardProps) {
  const t = useTranslations('Academy'), ti = useTranslations('Index');
  const locale = useLocale();
  const completed = Math.max(0, Math.min(completedCount, totalCount));
  const percentage = totalCount > 0 ? Math.round(completed / totalCount * 100) : 0;
  const fmt = (value: number) => value.toLocaleString(locale);
  return <Card variant="solid" className="ui-hero-card w-full p-5 space-y-4" aria-busy={loading || undefined}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-1.5">
        {loading ? (
          <div className="flex items-center gap-1.5 mb-1">
            <Skeleton textRole="caption" width="8ch" />
            <Skeleton textRole="caption" width="14ch" />
          </div>
        ) : (
          (level != null || playerTitle || isPremium) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {isPremium && (
                <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  {t('premium')}
                </span>
              )}
              {level != null && (
                <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-brand-action/15 text-brand-action border border-brand-action/30">
                  {ti('level')} {level}
                </span>
              )}
              {playerTitle && (
                <span className="px-2.5 py-0.5 rounded-full text-caption font-bold bg-brand-elevated text-brand-primary border border-brand-border flex items-center gap-1.5 shadow-sm">
                  <FaTrophy className="text-amber-400 text-xs shrink-0" aria-hidden="true" />
                  <span>{playerTitle}</span>
                </span>
              )}
            </div>
          )
        )}
        <div>
          <h2 className="t-title-2 text-brand-primary">{t('academy_progress')}</h2>
          <p className="t-caption text-brand-muted">{t('master_the_game')}</p>
        </div>
      </div>
      <span className="ui-icon-tile ui-icon-tile--info shrink-0 mt-1"><FaGraduationCap aria-hidden="true" /></span>
    </div>
    <dl className="hero-metrics">
      <div><dt className="t-caption text-brand-muted">{t('completed')}</dt><dd className="t-numeric text-brand-primary">{loading ? <Skeleton textRole="numeric" width="4ch" /> : <><bdi>{fmt(completed)}</bdi><span className="t-caption text-brand-muted">/{fmt(totalCount)}</span></>}</dd></div>
      <div><dt className="t-caption text-brand-muted">XP</dt><dd className="t-numeric text-brand-primary">{loading ? <Skeleton textRole="numeric" width="4ch" /> : <bdi>{fmt(totalXp)}</bdi>}</dd></div>
      <div><dt className="t-caption text-brand-muted">{ti('day_streak')}</dt><dd className="t-numeric text-brand-primary">{loading ? <Skeleton textRole="numeric" width="3ch" /> : <bdi>{fmt(streak)}</bdi>}</dd></div>
    </dl>
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 t-caption text-brand-muted"><span>{t('course_completion')}</span>{loading ? <Skeleton textRole="caption" width="3ch" /> : <bdi>{fmt(percentage)}%</bdi>}</div>
      <div className="h-2 rounded-full overflow-hidden bg-brand-elevated" role={loading ? undefined : 'progressbar'} aria-label={t('course_completion')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={loading ? undefined : percentage}>
        {loading ? <Skeleton variant="rectangular" height="100%" /> : <div style={{ width: `${percentage}%` }} className="h-full rounded-full bg-brand-action" />}
      </div>
    </div>
  </Card>;
}
