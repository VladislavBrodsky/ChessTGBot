'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaGift, FaTrophy } from 'react-icons/fa';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

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
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

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
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));
            
            const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
                method: "POST"
            });
            if (!res.ok) {
                // Rollback if failed
                fetchTasks();
            }
        } catch (err) {
            console.error("Failed to claim task reward:", err);
            fetchTasks();
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-brand-primary text-xs" />
                <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-60 tracking-[0.2em]">
                    {t('daily_missions')}
                </h3>
            </div>

            <div className="space-y-3 w-full">
                {loading ? (
                    <TaskSkeleton />
                ) : tasks.length === 0 ? (
                    <div className="text-center py-4 text-xs font-bold text-brand-primary opacity-30 uppercase tracking-widest">
                        {t('no_missions')}
                    </div>
                ) : (
                    tasks.map((task, index) => {
                        const status = task.claimed ? 'completed' : task.completed ? 'claimable' : 'pending';
                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`
                                    relative overflow-hidden rounded-xl border p-3 flex items-center justify-between
                                    ${status === 'completed'
                                        ? 'bg-brand-bg-opacity-5 border-brand-border-opacity-10 opacity-60'
                                        : 'bg-brand-surface border-brand-border-opacity-10'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-10 h-10 rounded-lg flex items-center justify-center text-lg
                                        ${status === 'completed' ? 'bg-brand-bg-opacity-10 text-brand-primary' : 'bg-brand-bg-opacity-5 text-brand-primary opacity-60'}
                                    `}>
                                        {status === 'completed' ? <FaCheck /> : <FaGift />}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                                            {t.has(task.title_key) ? t(task.title_key) : task.title_key}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-wider mt-1">
                                            <span>+{task.xp_reward} XP</span>
                                            <span>•</span>
                                            <span>{task.progress} / {task.target_count}</span>
                                        </div>
                                    </div>
                                </div>

                                {status === 'claimable' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleClaim(task.task_id)}
                                        className="px-3 py-1.5 rounded-lg bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-widest shadow-sm animate-pulse cursor-pointer"
                                    >
                                        {t('claim')}
                                    </motion.button>
                                )}

                                {status === 'pending' && (
                                    <div className="w-16 h-1.5 bg-brand-bg-opacity-10 rounded-full overflow-hidden border border-brand-border-opacity-5">
                                        <div
                                            className="h-full bg-brand-primary opacity-50 rounded-full"
                                            style={{ width: `${(task.progress / task.target_count) * 100}%` }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
