'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { FiCheckCircle, FiTarget } from 'react-icons/fi';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Card } from './ui/Card';
import { ActionLink, SectionHeader } from './ui/PageHeader';
import { SkeletonList } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { telegramHaptic } from '@/lib/telegram';

interface Goal { task_id: number; title_key: string; progress: number; target_count: number; xp_reward: number; completed: boolean; claimed: boolean; }

/** Real daily task progress. Never infer daily activity from lifetime XP. */
export default function DailyGoalsBento() {
  const t = useTranslations('Gamification');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWRFetch<Goal[]>('/api/v1/gamification/tasks', { revalidateOnFocus: false });
  const tasks = Array.isArray(data)
    ? data.filter(task => task.title_key.startsWith('daily_')).sort((a, b) => Number(a.claimed) - Number(b.claimed) || Number(a.completed) - Number(b.completed) || a.task_id - b.task_id)
    : [];
  return (
    <section className="w-full space-y-3" aria-labelledby="daily-goals-title">
      <SectionHeader id="daily-goals-title" title={ti('daily_tasks')} />
      {isLoading && !data ? <SkeletonList count={3} /> : error && !data ? (
        <ErrorState title={ti('load_failed')} onRetry={() => mutate()} retryLabel={ti('retry')} />
      ) : tasks.length === 0 ? (
        <EmptyState icon={<FiTarget size={24} />} title={t('no_missions')} />
      ) : (
        <Card variant="solid" className="divide-y divide-brand-border">
          {tasks.slice(0, 3).map(task => {
            const progress = Math.max(0, Math.min(task.progress, task.target_count));
            const percent = task.target_count > 0 ? Math.min(100, progress / task.target_count * 100) : 0;
            return (
              <div key={task.task_id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {task.completed ? <FiCheckCircle size={20} className="mt-0.5 shrink-0 text-brand-success" aria-hidden="true" /> : <FiTarget size={20} className="mt-0.5 shrink-0 text-brand-muted" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-primary">{t(task.title_key)}</p>
                    <p className="mt-1 text-caption text-brand-muted">{progress} / {task.target_count} · +{task.xp_reward} XP</p>
                  </div>
                  {task.completed && (task.claimed
                    ? <span className="text-caption text-brand-success">{t('claimed_status')}</span>
                    : <Link href={`/${locale}/challenges`} className="inline-flex min-h-11 items-center rounded-xl px-3 text-caption font-semibold text-brand-success" onClick={() => telegramHaptic('selection')}>{t('claim')}</Link>)}
                </div>
                <div role="progressbar" aria-label={t(task.title_key)} aria-valuemin={0} aria-valuemax={task.target_count} aria-valuenow={progress} className="h-1.5 overflow-hidden rounded-full bg-brand-elevated">
                  <div className="h-full rounded-full bg-brand-action" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}
      <ActionLink href={`/${locale}/challenges`}>{ti('nav_quests')}</ActionLink>
    </section>
  );
}
