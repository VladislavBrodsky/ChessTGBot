'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { FaFire } from 'react-icons/fa';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { useUser } from '@/context/UserContext';
import { telegramHaptic } from '@/lib/telegram';

interface Task { task_id: number; title_key: string; progress: number; target_count: number; xp_reward: number; completed: boolean; claimed: boolean }

/** Progress toward today's play goal plus the current win streak. Both come from the player's real data. */
export function DailyGoal({ t }: { t: (key: string) => string }) {
  const locale = useLocale();
  const { stats } = useUser();
  const { data } = useSWRFetch<Task[]>('/api/v1/gamification/tasks', { revalidateOnFocus: false });
  const task = Array.isArray(data) ? data.find(item => item.title_key === 'daily_play') : undefined;
  const streak = stats?.current_streak?.type === 'win' ? Number(stats.current_streak.count) : 0;
  if (!task && streak < 2) return null;

  const progress = task ? Math.min(task.progress, task.target_count) : 0;
  const percent = task && task.target_count > 0 ? (progress / task.target_count) * 100 : 0;
  const ready = Boolean(task?.completed && !task.claimed);
  return (
    <div className="lobby-goal">
      {task && (
        <div className="lobby-goal__text">
          <div className="lobby-goal__row">
            <span>{t('lobby_daily_goal')}</span>
            <span>{ready ? t('lobby_reward_ready') : `${progress}/${task.target_count} · +${task.xp_reward} XP`}</span>
          </div>
          <div className="lobby-goal__bar" role="progressbar" aria-label={t('lobby_daily_goal')} aria-valuemin={0} aria-valuemax={task.target_count} aria-valuenow={progress}>
            <div className="lobby-goal__fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
      {streak >= 2 && (
        <span className="lobby-goal__streak"><FaFire aria-hidden="true" />{t('lobby_streak')} {streak}</span>
      )}
      {ready && (
        <Link href={`/${locale}/challenges`} onClick={() => telegramHaptic('selection')} className="ui-tap-target inline-flex min-h-11 items-center rounded-xl px-3 text-xs font-semibold text-brand-success hover:bg-brand-elevated">
          →
        </Link>
      )}
    </div>
  );
}
