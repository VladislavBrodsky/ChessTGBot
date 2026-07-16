'use client';

import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaTrophy, FaFire, FaCheckCircle, FaStar, FaCrown } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramAlert, triggerTaskSuccess } from "@/lib/telegram";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useUser } from "@/context/UserContext";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getXPProgress, XP_PER_LEVEL } from '@/lib/xpProgress';

export default function ChallengesPage() {
  const locale = useLocale();
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
    try {
      const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
        method: "POST"
      });
      if (res.ok) {
        // Update local task state
        setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));
        // Refresh context so XP/level everywhere reflects the claim
        syncStats();

        if (task) {
          let title = task.title_key;
          try {
            title = t(task.title_key);
          } catch {}
          triggerTaskSuccess(title, task.xp_reward);
        }
      }
    } catch (err) {
      console.error("Failed to claim task reward:", err);
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
  const { currentLevelProgress, nextLevelXp, progressPercentage, isLevelSecured: levelSecured } = xpProgress;

  return (
    <LayoutWrapper className="justify-start pt-8 pb-32">
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-start px-4 mx-auto">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-8">
          <Link href={`/${locale}/home`} className="html-back-button">
            <motion.button
              whileHover={{ x: -2 }}
              className="text-brand-primary opacity-40 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
            >
              <FaArrowLeft className="text-[10px]" />
              <span>{t('return') || 'Return'}</span>
            </motion.button>
          </Link>
        </div>

        {/* Level Progress Card — Ultra Premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          whileHover={{ scale: 1.01 }}
          className="w-full relative overflow-hidden rounded-3xl mb-8 border border-brand-border-opacity-10 bg-brand-surface/40 dark:bg-brand-surface/20 shadow-premium"
        >
          {/* Static ambient accents keep this card calm and inexpensive to render. */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-amber-500 blur-3xl pointer-events-none"
          />
          <div
            className="absolute -bottom-10 -left-8 w-32 h-32 rounded-full bg-amber-500 blur-3xl pointer-events-none"
          />
 
          <div className="relative z-10 p-6 flex flex-col items-center text-center">
            {/* Level badge */}
            <div className="relative mb-5">
              <div
                className="absolute inset-0 rounded-2xl bg-amber-500/10 pointer-events-none"
                style={{ filter: 'blur(8px)' }}
              />
              {/* Badge outer ring */}
              <div
                className="relative w-24 h-24 rounded-2xl flex items-center justify-center bg-brand-surface border border-brand-border-opacity-20 shadow-premium"
              >
                {/* Inner badge */}
                <div
                  className="w-16 h-16 rounded-xl flex flex-col items-center justify-center bg-brand-surface border border-brand-border-opacity-15 shadow-inner-glow"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 text-brand-primary">LEVEL</span>
                  <motion.span
                    key={userLevel}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="text-3xl font-black leading-none text-brand-primary"
                  >
                    {userLevel}
                  </motion.span>
                </div>
              </div>
              {/* Quiet star markers */}
              {[{top:'-8px',right:'-6px'},{bottom:'-6px',left:'-4px'},{top:'4px',left:'-10px'}].map((pos, i) => (
                <span
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-amber-400"
                  style={{ top: pos.top, right: (pos as any).right, bottom: (pos as any).bottom, left: (pos as any).left }}
                />
              ))}
            </div>
 
            <h1 className="text-xl font-black tracking-tighter uppercase mb-1 text-brand-primary">
              {t('grandmaster_rising')}
            </h1>
            <div className="flex items-center gap-2 mb-6">
              {levelSecured && <FaCrown className="text-slate-200 drop-shadow-[0_0_8px_rgba(226,232,240,0.5)]" size={11} />}
              <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${levelSecured ? 'text-slate-200/75' : 'opacity-40 text-brand-primary'}`}>
                {levelSecured ? 'Level secured · build toward your next crown' : t('next_level', { xp: nextLevelXp })}
              </p>
            </div>
 
            {/* XP Bar — premium with shimmer */}
            <div className="w-full max-w-[260px] mb-3">
              <div
                className={`relative h-3.5 rounded-full overflow-hidden border ${levelSecured ? 'bg-slate-950/70 border-slate-200/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.55),0_0_20px_rgba(226,232,240,0.08)]' : 'bg-brand-void/50 border-brand-border-opacity-10'}`}
              >
                {levelSecured && <div aria-hidden="true" className="absolute inset-[2px] rounded-full border border-white/10 pointer-events-none" />}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1.8, ease: "circOut", delay: 0.3 }}
                  className={`absolute top-0 left-0 h-full rounded-full overflow-hidden ${levelSecured ? 'bg-[linear-gradient(90deg,#64748b_0%,#e2e8f0_28%,#ffffff_50%,#cbd5e1_70%,#64748b_100%)] shadow-[0_0_18px_rgba(226,232,240,0.5)]' : 'bg-gradient-to-r from-amber-700 via-yellow-400 to-amber-500 shadow-[0_0_16px_rgba(250,204,21,0.52)]'}`}
                >
                  <motion.div
                    aria-hidden="true"
                    animate={{ x: ['-120%', '320%'] }}
                    transition={{ duration: levelSecured ? 3.6 : 2.5, repeat: Infinity, ease: 'linear', delay: 1.2 }}
                    className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/65 to-transparent -skew-x-12"
                  />
                </motion.div>
                {/* Shimmer sweep */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: levelSecured ? 3.6 : 2.5, repeat: Infinity, ease: 'linear', delay: 1.8 }}
                  className="absolute top-0 left-0 h-full w-1/3 pointer-events-none"
                  style={{ background: levelSecured ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)' : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${levelSecured ? 'text-slate-200/75' : 'opacity-50 text-brand-primary'}`}>
                  {levelSecured ? 'Level secured' : `${currentLevelProgress} / ${XP_PER_LEVEL} XP`}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${levelSecured ? 'text-slate-300/45' : 'opacity-30 text-brand-primary'}`}>
                  {levelSecured ? `Level ${userLevel}` : `${nextLevelXp} XP`}
                </span>
              </div>
            </div>
 
            {/* XP percentage pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${levelSecured ? 'bg-slate-100/10 text-slate-100 border-slate-200/25 shadow-[0_0_16px_rgba(226,232,240,0.12)]' : 'bg-yellow-400/10 text-yellow-200 border-yellow-300/20 shadow-[0_0_16px_rgba(250,204,21,0.1)]'}`}
            >
              {levelSecured && <FaCheckCircle size={10} />}
              {levelSecured ? 'Level secured' : `${Math.round(progressPercentage)}% to next level`}
            </div>
          </div>
        </motion.div>

        {/* Stats Row — Ultra Premium */}
        <div className="w-full grid grid-cols-2 gap-3 mb-8">
          {/* Battles stat */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 border border-red-500/20 bg-gradient-to-br from-red-500/10 to-brand-surface/30 shadow-[0_4px_24px_rgba(239,68,68,0.06)]"
          >
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-red-500/80"
            />
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-red-500/20 to-red-500/5 border border-red-500/35 shadow-[0_0_12px_rgba(239,68,68,0.15)]"
            >
              <FaFire style={{ color: 'rgba(255,120,80,1)', fontSize: 16 }} />
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
              <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-50 text-brand-primary">
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
            className="relative overflow-hidden rounded-2xl p-4 flex items-center gap-3 border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-brand-surface/30 shadow-[0_4px_24px_rgba(245,158,11,0.05)]"
          >
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500/80"
            />
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
            >
              <FaTrophy style={{ color: 'rgba(255,210,60,1)', fontSize: 15 }} />
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
              <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-50 text-brand-primary">
                {t('elo_rating')}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Referral Dashboard */}
        <div className="w-full mb-6">
          <ReferralDashboard referralCode={stats?.referral_code} botUsername={stats?.bot_username} />
        </div>

        {/* Tasks Section */}
        <div className="w-full mb-8">
          <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center mb-4">{t('daily_operations')}</h3>
          <div className="space-y-3 w-full">
            {loading ? (
              <div className="w-full flex flex-col space-y-3">
                {[1, 2, 3].map((n) => (
                  <Card key={n} variant="glass" className="p-4 border-brand-border-opacity-10 animate-pulse flex items-center justify-between">
                    <div className="flex items-center gap-4 w-2/3">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary opacity-10 shrink-0" />
                      <div className="flex flex-col space-y-1.5 w-full">
                        <div className="h-2.5 bg-brand-primary opacity-10 rounded w-1/2" />
                        <div className="h-1.5 bg-brand-primary opacity-5 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="w-16 h-1.5 bg-brand-primary opacity-5 rounded-full" />
                  </Card>
                ))}
              </div>
            ) : tasks.filter(t => !t.claimed).length === 0 ? (
              <div className="text-center py-4 text-xs font-bold text-brand-primary opacity-30 uppercase tracking-widest">
                {t('no_active_missions')}
              </div>
            ) : (
              tasks.filter(t => !t.claimed).map((task) => (
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
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${task.completed ? 'bg-brand-primary text-brand-void' : 'bg-brand-bg-opacity-5 text-brand-primary opacity-40 border border-brand-border-opacity-10'}`}>
                        {task.completed ? <FaCheckCircle /> : <FaStar />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-primary mb-0.5 uppercase tracking-wide">
                          {t(task.title_key)}
                        </h4>
                        <p className="text-[10px] text-brand-primary opacity-50 mb-1 leading-snug max-w-[180px]">
                          {t(`${task.title_key}_desc`)}
                        </p>
                        {t.has(`${task.title_key}_inst`) && (
                          <p className="text-[9px] text-amber-500/90 font-bold mb-2 leading-snug max-w-[180px] drop-shadow-glow">
                            👉 {t(`${task.title_key}_inst`)}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-brand-bg-opacity-5 rounded-full overflow-hidden border border-brand-border-opacity-5">
                            <div className={`h-full transition-all duration-500 ${task.progress >= task.target_count ? 'bg-emerald-500' : 'bg-brand-primary'}`} style={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${task.progress >= task.target_count ? 'text-emerald-500 opacity-80' : 'text-brand-primary opacity-40'}`}>{task.progress}/{task.target_count}</span>
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
                        {claimingId === task.task_id ? '...' : `Claim XP`}
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
                          Invite Friend
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-black text-brand-primary">{task.xp_reward} XP</span>
                        <span className="text-[10px] text-brand-primary opacity-30 font-bold uppercase tracking-wide">{t('reward')}</span>
                      </div>
                    )}
                  </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Archive Section */}
        {!loading && tasks.some(t => t.claimed) && (
          <div className="w-full mb-12">
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface/20 text-xs font-black tracking-[0.2em] uppercase text-brand-primary/60 hover:bg-brand-surface/40 transition-colors"
            >
              <span>{t('completed_missions') || 'Archive'}</span>
              <span className="text-brand-primary/40">{showArchive ? '▲' : '▼'}</span>
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
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm bg-brand-primary/10 text-brand-primary/40 border border-brand-border-opacity-5">
                          <FaCheckCircle />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-primary/70 mb-0.5 uppercase tracking-wide line-through">
                            {t(task.title_key)}
                          </h4>
                          <p className="text-[10px] text-brand-primary/40 mb-1 leading-snug">
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
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}
