'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaGift, FaTrophy } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

import { useUser } from '@/context/UserContext';
import { triggerTaskSuccess } from '@/lib/telegram';

const TaskSkeleton = () => (
    <div className="w-full flex flex-col space-y-3">
        {[1, 2, 3].map((n) => (
            <div key={n} className="relative overflow-hidden rounded-xl border border-brand-border-opacity-10 p-3 flex items-center justify-between bg-brand-surface animate-pulse">
                <div className="flex items-center gap-3 w-2/3">
                    <div className="w-10 h-10 rounded-lg bg-brand-primary opacity-10 shrink-0" />
                    <div className="flex flex-col space-y-1.5 w-full">
                        <div className="h-2.5 bg-brand-primary opacity-10 rounded w-1/2" />
                        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-1/3" />
                    </div>
                </div>
                <div className="w-16 h-1.5 bg-brand-primary opacity-5 rounded-full" />
            </div>
        ))}
    </div>
);

export default function DailyTasks() {
    const t = useTranslations('Gamification');
    const { syncStats } = useUser();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [claimingId, setClaimingId] = useState<number | null>(null);

    const fetchTasks = async () => {
        try {
            const res = await apiFetch("/api/v1/gamification/tasks");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTasks(data);
                }
            }
        } catch (err) {
            console.error("Failed to fetch daily tasks:", err);
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
            <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-brand-primary text-xs" />
                <h3 id="daily-missions-title" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.2em]">
                    {t('daily_missions')}
                </h3>
            </div>

            <motion.div layout className="space-y-3 w-full">
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
                    ) : tasks.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="text-center py-8 text-xs font-bold text-brand-muted uppercase tracking-widest"
                        >
                            {t('no_missions')}
                        </motion.div>
                    ) : (
                        <ol role="list" className="space-y-3 list-none m-0 p-0 relative">
                            {/* Connected vertical milestone track */}
                            <div className="absolute left-[26px] top-4 bottom-4 w-0.5 bg-brand-border-opacity-10 pointer-events-none -z-0" />
                            
                            {tasks.map((task, index) => {
                                const status = task.claimed ? 'completed' : task.completed ? 'claimable' : 'pending';
                                return (
                                    <motion.li
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.04 }}
                                        className={`
                                            relative overflow-hidden rounded-2xl border p-3 flex items-center justify-between transition-all duration-300 list-item-contain z-10
                                            ${status === 'completed'
                                                ? 'bg-brand-void/50 border-brand-border-opacity-10 opacity-70'
                                                : status === 'claimable'
                                                ? 'bg-gradient-to-r from-brand-surface to-emerald-950/25 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                                                : 'bg-brand-surface/90 border-brand-border-opacity-10'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                            <div className={`
                                                w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-300 shrink-0
                                                ${status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                                                : status === 'claimable' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                                : 'bg-brand-elevated text-brand-muted border border-brand-border-opacity-10'}
                                            `}>
                                                {status === 'completed' ? <FaCheck className="text-xs" /> : <FaGift className={status === 'claimable' ? 'animate-pulse text-xs' : 'text-xs'} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-snug header-balanced truncate">
                                                    {t(task.title_key)}
                                                </h4>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-brand-muted uppercase tracking-wider mt-0.5">
                                                    <span className="text-amber-400">+{task.xp_reward} XP</span>
                                                    <span>•</span>
                                                    <span>{task.progress} / {task.target_count}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {status === 'claimable' && (
                                            <motion.button
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.94 }}
                                                onClick={() => handleClaim(task.task_id)}
                                                disabled={claimingId === task.task_id}
                                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_14px_rgba(16,185,129,0.35)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] text-[10px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all select-none"
                                            >
                                                {claimingId === task.task_id ? '...' : t('claim')}
                                            </motion.button>
                                        )}

                                        {status === 'pending' && (
                                            <div className="w-16 h-1.5 bg-brand-elevated rounded-full overflow-hidden border border-brand-border-opacity-10 relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.04 + 0.1 }}
                                                    className="h-full bg-brand-primary opacity-60 rounded-full absolute left-0 top-0"
                                                />
                                            </div>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ol>
                    )}
                </AnimatePresence>
            </motion.div>
        </section>
    );
}
