'use client';

import { useSWRFetch } from '@/hooks/useSWRFetch';

interface TaskState { completed: boolean; claimed: boolean; }

/**
 * Number of daily tasks that are finished but not yet claimed. Shares the SWR cache entry with DailyGoalsBento,
 * so it costs no extra request on Home. Pass `enabled: false` to skip fetching (hidden navbar, signed-out pages).
 */
export function useClaimableTasks(enabled = true): number {
  const { data } = useSWRFetch<TaskState[]>(enabled ? '/api/v1/gamification/tasks' : null, { revalidateOnFocus: false });
  return Array.isArray(data) ? data.filter(task => task.completed && !task.claimed).length : 0;
}
