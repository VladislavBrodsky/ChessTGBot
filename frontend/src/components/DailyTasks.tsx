'use client';

import { useState } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { useToast } from '@/context/ToastContext';
import { FaCheck, FaGift } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

import { useUser } from '@/context/UserContext';
import { triggerTaskSuccess } from '@/lib/telegram';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionHeader } from '@/components/ui/PageHeader';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const TaskSkeleton = () => <SkeletonList count={3} />;

export default function DailyTasks() {
    const t = useTranslations('Gamification');
    const ti = useTranslations('Index');
    const { syncStats } = useUser();
    const { tasks: allTasks, error: loadError, loading, refresh: fetchTasks, setTasks } = useTasks();
    const tasks = allTasks.filter(task => task.title_key.startsWith('daily_'));
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const toast = useToast();

    const handleClaim = async (taskDefId: number) => {
        if (claimingId !== null) return;
        const task = tasks.find(t => t.task_id === taskDefId);
        const previousTasks = allTasks;
        setClaimingId(taskDefId);
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));
            
            const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
                method: "POST"
            });
            if (res.ok) {
                // Sync user stats in real time so XP score & progress bar update immediately
                syncStats();
                if (task) {
                    let title = task.title_key;
                    try {
                        title = t(task.title_key);
                    } catch {
                        // fallback
                    }
                    triggerTaskSuccess(title, task.xp_reward);
                }
            } else {
                // Rollback if failed
                setTasks(previousTasks);
                toast.error(ti('action_failed'));
            }
        } catch (err) {
            console.error("Failed to claim task reward:", err);
            setTasks(previousTasks);
            toast.error(ti('action_failed'));
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <section aria-labelledby="daily-missions-title" className="w-full space-y-4">
            <SectionHeader id="daily-missions-title" title={t('daily_missions')} />

            <div className="space-y-3 w-full">
                {loading ? (
                    <TaskSkeleton />
                    ) : loadError && tasks.length === 0 ? (
                        <ErrorState key="error" title={ti('load_failed')} onRetry={fetchTasks} retryLabel={ti('retry')} />
                    ) : tasks.length === 0 ? (
                        <p className="text-center py-4 t-body text-brand-muted">{t('no_missions')}</p>
                    ) : (
                        <ol role="list" className="space-y-3 list-none m-0 p-0 relative">

                            {tasks.map((task) => {
                                const status = task.claimed ? 'completed' : task.completed ? 'claimable' : 'pending';
                                return (
                                    <li
                                        key={task.id}
                                        className={`ui-list-row ${status === 'claimable' ? 'ui-stat--accent' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pe-2">
                                            <span className={`ui-icon-tile ${status === 'pending' ? '' : 'ui-icon-tile--success'}`}>
                                                {status === 'completed' ? <FaCheck className="text-sm" aria-hidden="true" /> : <FaGift className="text-sm" aria-hidden="true" />}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className={`text-sm font-semibold leading-snug break-words ${status === 'completed' ? 'text-brand-muted' : 'text-brand-primary'}`}>
                                                    {t(task.title_key)}
                                                </h3>
                                                <div className="flex items-center gap-2 text-caption font-medium text-brand-muted mt-0.5 tabular-nums">
                                                    <span className="text-brand-gold">+{task.xp_reward} XP</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span dir="ltr">{task.progress} / {task.target_count}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {status === 'claimable' && (
                                            <Button variant="action" size="sm"
                                                onClick={() => handleClaim(task.task_id)}
                                                disabled={claimingId !== null} isLoading={claimingId === task.task_id}
                                                className="ui-tap-target action-button px-4 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                                            >
                                                {t('claim')}
                                            </Button>
                                        )}

                                        {status === 'completed' && <Badge variant="emerald">{t('claimed_status')}</Badge>}
                                        {status === 'pending' && (
                                            <div className="w-16 h-1.5 bg-brand-elevated rounded-full overflow-hidden border border-brand-border-opacity-10 relative" role="progressbar" aria-label={t(task.title_key)} aria-valuemin={0} aria-valuemax={task.target_count} aria-valuenow={task.progress}>
                                                <div
                                                    style={{ width: `${Math.min(100, (task.progress / Math.max(task.target_count, 1)) * 100)}%` }}
                                                    className="h-full bg-brand-action rounded-full absolute start-0 top-0"
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}

            </div>
        </section>
    );
}
