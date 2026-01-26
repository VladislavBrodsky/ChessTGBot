'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaTrophy, FaFire, FaUserFriends, FaCheckCircle, FaStar } from "react-icons/fa";
import { useState } from "react";

// Mock Data (Replace with API call later)
const MOCK_USER = {
    level: 7,
    xp: 650,
    nextLevelXp: 1000,
    dailyStreak: 12
};

const MOCK_TASKS = [
    { id: 1, title: "Win 3 Blitz Games", xp: 150, progress: 2, target: 3, completed: false },
    { id: 2, title: "Play 5 Bullet Games", xp: 100, progress: 5, target: 5, completed: true, claimed: false },
    { id: 3, title: "Solve 10 Puzzles", xp: 200, progress: 0, target: 10, completed: false },
];

export default function ChallengesPage() {
    const [tasks, setTasks] = useState(MOCK_TASKS);

    const handleClaim = (taskId: number) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, claimed: true } : t));
        // Add claim logic/animation here
    };

    const progressPercentage = (MOCK_USER.xp / MOCK_USER.nextLevelXp) * 100;

    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            <div className="w-full max-w-md flex flex-col items-start px-4">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-8">
                    <Link href="/">
                        <motion.button
                            whileHover={{ x: -2 }}
                            className="text-brand-primary/40 hover:text-brand-primary transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <FaArrowLeft className="text-[10px]" />
                            <span>Return</span>
                        </motion.button>
                    </Link>
                    <div className="px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">
                        Command Center • V2
                    </div>
                </div>

                {/* Level Progress Card */}
                <div className="w-full relative overflow-hidden rounded-3xl p-1 mb-8">
                    <div className="absolute inset-0 bg-linear-to-br from-brand-primary/10 via-brand-primary/5 to-transparent" />
                    <div className="relative glass-panel rounded-[20px] p-6 border-brand-primary/10 flex flex-col items-center text-center">
                        {/* Level Badge */}
                        <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 rotate-3 mb-4 flex items-center justify-center border border-brand-primary/10 shadow-[0_0_30px_rgba(var(--color-brand-primary-rgb),0.1)]">
                            <div className="w-16 h-16 rounded-xl bg-brand-void -rotate-3 flex items-center justify-center flex-col">
                                <span className="text-[10px] text-brand-primary/60 font-bold uppercase">Lvl</span>
                                <span className="text-2xl font-black text-brand-primary leading-none">{MOCK_USER.level}</span>
                            </div>
                        </div>

                        <h1 className="text-2xl font-black text-brand-primary italic tracking-tighter uppercase mb-1">Grandmaster Rising</h1>
                        <p className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-[0.2em] mb-6">
                            Next Reward: Golden Pawn Skin
                        </p>

                        {/* XP Bar */}
                        <div className="w-full max-w-[240px] relative h-3 bg-brand-primary/5 rounded-full overflow-hidden mb-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="absolute top-0 left-0 h-full bg-brand-primary shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.5)]"
                            />
                        </div>
                        <div className="flex justify-between w-full max-w-[240px] text-[9px] font-bold text-brand-primary/30 uppercase tracking-widest">
                            <span>{MOCK_USER.xp} XP</span>
                            <span>{MOCK_USER.nextLevelXp} XP</span>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="w-full grid grid-cols-2 gap-4 mb-8">
                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border-brand-primary/5">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <FaFire />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-brand-primary leading-none">{MOCK_USER.dailyStreak}</span>
                            <span className="text-[9px] font-bold text-brand-primary/30 uppercase tracking-widest">Day Streak</span>
                        </div>
                    </div>
                    <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border-brand-primary/5">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FaTrophy />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black text-brand-primary leading-none">#42</span>
                            <span className="text-[9px] font-bold text-brand-primary/30 uppercase tracking-widest">League Rank</span>
                        </div>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="w-full mb-8">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary/20 tracking-[0.3em] pl-4 mb-4">Daily Operations</h3>
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <motion.div
                                key={task.id}
                                whileHover={{ scale: 1.01 }}
                                className={`glass-panel p-4 rounded-2xl border ${task.completed && !task.claimed ? 'border-brand-primary/30 bg-brand-primary/5' : 'border-brand-primary/5'} transition-all`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task.completed ? 'bg-brand-primary text-brand-void' : 'bg-brand-primary/5 text-brand-primary/40'}`}>
                                            {task.completed ? <FaCheckCircle /> : <FaStar />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-brand-primary mb-1">{task.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-16 bg-brand-primary/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${(task.progress / task.target) * 100}%` }} />
                                                </div>
                                                <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-wider">{task.progress}/{task.target}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {task.completed && !task.claimed ? (
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleClaim(task.id)}
                                            className="px-4 py-2 rounded-lg bg-brand-primary text-brand-void text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(var(--color-brand-primary-rgb),0.3)] animate-pulse"
                                        >
                                            Claim
                                        </motion.button>
                                    ) : task.claimed ? (
                                        <span className="text-[10px] font-bold text-brand-primary/20 uppercase tracking-widest">Completed</span>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-brand-primary">{task.xp} XP</span>
                                            <span className="text-[9px] text-brand-primary/30 font-bold uppercase tracking-wide">Reward</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Referral Card */}
                <div className="w-full glass-panel p-6 rounded-3xl border-brand-primary/5 bg-linear-to-r from-purple-500/10 to-transparent relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <FaUserFriends className="text-6xl text-purple-500" />
                    </div>
                    <h3 className="text-lg font-black text-brand-primary mb-2">Recruit Agents</h3>
                    <p className="text-xs text-brand-primary/60 mb-6 max-w-[70%]">Invite friends to your squad and earn 500 XP per recruit.</p>
                    <button className="w-full py-3 rounded-xl bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary hover:text-brand-void transition-all text-xs font-black uppercase tracking-[0.2em]">
                        Copy Referral Link
                    </button>
                </div>
            </div>
        </LayoutWrapper>
    );
}
