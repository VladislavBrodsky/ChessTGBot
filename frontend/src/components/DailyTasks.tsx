'use client';

import { useState } from 'react';
import { GramAmount } from '@/components/ui/GramAmount';
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
import { MetaLine } from '@/components/ui/MetaLine';
import { Button } from '@/components/ui/Button';

const TaskSkeleton = () => <SkeletonList count={3} />;

export default function DailyTasks() {
    const t = useTranslations('Gamification');
    const ti = useTranslations('Index');
    const { syncStats, syncBalance } = useUser();
    const { tasks: allTasks, error: loadError, loading, refresh: fetchTasks, setTasks } = useTasks();
    const tasks = allTasks.filter(task => task.title_key.startsWith('daily_'));
    const activeTasks = tasks.filter(task => !task.claimed);
    const completedTasks = tasks.filter(task => task.claimed);
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const [showArchive, setShowArchive] = useState(false);
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
                void Promise.allSettled([syncStats(), syncBalance()]);
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

    const renderTaskRow = (task: typeof tasks[number]) => {
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
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <h3 className={`text-sm font-semibold leading-snug break-words ${status === 'completed' ? 'text-brand-muted' : 'text-brand-primary'}`}>
                            {t(task.title_key)}
                        </h3>
                        <MetaLine className="t-caption font-medium tabular-nums text-brand-muted">
                            <span className="text-brand-gold-ink">+{task.xp_reward} XP</span>
                            {task.gram_reward_nano && task.gram_reward_nano !== "0" && <GramAmount plus nano={task.gram_reward_nano} className="text-brand-action" />}
                        </MetaLine>
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
                    <div className="flex w-20 shrink-0 flex-col items-end gap-1">
                        <span className="t-caption font-medium tabular-nums text-brand-muted" dir="ltr">{task.progress} / {task.target_count}</span>
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-brand-border-opacity-10 bg-brand-elevated" role="progressbar" aria-label={t(task.title_key)} aria-valuemin={0} aria-valuemax={task.target_count} aria-valuenow={task.progress}>
                            <div
                                style={{ width: `${Math.min(100, (task.progress / Math.max(task.target_count, 1)) * 100)}%` }}
                                className="absolute start-0 top-0 h-full rounded-full bg-brand-action"
                            />
                        </div>
                    </div>
                )}
            </li>
        );
    };

    return (
        <section aria-labelledby="daily-missions-title" className="w-full space-y-2">
            <SectionHeader id="daily-missions-title" title={t('daily_missions')} />

            <div className="w-full">
                {loading ? (
                    <TaskSkeleton />
                ) : loadError && tasks.length === 0 ? (
                    <ErrorState key="error" title={ti('load_failed')} onRetry={fetchTasks} retryLabel={ti('retry')} />
                ) : tasks.length === 0 ? (
                    <p className="text-center py-4 t-body text-brand-muted">{t('no_missions')}</p>
                ) : (
                    <div className="space-y-3">
                        {activeTasks.length === 0 ? (
                            <p className="text-center py-4 t-body text-brand-muted">{t('no_active_missions')}</p>
                        ) : (
                            <ol role="list" className="space-y-2 list-none m-0 p-0 relative">
                                {activeTasks.map(renderTaskRow)}
                            </ol>
                        )}

                        {completedTasks.length > 0 && (
                            <div className="pt-1">
                                <button
                                    type="button"
                                    aria-label={t('completed_missions')}
                                    onClick={() => setShowArchive(prev => !prev)}
                                    aria-expanded={showArchive}
                                    className="ui-tap-target ui-list-row ui-list-row--interactive w-full text-xs font-semibold text-brand-muted hover:text-brand-primary cursor-pointer flex items-center justify-between"
                                >
                                    <span>{t('completed_missions')}</span>
                                    <Badge size="counter" variant="secondary">{completedTasks.length}</Badge>
                                </button>
                                {showArchive && (
                                    <ol role="list" className="space-y-2 list-none m-0 p-0 pt-2 relative">
                                        {completedTasks.map(renderTaskRow)}
                                    </ol>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </section>
    );
}
