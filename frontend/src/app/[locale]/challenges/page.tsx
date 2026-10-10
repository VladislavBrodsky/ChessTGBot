'use client';

import { motion } from "framer-motion";
import { PageHeader, PageUtilities, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaTrophy, FaFire, FaCheckCircle, FaStar } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
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
  const ti = useTranslations('Index');

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
    <LayoutWrapper className="w-full ">
      <main className="w-full app-page flex flex-col items-start mx-auto ">

        <PageHeader title={ti('daily_tasks')} actions={<PageUtilities />} />

        {/* Level Progress */}
        <section aria-labelledby="level-heading" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="ui-hero-card ui-hero-card--gold w-full"
          >
            <div className="relative z-10 p-5 flex flex-col items-start text-start">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-border bg-brand-elevated text-xl font-semibold tabular-nums">{userLevel}</div>
              <h2 id="level-heading" className="text-lg font-semibold tracking-tight mb-0.5 text-brand-primary header-balanced">
                {t('grandmaster_rising')}
              </h2>
              <p className="text-caption font-medium text-brand-muted mb-3">
                {t('next_level', { xp: nextLevelXp })}
              </p>
   
              {/* XP Bar — premium with shimmer */}
              <XPProgressBar
                xp={userXp}
                level={stats?.level ?? 1}
                levelLabel={t.has('level') ? t('level') : 'Level'}
                className="w-full mb-3"
              />
   
              {/* XP percentage pill */}
              <Badge variant="secondary">
                {`${Math.round(progressPercentage)}% to next level`}
              </Badge>
            </div>
          </motion.div>
        </section>

        {/* Stats Row — Ultra Premium */}
        <section aria-labelledby="stats-heading" className="w-full">
          <h2 id="stats-heading" className="sr-only">Player Lifetime Combat Stats</h2>
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="ui-stat flex-row items-center gap-3">
              <span className="ui-icon-tile ui-icon-tile--gold"><FaFire className="text-base" aria-hidden="true" /></span>
              <div className="flex min-w-0 flex-col">
                <span className="ui-stat__value text-xl">{stats ? (stats.games_played ?? 0) : '—'}</span>
                <span className="ui-stat__label">{t('battles')}</span>
              </div>
            </div>
            <div className="ui-stat ui-stat--accent flex-row items-center gap-3">
              <span className="ui-icon-tile ui-icon-tile--success"><FaTrophy className="text-base" aria-hidden="true" /></span>
              <div className="flex min-w-0 flex-col">
                <span className="ui-stat__value text-xl">{stats && Number.isFinite(stats.elo) ? stats.elo : '—'}</span>
                <span className="ui-stat__label">{t('elo_rating')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        <section aria-labelledby="tasks-heading" className="w-full">
          <SectionHeader id="tasks-heading" title={t('daily_operations')} />
          <div className="mt-3 space-y-3 w-full">
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
                    variant="solid" 
                    className={`p-4 transition-colors ${task.completed && !task.claimed ? 'ui-stat--accent' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`ui-icon-tile ${task.completed ? 'ui-icon-tile--success' : ''}`}>
                        {task.completed ? <FaCheckCircle aria-hidden="true" /> : <FaStar aria-hidden="true" />}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-sm font-bold text-brand-primary mb-0.5 normal-case tracking-normal">
                          {t(task.title_key)}
                        </h4>
                        <p className="text-caption text-brand-muted mb-1 leading-snug max-w-[180px]">
                          {t(`${task.title_key}_desc`)}
                        </p>
                        {t.has(`${task.title_key}_inst`) && (
                          <p className="flex items-start gap-1.5 text-caption text-brand-primary font-medium mb-2 leading-snug max-w-[220px]">
                            <FiInfo size={12} className="mt-0.5 shrink-0 text-brand-muted" aria-hidden="true" />
                            <span>{t(`${task.title_key}_inst`)}</span>
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
                          <span className={`text-caption font-bold normal-case tracking-normal ${
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
                        className="shadow-[0_0_18px_var(--color-emerald-opacity-20)]"
                      >
                        {claimingId === task.task_id ? '...' : t('claim_xp_btn')}
                      </Button>
                    ) : task.claimed ? (
                      <Badge variant="secondary">{t('claimed_status')}</Badge>
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
                        <span className="text-sm font-semibold text-brand-primary">{task.xp_reward} XP</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="px-3 py-1 h-auto text-caption border-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-brand-void"
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
                        <span className="text-sm font-semibold text-brand-primary">{task.xp_reward} XP</span>
                        <span className="text-caption text-brand-muted font-bold normal-case tracking-normal">{t('reward')}</span>
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
            <button type="button"
              onClick={() => setShowArchive(!showArchive)}
              aria-expanded={showArchive}
              className="ui-tap-target ui-list-row ui-list-row--interactive w-full text-sm font-semibold text-brand-primary cursor-pointer"
            >
              <span>{t.has('completed_missions') ? t('completed_missions') : 'Archive'}</span>
              <Badge size="counter" variant="secondary">{tasks.filter(t => t.claimed).length}</Badge>
            </button>

            {showArchive && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 space-y-3 overflow-hidden"
              >
                {tasks.filter(t => t.claimed).map(task => (
                  <Card key={task.id} variant="solid" className="p-4">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="ui-icon-tile ui-icon-tile--success"><FaCheckCircle aria-hidden="true" /></span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-brand-muted mb-0.5">
                            {t(task.title_key)}
                          </h4>
                          <p className="text-caption text-brand-muted mb-1 leading-snug">
                            {t(`${task.title_key}_desc`)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">{t('claimed_status')}</Badge>
                    </div>
                  </Card>
                ))}
              </motion.div>
            )}
          </section>
        )}
        {/* Referral Dashboard */}
        <section aria-labelledby="referral-heading" className="w-full">
          <h2 id="referral-heading" className="sr-only">Referral & Squad Dashboard</h2>
          <ReferralDashboard referralCode={stats?.referral_code} botUsername={stats?.bot_username} />
        </section>

      </main>
    </LayoutWrapper>
  );
}
