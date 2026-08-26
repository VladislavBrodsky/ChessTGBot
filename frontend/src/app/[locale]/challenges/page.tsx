'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaTrophy, FaFire, FaCheckCircle, FaStar } from "react-icons/fa";
import XPProgressBar from "@/components/XPProgressBar";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramAlert, triggerTaskSuccess } from "@/lib/telegram";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useUser } from "@/context/UserContext";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonList } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getXPProgress } from '@/lib/xpProgress';

export default function ChallengesPage() {
  const t = useTranslations('Gamification');

  // Use global context — no stub defaults, no duplicate fetch
  const { stats, syncStats } = useUser();

  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  useEffect(() => {
    // Only fetch tasks (page-specific) — user stats come from context
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
    if (claimingId) return;
    setClaimingId(taskDefId);
    const task = tasks.find(t => t.task_id === taskDefId);
    const previousTasks = [...tasks];

    // Optimistic instant state transition
    setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));

    if (task) {
      let title = task.title_key;
      try {
        title = t(task.title_key);
      } catch {}
      triggerTaskSuccess(title, task.xp_reward);
    }

    try {
      const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
        method: "POST"
      });
      if (res.ok) {
        syncStats();
      } else {
        // Rollback on non-200
        setTasks(previousTasks);
      }
    } catch (err) {
      console.error("Failed to claim task reward:", err);
      // Rollback on network error
      setTasks(previousTasks);
    } finally {
      setClaimingId(null);
    }
  };

  const handleVerify = async (taskDefId: number, titleKey: string) => {
    if (titleKey === "add_to_home_screen") {
      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      
      const sendVerify = async () => {
        try {
          const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/verify`, {
            method: "POST"
          });
          const data = await res.json();
          if (res.ok && data.completed) {
            setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, completed: true } : t));
            telegramAlert("Home screen verified successfully! You can now claim your reward.");
          } else {
            telegramAlert(data.detail || "Verification failed. Please add the app to your home screen first.");
          }
        } catch (err) {
          console.error("Verification failed", err);
          telegramAlert("Network error during home screen verification.");
        }
      };

      if (!tg) {
        await sendVerify();
        return;
      }

      let verificationTriggered = false;
      const triggerVerify = () => {
        if (!verificationTriggered) {
          verificationTriggered = true;
          sendVerify();
        }
      };

      let callbackFired = false;
      if (tg.checkHomeScreenStatus) {
        tg.checkHomeScreenStatus((status: string) => {
          callbackFired = true;
          if (status === "added") {
            triggerVerify();
          } else {
            if (tg.addToHomeScreen) {
              try {
                tg.addToHomeScreen();
                tg.onEvent("homeScreenAdded", triggerVerify);
                setTimeout(triggerVerify, 3500);
              } catch (e) {
                console.error("Failed to prompt addToHomeScreen", e);
                triggerVerify();
              }
            } else {
              triggerVerify();
            }
          }
        });

        // Watchdog: If Telegram API silently swallows the callback, bypass it.
        setTimeout(() => {
          if (!callbackFired) {
            console.warn("Telegram checkHomeScreenStatus callback timed out. Bypassing.");
            triggerVerify();
          }
        }, 1500);

      } else {
        triggerVerify();
      }
      return;
    }

    const link = titleKey === "join_channel" ? "https://t.me/chess_hub" : "https://t.me/chesshub_chat";
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink(link);
    } else {
      window.open(link, "_blank");
    }

    try {
      const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/verify`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.completed) {
        setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, completed: true } : t));
        telegramAlert("Subscription verified successfully! You can now claim your ELO/XP reward.");
      } else {
        telegramAlert(data.detail || "Verification failed. Please make sure you have joined the channel/group first.");
      }
    } catch (err) {
      console.error("Verification failed", err);
      telegramAlert("Network error during subscription verification.");
    }
  };

  const userXp = stats?.xp ?? 0;
  const xpProgress = getXPProgress(userXp, stats?.level);
  const userLevel = xpProgress.displayedLevel;
  const { nextLevelXp, progressPercentage } = xpProgress;

  return (
    <LayoutWrapper className="w-full pt-[max(0.75rem,var(--app-safe-top))]">
      <main className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-start px-3.5 mx-auto pt-1 space-y-4 pb-[calc(84px+var(--app-safe-bottom))]">

        {/* Level Progress Card — Ultra Premium */}
        <section aria-labelledby="level-heading" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
            className="app-premium-surface w-full relative overflow-hidden rounded-3xl border"
          >
            <div className="relative z-10 p-4 sm:p-5 flex flex-col items-center text-center">
              {/* Level badge */}
              <div className="relative mb-3">
                <div
                  className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)] pointer-events-none"
                />
                {/* Badge outer ring */}
                <div
                  className="relative w-20 h-20 rounded-2xl flex items-center justify-center bg-brand-surface border border-brand-border-opacity-20 shadow-premium"
                >
                  {/* Inner badge */}
                  <div
                    className="w-14 h-14 rounded-xl flex flex-col items-center justify-center bg-brand-surface border border-brand-border-opacity-15 shadow-inner-glow"
                  >
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-muted">LEVEL</span>
                    <motion.span
                      key={userLevel}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="text-2xl font-black leading-none text-brand-primary"
                    >
                      {userLevel}
                    </motion.span>
                  </div>
                </div>
                {/* Floating animated star markers */}
                {[{top:'-6px',right:'-4px'},{bottom:'-4px',left:'-3px'},{top:'4px',left:'-8px'}].map((pos, i) => (
                  <motion.span
                    key={i}
                    animate={{ 
                      y: [0, -4, 0],
                      opacity: [0.5, 1, 0.5],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.7
                    }}
                    className="absolute w-1.5 h-1.5 rounded-full bg-brand-primary/40 shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                    style={{ top: pos.top, right: (pos as any).right, bottom: (pos as any).bottom, left: (pos as any).left }}
                  />
                ))}
              </div>
   
              <h1 id="level-heading" className="text-lg font-black tracking-tighter uppercase mb-0.5 text-brand-primary header-balanced">
                {t('grandmaster_rising')}
              </h1>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
                  {t('next_level', { xp: nextLevelXp })}
                </p>
              </div>
   
              {/* XP Bar — premium with shimmer */}
              <XPProgressBar
                xp={userXp}
                level={stats?.level ?? 1}
                levelLabel={t.has('level') ? t('level') : 'Level'}
                className="max-w-[260px] mb-3"
              />
   
              {/* XP percentage pill */}
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20 shadow-sm">
                {`${Math.round(progressPercentage)}% to next level`}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Stats Row — Ultra Premium */}
        <section aria-labelledby="stats-heading" className="w-full">
          <h2 id="stats-heading" className="sr-only">Player Lifetime Combat Stats</h2>
          <div className="w-full grid grid-cols-2 gap-3">
            {/* Battles stat */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 border border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent shadow-[0_4px_24px_rgba(239,68,68,0.06)]"
            >
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500/80"
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/35 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
              >
                <FaFire className="text-red-500 text-base" />
              </div>
              <div className="flex flex-col min-w-0">
                <motion.span
                  key={stats?.games_played}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-xl font-black leading-none text-brand-primary"
                >
                  {stats?.games_played ?? 0}
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-brand-muted">
                  {t('battles')}
                </span>
              </div>
            </motion.div>
   
            {/* ELO stat */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent shadow-[0_4px_24px_rgba(16,185,129,0.05)]"
            >
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500/80"
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              >
                <FaTrophy className="text-emerald-400 text-base" />
              </div>
              <div className="flex flex-col min-w-0">
                <motion.span
                  key={stats?.elo}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-xl font-black leading-none text-brand-primary"
                >
                  {stats?.elo ?? 1000}
                </motion.span>
                <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 text-brand-muted">
                  {t('elo_rating')}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Referral Dashboard */}
        <section aria-labelledby="referral-heading" className="w-full">
          <h2 id="referral-heading" className="sr-only">Referral & Squad Dashboard</h2>
          <ReferralDashboard referralCode={stats?.referral_code} botUsername={stats?.bot_username} />
        </section>

        {/* Tasks Section */}
        <section aria-labelledby="tasks-heading" className="w-full">
          <h2 id="tasks-heading" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.3em] text-center mb-4">{t('daily_operations')}</h2>
          <div className="space-y-3 w-full">
            {loading ? (
              <SkeletonList count={3} />
            ) : tasks.filter(t => !t.claimed).length === 0 ? (
              <EmptyState
                icon={<FaTrophy className="h-6 w-6 text-brand-muted" />}
                title={t('no_active_missions')}
                description="Check back tomorrow for new daily tasks and missions."
              />
            ) : (
              [...tasks.filter(t => !t.claimed)].sort((a, b) => {
                if (a.completed && !b.completed) return -1;
                if (!a.completed && b.completed) return 1;
                
                const isSubA = ["join_channel", "join_chat", "add_to_home_screen"].includes(a.title_key);
                const isSubB = ["join_channel", "join_chat", "add_to_home_screen"].includes(b.title_key);
                if (isSubA && !isSubB) return -1;
                if (!isSubA && isSubB) return 1;

                if (a.title_key === "daily_login" && b.title_key !== "daily_login") return -1;
                if (a.title_key !== "daily_login" && b.title_key === "daily_login") return 1;
                
                return 0;
              }).map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ scale: 1.01 }}
                  className="w-full"
                >
                  <Card 
                    variant="glass" 
                    className={`p-4 ${task.completed && !task.claimed ? 'border-brand-border-opacity-20 bg-brand-bg-opacity-5' : 'border-brand-border-opacity-10'} transition-all shadow-sm`}
                  >
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm border transition-colors ${
                        task.completed
                          ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                          : 'bg-brand-elevated text-brand-muted border-brand-border-opacity-10'
                      }`}>
                        {task.completed ? <FaCheckCircle /> : <FaStar />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-xs font-bold text-brand-primary mb-0.5 uppercase tracking-wide">
                          {t(task.title_key)}
                        </h4>
                        <p className="text-[10px] text-brand-muted mb-1 leading-snug max-w-[180px]">
                          {t(`${task.title_key}_desc`)}
                        </p>
                        {t.has(`${task.title_key}_inst`) && (
                          <p className="text-[9px] text-blue-500 dark:text-blue-400 font-bold mb-2 leading-snug max-w-[180px]">
                            👉 {t(`${task.title_key}_inst`)}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-16 bg-brand-elevated rounded-full overflow-hidden border border-brand-border-opacity-10">
                            <div
                              className={`h-full transition-all duration-700 rounded-full ${
                                task.progress >= task.target_count
                                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                  : 'bg-gradient-to-r from-brand-primary/60 to-brand-primary/40'
                              }`}
                              style={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }}
                            />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            task.progress >= task.target_count
                              ? 'text-emerald-500'
                              : 'text-brand-muted'
                          }`}>{task.progress}/{task.target_count}</span>
                        </div>
                      </div>
                    </div>

                    {task.completed && !task.claimed ? (
                      <Button
                        variant="action"
                        size="sm"
                        disabled={claimingId === task.task_id}
                        onClick={() => handleClaim(task.task_id)}
                        className="animate-pulse bg-emerald-500 text-brand-void hover:bg-emerald-400 border-none shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      >
                        {claimingId === task.task_id ? '...' : t.has('claim_xp_btn') ? t('claim_xp_btn') : 'Claim XP'}
                      </Button>
                    ) : task.claimed ? (
                      <Badge variant="secondary" className="opacity-40">{t('claimed_status')}</Badge>
                    ) : (task.title_key === "join_channel" || task.title_key === "join_chat" || task.title_key === "add_to_home_screen") ? (
                      <Button
                        variant="action"
                        size="sm"
                        onClick={() => handleVerify(task.task_id, task.title_key)}
                      >
                        {t('verify_btn')}
                      </Button>
                    ) : task.title_key.startsWith("ach_refer_") ? (
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-xs font-black text-brand-primary">{task.xp_reward} XP</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 py-1 h-auto text-[9px] border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-brand-void"
                          onClick={() => {
                            const inviteLink = `https://t.me/${stats?.bot_username}?start=ref_${stats?.referral_code}`;
                            const text = encodeURIComponent(`🏆 Join me on FinChess! Play chess, earn real USDT rewards. ♟️`);
                            const url = encodeURIComponent(inviteLink);
                            window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                          }}
                        >
                           {t.has('invite_friend') ? t('invite_friend') : 'Invite Friend'}
                         </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-brand-primary">{task.xp_reward} XP</span>
                        <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">{t('reward')}</span>
                      </div>
                    )}
                  </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Archive Section */}
        {!loading && tasks.some(t => t.claimed) && (
          <section aria-labelledby="archive-heading" className="w-full mb-12">
            <h2 id="archive-heading" className="sr-only">Archived Completed Operations</h2>
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface/20 text-xs font-black tracking-[0.2em] uppercase text-brand-muted hover:bg-brand-surface/40 hover:text-brand-primary transition-colors cursor-pointer"
            >
              <span>{t.has('completed_missions') ? t('completed_missions') : 'Archive'}</span>
              <span className="text-brand-muted text-[10px]">{showArchive ? '▲' : '▼'} {tasks.filter(t => t.claimed).length}</span>
            </button>

            {showArchive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 space-y-3 overflow-hidden"
              >
                {tasks.filter(t => t.claimed).map(task => (
                  <Card key={task.id} variant="glass" className="p-4 border-brand-border-opacity-5 bg-brand-surface/10 opacity-70">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-brand-primary/10 text-brand-muted border border-brand-border-opacity-5">
                          <FaCheckCircle />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-muted mb-0.5 uppercase tracking-wide line-through">
                            {t(task.title_key)}
                          </h4>
                          <p className="text-[10px] text-brand-muted mb-1 leading-snug">
                            {t(`${task.title_key}_desc`)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="opacity-30">{t('claimed_status')}</Badge>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </section>
        )}
      </main>
    </LayoutWrapper>
  );
}
