'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaGift } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

import { useUser } from '@/context/UserContext';
import { triggerTaskSuccess } from '@/lib/telegram';
import { ErrorState } from '@/components/ui/ErrorState';
import { SectionHeader } from '@/components/ui/PageHeader';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

const TaskSkeleton = () => <SkeletonList count={3} />;

export default function DailyTasks() {
    const t = useTranslations('Gamification');
    const ti = useTranslations('Index');
    const { syncStats } = useUser();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);
    const [loadError, setLoadError] = useState(false);

    const fetchTasks = async () => {
        setLoadError(false);
        try {
            const res = await apiFetch("/api/v1/gamification/tasks");
            if (!res.ok) throw new Error('Task feed unavailable');
            const data = await res.json();
            if (!Array.isArray(data)) throw new Error('Invalid task feed');
            setTasks(data.filter(task => typeof task.title_key === 'string' && task.title_key.startsWith('daily_')));
        } catch (err) {
            console.error("Failed to fetch daily tasks:", err);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleClaim = async (taskDefId: number) => {
        if (claimingId) return;
        const task = tasks.find(t => t.task_id === taskDefId);
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
                fetchTasks();
            }
        } catch (err) {
            console.error("Failed to claim task reward:", err);
            fetchTasks();
        } finally {
            setClaimingId(null);
        }
    };

    return (
        <section aria-labelledby="daily-missions-title" className="w-full space-y-4">
            <SectionHeader id="daily-missions-title" title={t('daily_missions')} />

            <div className="space-y-3 w-full">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="skeleton"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <TaskSkeleton />
                        </motion.div>
                    ) : loadError && tasks.length === 0 ? (
                        <ErrorState key="error" title={ti('load_failed')} onRetry={fetchTasks} retryLabel={ti('retry')} />
                    ) : tasks.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-center py-8 text-sm font-medium text-brand-muted"
                        >
                            {t('no_missions')}
                        </motion.div>
                    ) : (
                        <ol role="list" className="space-y-3 list-none m-0 p-0 relative">

                            {tasks.map((task) => {
                                const status = task.claimed ? 'completed' : task.completed ? 'claimable' : 'pending';
                                return (
                                    <li
                                        key={task.id}
                                        className={`ui-list-row list-item-contain ${status === 'claimable' ? 'ui-stat--accent' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                            <span className={`ui-icon-tile ${status === 'pending' ? '' : 'ui-icon-tile--success'}`}>
                                                {status === 'completed' ? <FaCheck className="text-sm" aria-hidden="true" /> : <FaGift className="text-sm" aria-hidden="true" />}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={`text-sm font-semibold leading-snug truncate ${status === 'completed' ? 'text-brand-muted' : 'text-brand-primary'}`}>
                                                    {t(task.title_key)}
                                                </h4>
                                                <div className="flex items-center gap-2 text-caption font-medium text-brand-muted mt-0.5 tabular-nums">
                                                    <span className="text-brand-gold">+{task.xp_reward} XP</span>
                                                    <span aria-hidden="true">·</span>
                                                    <span>{task.progress} / {task.target_count}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {status === 'claimable' && (
                                            <button type="button"
                                                onClick={() => handleClaim(task.task_id)}
                                                disabled={claimingId === task.task_id}
                                                className="ui-tap-target action-button px-4 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
                                            >
                                                {claimingId === task.task_id ? '…' : t('claim')}
                                            </button>
                                        )}

                                        {status === 'completed' && <Badge variant="emerald">{t('claimed_status')}</Badge>}
                                        {status === 'pending' && (
                                            <div className="w-16 h-1.5 bg-brand-elevated rounded-full overflow-hidden border border-brand-border-opacity-10 relative" role="progressbar" aria-label={t(task.title_key)} aria-valuemin={0} aria-valuemax={task.target_count} aria-valuenow={task.progress}>
                                                <div
                                                    style={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }}
                                                    className="h-full bg-brand-action rounded-full absolute left-0 top-0 transition-[width] duration-500"
                                                />
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
