'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaGift, FaTrophy } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

// Mock data for UI development before API integration
const MOCK_TASKS = [
    { id: 1, title: 'daily_win', desc: 'Win a game today', reward: 50, progress: 0, target: 1, status: 'pending' },
    { id: 2, title: 'daily_play', desc: 'Play 3 games', reward: 30, progress: 2, target: 3, status: 'pending' },
    { id: 3, title: 'daily_login', desc: 'Login to the app', reward: 10, progress: 1, target: 1, status: 'claimable' },
];

export default function DailyTasks() {
    const t = useTranslations('Gamification');
    const [tasks, setTasks] = useState(MOCK_TASKS);

    const handleClaim = (taskId: number) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
        // TODO: Call API
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <FaTrophy className="text-brand-primary text-xs" />
                <h3 className="text-[10px] font-black uppercase text-brand-primary/60 tracking-[0.2em]">
                    {t('daily_missions')}
                </h3>
            </div>

            <div className="space-y-3">
                {tasks.map((task, index) => (
                    <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`
                    relative overflow-hidden rounded-xl border p-3 flex items-center justify-between
                    ${task.status === 'completed'
                                ? 'bg-brand-primary/5 border-brand-primary/10 opacity-60'
                                : 'bg-brand-surface border-brand-primary/10'}
                `}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg
                        ${task.status === 'completed' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-primary/5 text-brand-primary/60'}
                    `}>
                                {task.status === 'completed' ? <FaCheck /> : <FaGift />}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wide">
                                    {t(task.title)}
                                </h4>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-brand-primary/40 uppercase tracking-wider mt-1">
                                    <span>+{task.reward} XP</span>
                                    <span>•</span>
                                    <span>{task.progress} / {task.target}</span>
                                </div>
                            </div>
                        </div>

                        {task.status === 'claimable' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleClaim(task.id)}
                                className="px-3 py-1.5 rounded-lg bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse"
                            >
                                {t('claim')}
                            </motion.button>
                        )}

                        {task.status === 'pending' && (
                            <div className="w-16 h-1.5 bg-brand-primary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-primary/40 rounded-full"
                                    style={{ width: `${(task.progress / task.target) * 100}%` }}
                                />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
