'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { FiCheck, FiTarget } from 'react-icons/fi';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { SectionHeader } from './ui/PageHeader';
import { ProgressRing } from './ui/ProgressRing';
import { Badge } from './ui/Badge';
import { GoalTilesSkeleton } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { telegramHaptic } from '@/lib/telegram';
import { getTaskTitle } from '@/lib/taskTranslations';

interface Goal { task_id: number; title_key: string; progress: number; target_count: number; xp_reward: number; completed: boolean; claimed: boolean; }

/** Daily goals as progress rings. Every number comes from /gamification/tasks. */
export default function DailyGoalsBento() {
  const t = useTranslations('Gamification');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { data, error, isLoading, mutate } = useSWRFetch<Goal[]>('/api/v1/gamification/tasks', { revalidateOnFocus: false });
  const tasks = Array.isArray(data)
    ? data.filter(task => task.title_key.startsWith('daily_'))
    : [];

  const activeTasks = tasks.filter(task => !task.claimed);
  const displayTasks = (activeTasks.length > 0 ? activeTasks : tasks).sort((a, b) => {
    // Unclaimed completed (ready to claim) first
    if (!a.claimed && a.completed && (!b.completed || b.claimed)) return -1;
    if (!b.claimed && b.completed && (!a.completed || a.claimed)) return 1;
    return a.task_id - b.task_id;
  });

  return (
    <section className="w-full space-y-3" aria-labelledby="daily-goals-title">
      <SectionHeader id="daily-goals-title" title={ti('daily_tasks')} align="center" />
      {isLoading && !data ? <GoalTilesSkeleton label={t('loading_missions')} /> : error && !data ? (
        <ErrorState title={ti('load_failed')} onRetry={() => mutate()} retryLabel={ti('retry')} />
      ) : tasks.length === 0 ? (
        <EmptyState icon={<FiTarget size={24} />} title={t('no_missions')} />
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2.5 list-none p-0 m-0">
          {displayTasks.slice(0, 3).map(task => {
            const progress = Math.max(0, Math.min(task.progress, task.target_count));
            const percent = task.target_count > 0 ? (progress / task.target_count) * 100 : 0;
            const done = task.completed;
            const title = getTaskTitle(t, task.title_key);
            return (
              <li key={task.task_id} className={`goal-tile ${done ? 'goal-tile--done' : ''}`}>
                <ProgressRing percent={percent} tone={done ? 'emerald' : 'gold'} label={title} size={60} stroke={6}>
                  {done
                    ? <FiCheck size={22} className="text-brand-success" aria-hidden="true" />
                    : <span className="text-sm font-bold tabular-nums text-brand-primary">{progress}<span className="text-brand-muted">/{task.target_count}</span></span>}
                </ProgressRing>
                <p className="goal-tile__title">{title}</p>
                {task.claimed
                  ? <Badge variant="emerald">{t('claimed_status')}</Badge>
                  : done
                    ? <Link href={`/${locale}/challenges`} onClick={() => telegramHaptic('selection')}
                        className="action-button inline-flex min-h-11 items-center justify-center px-3 text-xs">{t('claim')} · +{task.xp_reward} XP</Link>
                    : <span className="goal-tile__xp">+{task.xp_reward} XP</span>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
