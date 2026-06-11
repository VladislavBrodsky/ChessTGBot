'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaTrophy, FaFire, FaUserFriends, FaCheckCircle, FaStar } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";

export default function ChallengesPage() {
 const locale = useLocale();
 const t = useTranslations('Gamification');

 const [user, setUser] = useState<any>({ level: 1, xp: 0, referral_code: "", dailyStreak: 1 });
 const [tasks, setTasks] = useState<any[]>([]);
 const [loading, setLoading] = useState<boolean>(true);
 const [copied, setCopied] = useState<boolean>(false);

 useEffect(() => {
 // Fetch user stats
 apiFetch("/api/v1/users/sync", { method: "POST" })
 .then(res => res.json())
 .then(data => {
 if (data && data.level) {
 setUser((prev: any) => ({
 ...prev,
 ...data
 }));
 }
 })
 .catch(err => console.error("Failed to sync user stats:", err));

 // Fetch user tasks
 apiFetch("/api/v1/gamification/tasks")
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) {
 setTasks(data);
 }
 })
 .catch(err => console.error("Failed to fetch user tasks:", err))
 .finally(() => setLoading(false));
 }, []);

 const handleClaim = async (taskDefId: number) => {
 try {
 const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
 method: "POST"
 });
 if (res.ok) {
 const data = await res.json();
 setUser((prev: any) => ({
 ...prev,
 xp: data.new_xp,
 level: data.new_level
 }));
 // Update local task state
 setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));
 }
 } catch (err) {
 console.error("Failed to claim task reward:", err);
 }
 };

 // Every level requires 200 XP
 const currentLevelMinXp = (user.level - 1) * 200;
 const nextLevelXp = user.level * 200;
 const levelProgressXp = user.xp - currentLevelMinXp;
 const progressPercentage = Math.min(100, Math.max(0, (levelProgressXp / 200) * 100));

 const userCode = user.referral_code || "";
 const botUsername = user.bot_username || "FinChess_bot";
 const inviteLink = userCode
   ? `https://t.me/${botUsername}?start=ref_${userCode}`
   : `https://t.me/${botUsername}`;

 const handleCopyReferral = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(inviteLink);
  }
  // Also share via Telegram if available
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    const tg = (window as any).Telegram.WebApp;
    try {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent('Join me on FinChess and earn crypto while playing chess! 🎯♟️')}`);
    } catch (err) {
      console.warn("Telegram openTelegramLink failed", err);
    }
  }
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
 };

 return (
 <LayoutWrapper className="justify-start pt-8 pb-32">
 <div className="w-full max-w-sm flex flex-col items-start px-4 mx-auto">
 {/* Header */}
 <div className="w-full flex justify-between items-center mb-8">
 <Link href={`/${locale}/home`}>
 <motion.button
 whileHover={{ x: -2 }}
 className="text-brand-primary opacity-40 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
 >
 <FaArrowLeft className="text-[10px]" />
 <span>Return</span>
 </motion.button>
 </Link>
 <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border-opacity-10 text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest">
 Command Center • V2
 </div>
 </div>

 {/* Level Progress Card */}
 <motion.div 
 whileHover={{ rotateY: 5, rotateX: -5 }}
 transition={{ type: "spring", stiffness: 300, damping: 20 }}
 style={{ transformStyle: "preserve-3d" }}
 className="w-full relative overflow-hidden rounded-3xl p-[1px] mb-8 bg-gradient-to-br from-brand-border-opacity-20 via-transparent to-brand-bg-opacity-5"
 >
 <div className="relative glass-panel rounded-[23px] p-6 border-brand-border-opacity-10 bg-brand-surface flex flex-col items-center text-center">
 {/* Level Badge */}
 <div className="w-20 h-20 rounded-2xl bg-brand-bg-opacity-5 rotate-3 mb-4 flex items-center justify-center border border-brand-border-opacity-10 shadow-sm">
 <div className="w-16 h-16 rounded-xl bg-brand-void -rotate-3 flex items-center justify-center flex-col border border-brand-border-opacity-10">
 <span className="text-[10px] text-brand-primary opacity-40 font-bold uppercase">Lvl</span>
 <span className="text-2xl font-black text-brand-primary leading-none">{user.level}</span>
 </div>
 </div>

 <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1">Grandmaster Rising</h1>
 <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
 Next Level: {nextLevelXp} XP
 </p>

 {/* XP Bar */}
 <div className="w-full max-w-[240px] relative h-3 bg-brand-bg-opacity-5 rounded-full overflow-hidden mb-2 border border-brand-border-opacity-5">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${progressPercentage}%` }}
 transition={{ duration: 1.5, ease: "circOut" }}
 className="absolute top-0 left-0 h-full bg-brand-primary shadow-sm"
 />
 </div>
 <div className="flex justify-between w-full max-w-[240px] text-[9px] font-bold text-brand-primary opacity-30 uppercase tracking-widest">
 <span>{user.xp} XP</span>
 <span>{nextLevelXp} XP</span>
 </div>
 </div>
 </motion.div>

 {/* Stats Row */}
 <div className="w-full grid grid-cols-2 gap-3 mb-8">
 <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border-brand-border-opacity-10 bg-brand-surface shadow-sm">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 flex items-center justify-center text-brand-primary">
 <FaFire className="opacity-80" />
 </div>
 <div className="flex flex-col">
 <span className="text-lg font-black text-brand-primary leading-none">{user.games_played || 0}</span>
 <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mt-0.5">Battles</span>
 </div>
 </div>
 <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border-brand-border-opacity-10 bg-brand-surface shadow-sm">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 flex items-center justify-center text-brand-primary">
 <FaTrophy className="opacity-80" />
 </div>
 <div className="flex flex-col">
 <span className="text-lg font-black text-brand-primary leading-none">{user.elo || 1000}</span>
 <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mt-0.5">ELO Rating</span>
 </div>
 </div>
 </div>

 {/* Tasks Section */}
 <div className="w-full mb-8">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] pl-1 mb-4">Daily Operations</h3>
 <div className="space-y-3 w-full">
 {loading ? (
 <div className="text-center py-4 text-xs font-bold text-brand-primary opacity-40 uppercase tracking-widest animate-pulse">
 Loading missions...
 </div>
 ) : tasks.length === 0 ? (
 <div className="text-center py-4 text-xs font-bold text-brand-primary opacity-30 uppercase tracking-widest">
 No active missions
 </div>
 ) : (
 tasks.map((task) => (
 <motion.div
 key={task.id}
 whileHover={{ scale: 1.01 }}
 className={`glass-panel p-4 rounded-2xl border ${task.completed && !task.claimed ? 'border-brand-border-opacity-20 bg-brand-bg-opacity-5' : 'border-brand-border-opacity-10 bg-brand-surface'} transition-all shadow-sm`}
 >
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-4">
 <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${task.completed ? 'bg-brand-primary text-brand-void' : 'bg-brand-bg-opacity-5 text-brand-primary opacity-40 border border-brand-border-opacity-10'}`}>
 {task.completed ? <FaCheckCircle /> : <FaStar />}
 </div>
 <div>
 <h4 className="text-xs font-bold text-brand-primary mb-1.5 uppercase tracking-wide">
 {t.has(task.title_key) ? t(task.title_key) : task.title_key}
 </h4>
 <div className="flex items-center gap-2">
 <div className="h-1.5 w-16 bg-brand-bg-opacity-5 rounded-full overflow-hidden border border-brand-border-opacity-5">
 <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${(task.progress / task.target_count) * 100}%` }} />
 </div>
 <span className="text-[9px] font-bold text-brand-primary opacity-40 uppercase tracking-wider">{task.progress}/{task.target_count}</span>
 </div>
 </div>
 </div>

 {task.completed && !task.claimed ? (
 <motion.button
 whileTap={{ scale: 0.95 }}
 onClick={() => handleClaim(task.task_id)}
 className="px-3.5 py-1.5 rounded-lg bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-widest shadow-sm cursor-pointer"
 >
 Claim
 </motion.button>
 ) : task.claimed ? (
 <span className="text-[9px] font-bold text-brand-primary opacity-20 uppercase tracking-widest">Completed</span>
 ) : (
 <div className="flex flex-col items-end">
 <span className="text-xs font-black text-brand-primary">{task.xp_reward} XP</span>
 <span className="text-[9px] text-brand-primary opacity-30 font-bold uppercase tracking-wide">Reward</span>
 </div>
 )}
 </div>
 </motion.div>
 ))
 )}
 </div>
 </div>

 {/* Referral Card */}
 <div className="w-full glass-panel p-5 rounded-3xl border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden group shadow-sm">
 <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
 <FaUserFriends className="text-6xl text-brand-primary" />
 </div>
 <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight mb-1">Invite Friend to Play</h3>
 <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-widest mb-4 max-w-[75%]">Share your unique link and earn 50 XP per recruit.</p>
 {userCode && (
 <div className="w-full py-2 px-3 mb-3 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 text-[10px] font-mono text-brand-primary opacity-60 truncate">
   {inviteLink}
 </div>
 )}
 <button 
 onClick={handleCopyReferral}
 className="w-full py-3 rounded-xl bg-brand-primary text-brand-void hover:bg-brand-primary-hover transition-all text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer shadow-sm"
 >
 {copied ? "Copied! ✓" : "Copy & Share Invite Link"}
 </button>
 </div>
 </div>
 </LayoutWrapper>
 );
}
