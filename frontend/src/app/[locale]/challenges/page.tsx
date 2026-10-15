'use client';

import { motion } from "framer-motion";
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaTrophy, FaFire, FaCheckCircle, FaStar } from "react-icons/fa";
import { FiInfo } from "react-icons/fi";
import XPProgressBar from "@/components/XPProgressBar";
import { useState } from "react";
import { GramAmount } from '@/components/ui/GramAmount';
import { useTasks } from '@/hooks/useTasks';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramAlert, triggerTaskSuccess } from "@/lib/telegram";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useUser } from "@/context/UserContext";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { getXPProgress } from '@/lib/xpProgress';
import { FiTarget } from 'react-icons/fi';
import EngagementQuest from '@/components/EngagementQuest';

export default function ChallengesPage() {
  const t = useTranslations('Gamification');
  const ti = useTranslations('Index');
  const tGram = useTranslations('Gram');

  // Use global context — no stub defaults, no duplicate fetch
  const { stats, syncStats, syncBalance } = useUser();

  const { tasks, setTasks, loading, error: tasksError, refresh: refreshTasks } = useTasks();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);

  const handleClaim = async (taskDefId: number) => {
    if (claimingId !== null) return;
    setClaimingId(taskDefId);
    const task = tasks.find(t => t.task_id === taskDefId);
    const previousTasks = [...tasks];

    // Optimistic instant state transition
    setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, claimed: true } : t));

    try {
      const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/claim`, {
        method: "POST"
      });
      if (res.ok) {
    if (task) {
      let title = task.title_key;
      try {
        title = t(task.title_key);
      } catch {}
      triggerTaskSuccess(title, task.xp_reward);
    }

        void Promise.allSettled([syncStats(), syncBalance()]);
      } else {
        // Rollback on non-200
        setTasks(previousTasks);
        telegramAlert(t("claim_failed"));
      }
    } catch (err) {
      console.error("Failed to claim task reward:", err);
      // Rollback on network error
      setTasks(previousTasks);
      telegramAlert(t("claim_failed"));
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
            telegramAlert(t('home_screen_verified'));
          } else {
            telegramAlert(data.detail || t('home_screen_verify_failed'));
          }
        } catch (err) {
          console.error("Verification failed", err);
          telegramAlert(t('home_screen_verify_network_error'));
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

    try {
      const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/verify`, {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.completed) {
        setTasks((prev: any[]) => prev.map(t => t.task_id === taskDefId ? { ...t, completed: true } : t));
        telegramAlert(t('subscription_verified'));
      } else {
        telegramAlert(t(res.status >= 500 ? 'subscription_verify_network_error' : 'subscription_verify_failed'));
      }
    } catch (err) {
      console.error("Verification failed", err);
      telegramAlert(t('subscription_verify_network_error'));
    }
  };

  const userXp = stats?.xp ?? 0;
  const xpProgress = getXPProgress(userXp, stats?.level);
  const userLevel = xpProgress.displayedLevel;
  const { nextLevelXp, progressPercentage } = xpProgress;

  return (
    <LayoutWrapper className="w-full ">
      <main className="w-full app-page flex flex-col items-center mx-auto ">

        <PageHeader title={ti('daily_tasks')} icon={<FiTarget />} />

        {/* Level Progress */}
        <section aria-labelledby="level-heading" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="ui-hero-card ui-hero-card--gold w-full"
          >
            <div className="relative z-10 flex flex-col gap-3 p-4 text-start">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-lg font-semibold tabular-nums">{stats ? userLevel : <Skeleton textRole="numeric" width="2ch" />}</div>
                <div className="min-w-0 flex-1">
                  <h2 id="level-heading" className="t-title-3 text-brand-primary header-balanced">{t('grandmaster_rising')}</h2>
                  <div className="text-caption font-medium text-brand-muted">{stats ? t('next_level', { xp: nextLevelXp }) : <Skeleton textRole="caption" width="16ch" />}</div>
                </div>
                <Badge variant="secondary" className="shrink-0">{stats ? `${Math.round(progressPercentage)}%` : '—'}</Badge>
              </div>
              {stats ? <XPProgressBar
                xp={userXp}
                level={stats?.level ?? 1}
                levelLabel={ti('level')}
                className="w-full"
              /> : <div className="space-y-2"><Skeleton textRole="caption" width="35%" /><Skeleton variant="rectangular" height={8} width="100%" /></div>}
            </div>
          </motion.div>
        </section>

        {/* Grand Mystery Box Engagement Quest */}
        <div className="w-full my-3">
          <EngagementQuest />
        </div>

        {/* Stats Row — Ultra Premium */}
        <section aria-labelledby="stats-heading" className="w-full">
          <h2 id="stats-heading" className="sr-only">{t('lifetime_stats')}</h2>
          <div className="w-full grid grid-cols-2 gap-2">
            <div className="ui-stat flex-row items-center gap-3">
              <span className="ui-icon-tile ui-icon-tile--gold"><FaFire className="text-base" aria-hidden="true" /></span>
              <div className="flex min-w-0 flex-col">
                <span className="ui-stat__value">{stats ? (stats.games_played ?? 0) : '—'}</span>
                <span className="ui-stat__label truncate">{t('battles')}</span>
              </div>
            </div>
            <div className="ui-stat ui-stat--accent flex-row items-center gap-3">
              <span className="ui-icon-tile ui-icon-tile--success"><FaTrophy className="text-base" aria-hidden="true" /></span>
              <div className="flex min-w-0 flex-col">
                <span className="ui-stat__value">{stats && Number.isFinite(stats.elo) ? stats.elo : '—'}</span>
                <span className="ui-stat__label truncate">{t('elo_rating')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        <section aria-labelledby="tasks-heading" className="w-full">
          <SectionHeader id="tasks-heading" title={t('daily_operations')} />
          <div className="mt-2 space-y-2 w-full">
            {loading ? (
              <div role="status" aria-busy="true" aria-label={t('loading_missions')} className="space-y-2">
                {[0, 1, 2].map(index => <Card key={index} variant="solid" className="w-full p-3" aria-hidden="true">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <Skeleton variant="rectangular" className="size-tile-md shrink-0 rounded-tile" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <Skeleton textRole="body" width="65%" />
                      <Skeleton textRole="caption" width="100%" />
                      <Skeleton textRole="caption" width="80%" />
                      <Skeleton textRole="caption" width="40%" className="mt-1" />
                    </div>
                    <Skeleton variant="rectangular" width="7rem" height="var(--size-control-sm)" className="col-start-2 rounded-control sm:col-start-3 sm:row-start-1 sm:self-center" />
                  </div>
                </Card>)}
              </div>
            ) : tasksError && tasks.length === 0 ? (
              <ErrorState title={ti('load_failed')} onRetry={() => { void refreshTasks(); }} retryLabel={ti('retry')} />
            ) : tasks.filter(t => !t.claimed).length === 0 ? (
              <EmptyState
                icon={<FaTrophy className="h-6 w-6 text-brand-muted" />}
                title={t('no_active_missions')}
                description={t('new_tasks_tomorrow')}
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
                <Card
                  key={task.id}
                  variant="solid"
                  className={`w-full p-3 transition-colors ${task.completed && !task.claimed ? 'ui-stat--accent' : ''}`}
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                    <span className={`ui-icon-tile ${task.completed ? 'ui-icon-tile--success' : ''}`}>
                      {task.completed ? <FaCheckCircle aria-hidden="true" /> : <FaStar aria-hidden="true" />}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <h3 className="text-sm font-bold text-brand-primary normal-case tracking-normal">{t(task.title_key)}</h3>
                      <p className="text-caption text-brand-muted leading-snug">{t(`${task.title_key}_desc`)}</p>
                      {task.gram_reward_nano && task.gram_reward_nano !== "0" && <GramAmount plus nano={task.gram_reward_nano} className="t-caption text-brand-action" />}
                      {t.has(`${task.title_key}_inst`) && !task.completed && (
                        <p className="flex items-start gap-1.5 text-caption font-medium leading-snug text-brand-primary">
                          <FiInfo size={12} className="mt-0.5 shrink-0 text-brand-muted" aria-hidden="true" />
                          <span>{t(`${task.title_key}_inst`)}</span>
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 w-full max-w-24 overflow-hidden rounded-full border border-brand-border-opacity-10 bg-brand-elevated">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              task.progress >= task.target_count
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                : 'bg-gradient-to-r from-brand-primary/60 to-brand-primary/40'
                            }`}
                            style={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-caption font-bold normal-case tracking-normal tabular-nums ${task.progress >= task.target_count ? 'text-emerald-500' : 'text-brand-muted'}`}>{task.progress}/{task.target_count}</span>
                      </div>
                    </div>

                    <div className="col-start-2 sm:col-start-3 sm:row-start-1 sm:self-center">
                    {task.completed && !task.claimed ? (
                      <Button
                        variant="action"
                        size="sm"
                        disabled={claimingId !== null}
                        onClick={() => handleClaim(task.task_id)}
                        className="shrink-0 whitespace-nowrap px-3"
                      >
                        {claimingId === task.task_id ? '...' : t('claim_reward')}
                      </Button>
                    ) : task.claimed ? (
                      <Badge variant="secondary" className="shrink-0">{t('claimed_status')}</Badge>
                    ) : (task.title_key === "join_channel" || task.title_key === "join_chat" || task.title_key === "add_to_home_screen") ? (
                      <div className="flex flex-wrap gap-2">
                      {task.title_key !== "add_to_home_screen" && <Button variant="secondary" size="sm" onClick={() => {
                        const link = task.title_key === "join_channel" ? "https://t.me/chess_hub" : "https://t.me/chesshub_chat";
                        const host = (window as any).Telegram?.WebApp;
                        if (host?.openTelegramLink) host.openTelegramLink(link); else window.open(link, "_blank", "noopener,noreferrer");
                      }}>{tGram("join_button")}</Button>}
                      <Button
                        variant="action"
                        size="sm"
                        className="shrink-0 whitespace-nowrap px-3"
                        onClick={() => handleVerify(task.task_id, task.title_key)}
                      >
                        {t('verify_btn')}
                      </Button>
                      </div>
                    ) : task.title_key.startsWith("ach_refer_") ? (
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-semibold tabular-nums text-brand-primary">{task.xp_reward} XP</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap px-3 text-caption"
                          onClick={() => {
                            const inviteLink = `https://t.me/${stats?.bot_username}?start=ref_${stats?.referral_code}`;
                            const text = encodeURIComponent('♟️ Play chess with me on Web3Chess. 18+ — USDT matches carry risk.');
                            const url = encodeURIComponent(inviteLink);
                            window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
                          }}
                        >
                          {t.has('invite_friend') ? t('invite_friend') : 'Invite Friend'}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex shrink-0 flex-col items-end">
                        <span className="text-sm font-semibold tabular-nums text-brand-primary">{task.xp_reward} XP</span>
                        <span className="text-caption font-bold normal-case tracking-normal text-brand-muted">{t('reward')}</span>
                      </div>
                    )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Archive Section */}
        {!loading && tasks.some(t => t.claimed) && (
          <section aria-labelledby="archive-heading" className="w-full">
            <h2 id="archive-heading" className="sr-only">{t('completed_archive')}</h2>
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
                className="mt-2 space-y-2 overflow-hidden"
              >
                {tasks.filter(t => t.claimed).map(task => (
                  <Card key={task.id} variant="solid" className="p-3">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="ui-icon-tile ui-icon-tile--success"><FaCheckCircle aria-hidden="true" /></span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-brand-muted mb-0.5">
                            {t(task.title_key)}
                          </h3>
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
          <h2 id="referral-heading" className="sr-only">{t('referral_dashboard')}</h2>
          <ReferralDashboard referralCode={stats?.referral_code} botUsername={stats?.bot_username} />
        </section>

      </main>
    </LayoutWrapper>
  );
}
