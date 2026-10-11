'use client';

import { useCallback } from 'react';
import { useSWRFetch } from '@/hooks/useSWRFetch';

export interface Task {
  id: number;
  task_id: number;
  title_key: string;
  progress: number;
  target_count: number;
  xp_reward: number;
  completed: boolean;
  claimed: boolean;
}

/** One task cache for navigation, Home, Play, Profile and Challenges. */
export function useTasks() {
  const { data, error, isLoading, mutate } = useSWRFetch<Task[]>('/api/v1/gamification/tasks', { revalidateOnFocus: false });
  const setTasks = useCallback((update: Task[] | ((tasks: Task[]) => Task[])) => {
    void mutate(current => typeof update === 'function' ? update(current ?? []) : update, { revalidate: false });
  }, [mutate]);
  return { tasks: Array.isArray(data) ? data : [], error, loading: isLoading && !data, refresh: mutate, setTasks };
}
