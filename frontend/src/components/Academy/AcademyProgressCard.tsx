'use client';

import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLocale, useTranslations } from 'next-intl';
import { FaGraduationCap } from 'react-icons/fa';

interface AcademyProgressCardProps { completedCount: number; totalCount: number; totalXp: number; streak: number; loading?: boolean }

/** The initial loading state uses the exact same title, metric grid and progress geometry. */
export default function AcademyProgressCard({ completedCount, totalCount, totalXp, streak, loading = false }: AcademyProgressCardProps) {
  const t = useTranslations('Academy'), ti = useTranslations('Index');
  const locale = useLocale();
  const completed = Math.max(0, Math.min(completedCount, totalCount));
  const percentage = totalCount > 0 ? Math.round(completed / totalCount * 100) : 0;
  const fmt = (value: number) => value.toLocaleString(locale);
  return <Card variant="solid" className="ui-hero-card w-full p-5 space-y-4" aria-busy={loading || undefined}>
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <h2 className="t-title-2 text-brand-primary">{t('academy_progress')}</h2>
        <p className="t-caption text-brand-muted">{t('master_the_game')}</p>
      </div>
      <span className="ui-icon-tile ui-icon-tile--info shrink-0"><FaGraduationCap aria-hidden="true" /></span>
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
