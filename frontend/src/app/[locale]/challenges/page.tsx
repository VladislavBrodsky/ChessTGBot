'use client';

import { motion } from "framer-motion";
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import {
  FaTrophy,
  FaFire,
  FaCheckCircle,
  FaStar,
  FaGamepad,
  FaUsers,
  FaAward,
  FaCrown,
  FaChessKnight,
  FaShieldAlt,
  FaTelegramPlane,
  FaMobileAlt,
  FaUserPlus,
  FaCalendarCheck,
} from "react-icons/fa";
import { FiTarget } from "react-icons/fi";
import XPProgressBar from "@/components/XPProgressBar";
import { useState, useMemo } from "react";
import Link from 'next/link';
import { GramAmount } from '@/components/ui/GramAmount';
import { useTasks } from '@/hooks/useTasks';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTranslations, useLocale } from "next-intl";
import { apiFetch } from "@/lib/api";
import { telegramAlert, triggerTaskSuccess, telegramHaptic } from "@/lib/telegram";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useUser } from "@/context/UserContext";
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MetaLine } from '@/components/ui/MetaLine';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, type TabOption } from '@/components/ui/Tabs';
import { getXPProgress } from '@/lib/xpProgress';
import EngagementQuest from '@/components/EngagementQuest';
import { mainMiniAppLink, shareInvitation } from '@/lib/invitations';

type TaskCategory = 'all' | 'daily' | 'milestones' | 'social';

function isDailyTask(task: { is_daily?: boolean; title_key: string }): boolean {
  return Boolean(task.is_daily) || task.title_key.startsWith('daily_');
}

function isSocialTask(task: { title_key: string }): boolean {
  return (
    task.title_key.startsWith('join_') ||
    task.title_key === 'add_to_home_screen' ||
    task.title_key.startsWith('ach_refer_')
  );
}

function getTaskCategory(task: { is_daily?: boolean; title_key: string }): 'daily' | 'milestones' | 'social' {
  if (isDailyTask(task)) return 'daily';
  if (isSocialTask(task)) return 'social';
  return 'milestones';
}

function getTaskIcon(titleKey: string, completed: boolean) {
  if (completed) return <FaCheckCircle aria-hidden="true" />;
  if (titleKey === 'daily_login') return <FaCalendarCheck aria-hidden="true" />;
  if (titleKey === 'daily_play' || titleKey === 'daily_play_5') return <FaGamepad aria-hidden="true" />;
  if (titleKey === 'daily_play_human' || titleKey === 'daily_play_human_2') return <FaUsers aria-hidden="true" />;
  if (titleKey === 'daily_win' || titleKey === 'daily_win_2') return <FaTrophy aria-hidden="true" />;
  if (titleKey === 'ach_first_win') return <FaAward aria-hidden="true" />;
  if (titleKey.startsWith('ach_win_')) return <FaCrown aria-hidden="true" />;
  if (
    titleKey === 'ach_play_1' ||
    titleKey === 'ach_play_3' ||
    titleKey === 'ach_play_5' ||
    titleKey === 'ach_play_25'
  ) {
    return <FaChessKnight aria-hidden="true" />;
  }
  if (titleKey === 'ach_play_50' || titleKey === 'ach_play_100') {
    return <FaShieldAlt aria-hidden="true" />;
  }
  if (titleKey === 'ach_play_200' || titleKey === 'ach_play_300') {
    return <FaStar aria-hidden="true" />;
  }
  if (titleKey === 'join_channel' || titleKey === 'join_chat') {
    return <FaTelegramPlane aria-hidden="true" />;
  }
  if (titleKey === 'add_to_home_screen') return <FaMobileAlt aria-hidden="true" />;
  if (titleKey.startsWith('ach_refer_')) return <FaUserPlus aria-hidden="true" />;
  return <FaStar aria-hidden="true" />;
}

export default function ChallengesPage() {
  const t = useTranslations('Gamification');
  const ti = useTranslations('Index');
  const inviteText = useTranslations('Invitations');
  const tGram = useTranslations('Gram');
  const locale = useLocale();

  // Use global context — no stub defaults, no duplicate fetch
  const { stats, syncStats, syncBalance } = useUser();

  const { tasks, setTasks, loading, error: tasksError, refresh: refreshTasks } = useTasks();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [showArchive, setShowArchive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TaskCategory>('all');

  const handleClaim = async (taskDefId: number) => {
    if (claimingId !== null) return;
    setClaimingId(taskDefId);
    telegramHaptic('success');
    const task = tasks.find((t) => t.task_id === taskDefId);
    const previousTasks = [...tasks];

    // Optimistic instant state transition
    setTasks((prev: any[]) => prev.map((t) => (t.task_id === taskDefId ? { ...t, claimed: true } : t)));

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
    telegramHaptic('medium');
    if (titleKey === "add_to_home_screen") {
      const tg = typeof window !== "undefined" ? (window as any).Telegram?.WebApp : null;
      
      const sendVerify = async () => {
        try {
          const res = await apiFetch(`/api/v1/gamification/tasks/${taskDefId}/verify`, {
            method: "POST"
          });
          const data = await res.json();
          if (res.ok && data.completed) {
            setTasks((prev: any[]) => prev.map((t) => (t.task_id === taskDefId ? { ...t, completed: true } : t)));
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
        setTasks((prev: any[]) => prev.map((t) => (t.task_id === taskDefId ? { ...t, completed: true } : t)));
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

  // Categorize active (unclaimed) tasks
  const { dailyTasks, milestoneTasks, socialTasks } = useMemo(() => {
    const uncompletedDaily: any[] = [];
    const uncompletedMilestones: any[] = [];
    const uncompletedSocial: any[] = [];

    const activeTasks = tasks.filter((t) => !t.claimed);

    for (const task of activeTasks) {
      const cat = getTaskCategory(task);
      if (cat === 'daily') uncompletedDaily.push(task);
      else if (cat === 'milestones') uncompletedMilestones.push(task);
      else uncompletedSocial.push(task);
    }

    const sortCategory = (arr: any[], isMilestone = false) =>
      arr.sort((a, b) => {
        // Claimable first
        if (a.completed && !b.completed) return -1;
        if (!a.completed && b.completed) return 1;

        if (isMilestone) {
          return (a.target_count || 0) - (b.target_count || 0);
        }

        // Daily login always first among daily tasks
        if (a.title_key === "daily_login" && b.title_key !== "daily_login") return -1;
        if (a.title_key !== "daily_login" && b.title_key === "daily_login") return 1;

        // Channel/Chat before refer
        const isSubA = ["join_channel", "join_chat", "add_to_home_screen"].includes(a.title_key);
        const isSubB = ["join_channel", "join_chat", "add_to_home_screen"].includes(b.title_key);
        if (isSubA && !isSubB) return -1;
        if (!isSubA && isSubB) return 1;

        return (a.target_count || 0) - (b.target_count || 0);
      });

    return {
      dailyTasks: sortCategory(uncompletedDaily, false),
      milestoneTasks: sortCategory(uncompletedMilestones, true),
      socialTasks: sortCategory(uncompletedSocial, false),
    };
  }, [tasks]);

  const dailyClaimable = dailyTasks.filter((t) => t.completed && !t.claimed).length;
  const milestonesClaimable = milestoneTasks.filter((t) => t.completed && !t.claimed).length;
  const socialClaimable = socialTasks.filter((t) => t.completed && !t.claimed).length;
  const totalClaimable = dailyClaimable + milestonesClaimable + socialClaimable;

  const tabOptions: TabOption<TaskCategory>[] = [
    { id: 'all', label: t('tab_all'), badge: totalClaimable > 0 ? totalClaimable : undefined },
    { id: 'daily', label: t('tab_daily'), badge: dailyClaimable > 0 ? dailyClaimable : undefined },
    { id: 'milestones', label: t('tab_milestones'), badge: milestonesClaimable > 0 ? milestonesClaimable : undefined },
    { id: 'social', label: t('tab_community'), badge: socialClaimable > 0 ? socialClaimable : undefined },
  ];

  const renderTaskCard = (task: any) => {
    const isReadyToClaim = task.completed && !task.claimed;
    const isDaily = isDailyTask(task);
    const isSocial = isSocialTask(task);
    const isPlayOrWin = !isSocial && task.title_key !== 'daily_login';

    return (
      <Card
        key={task.id}
        variant="solid"
        className={`w-full p-3 sm:p-3.5 transition-colors ${isReadyToClaim ? 'ui-stat--accent' : ''}`}
      >
        <div className="flex items-center justify-between gap-3 w-full">
          {/* Leading Icon & Text Details */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`ui-icon-tile shrink-0 ${task.completed ? 'ui-icon-tile--success' : ''}`}>
              {getTaskIcon(task.title_key, task.completed)}
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-brand-primary truncate">{t(task.title_key)}</h3>
                {isDaily && (
                  <Badge variant="secondary" size="counter" className="text-caption font-semibold">
                    {t('tab_daily')}
                  </Badge>
                )}
              </div>

              <p className="text-caption text-brand-muted line-clamp-1 leading-snug">
                {t(`${task.title_key}_desc`)}
              </p>

              <MetaLine className="text-caption font-medium tabular-nums text-brand-muted">
                <span className="text-brand-gold-ink">+{task.xp_reward} XP</span>
                {task.gram_reward_nano && task.gram_reward_nano !== "0" && (
                  <GramAmount plus nano={task.gram_reward_nano} className="text-brand-action" />
                )}
              </MetaLine>

              {/* Progress bar and numeric fraction */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-1.5 flex-1 max-w-36 overflow-hidden rounded-full border border-brand-border-opacity-10 bg-brand-elevated">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      task.progress >= task.target_count
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : 'bg-brand-border'
                    }`}
                    style={{ width: `${Math.min(100, (task.progress / task.target_count) * 100)}%` }}
                  />
                </div>
                <span className={`text-caption font-bold tabular-nums shrink-0 ${task.progress >= task.target_count ? 'text-emerald-500' : 'text-brand-muted'}`}>
                  {task.progress}/{task.target_count}
                </span>
              </div>
            </div>
          </div>

          {/* Trailing Action: Always vertically centered, never wrapped into a bottom row */}
          <div className="shrink-0 flex items-center justify-end">
            {isReadyToClaim ? (
              <Button
                variant="action"
                size="sm"
                disabled={claimingId !== null}
                onClick={() => handleClaim(task.task_id)}
                className="whitespace-nowrap px-3 text-sm font-semibold"
              >
                {claimingId === task.task_id ? '...' : t('claim')}
              </Button>
            ) : task.claimed ? (
              <Badge variant="secondary" className="shrink-0">{t('claimed_status')}</Badge>
            ) : (task.title_key === "join_channel" || task.title_key === "join_chat") ? (
              <Button
                variant="secondary"
                size="sm"
                className="whitespace-nowrap px-3 text-caption font-semibold"
                onClick={() => {
                  const link = task.title_key === "join_channel" ? "https://t.me/chess_hub" : "https://t.me/chesshub_chat";
                  const host = (window as any).Telegram?.WebApp;
                  if (host?.openTelegramLink) host.openTelegramLink(link); else window.open(link, "_blank", "noopener,noreferrer");
                }}
              >
                {tGram("join_button")}
              </Button>
            ) : task.title_key === "add_to_home_screen" ? (
              <Button
                variant="action"
                size="sm"
                className="whitespace-nowrap px-3 text-caption font-semibold"
                onClick={() => handleVerify(task.task_id, task.title_key)}
              >
                {t('verify_btn')}
              </Button>
            ) : task.title_key.startsWith("ach_refer_") ? (
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap px-3 text-caption font-semibold"
                onClick={() => {
                  if (!stats?.referral_code || !/^[A-Za-z0-9_-]{1,60}$/.test(stats.referral_code)) return;
                  const inviteLink = mainMiniAppLink(stats.bot_username || 'chess_matbot', `ref_${stats.referral_code}`);
                  shareInvitation(inviteLink, inviteText('share_text'));
                }}
              >
                {t('invite_friend')}
              </Button>
            ) : isPlayOrWin ? (
              <Link href={`/${locale}/game`} className="inline-flex">
                <Button
                  variant="secondary"
                  size="sm"
                  className="whitespace-nowrap px-3 text-caption font-semibold"
                  onClick={() => telegramHaptic('selection')}
                >
                  {t('play_now')}
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>
    );
  };

  const showDaily = activeTab === 'all' || activeTab === 'daily';
  const showMilestones = activeTab === 'all' || activeTab === 'milestones';
  const showSocial = activeTab === 'all' || activeTab === 'social';

  const visibleTasksCount =
    (showDaily ? dailyTasks.length : 0) +
    (showMilestones ? milestoneTasks.length : 0) +
    (showSocial ? socialTasks.length : 0);

  return (
    <LayoutWrapper className="w-full">
      <main className="w-full app-page flex flex-col items-center mx-auto space-y-4 pb-28">

        <PageHeader title={ti('daily_tasks')} icon={<FiTarget />} />

        {/* Level Progress Hero Card */}
        <section aria-labelledby="level-heading" className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="ui-hero-card ui-hero-card--gold w-full"
          >
            <div className="relative z-10 flex flex-col gap-3 p-4 text-start">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-border bg-brand-elevated text-lg font-semibold tabular-nums">
                  {stats ? userLevel : <Skeleton textRole="numeric" width="2ch" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 id="level-heading" className="t-title-3 text-brand-primary header-balanced">{t('grandmaster_rising')}</h2>
                  <div className="text-caption font-medium text-brand-muted">
                    {stats ? t('next_level', { xp: nextLevelXp }) : <Skeleton textRole="caption" width="16ch" />}
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">{stats ? `${Math.round(progressPercentage)}%` : '—'}</Badge>
              </div>
              {stats ? (
                <XPProgressBar
                  xp={userXp}
                  level={stats?.level ?? 1}
                  levelLabel={ti('level')}
                  className="w-full"
                />
              ) : (
                <div className="space-y-2">
                  <Skeleton textRole="caption" width="35%" />
                  <Skeleton variant="rectangular" height={8} width="100%" />
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Grand Mystery Box Engagement Quest */}
        <div className="w-full empty:hidden">
          <EngagementQuest />
        </div>

        {/* Stats Row */}
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

        {/* Category Tabs: Evenly distributed with zero horizontal clipping */}
        <div className="w-full">
          <Tabs
            tabs={tabOptions}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
            className="w-full flex"
            tabClassName="flex-1 min-w-0 px-1 sm:px-3 text-xs sm:text-sm"
            aria-label={ti('daily_tasks')}
          />
        </div>

        {/* Tasks Content */}
        <section aria-labelledby="tasks-heading" className="w-full space-y-4">
          <h2 id="tasks-heading" className="sr-only">{t('daily_operations')}</h2>

          {loading ? (
            <div role="status" aria-busy="true" aria-label={t('loading_missions')} className="space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <Card key={index} variant="solid" className="w-full p-3.5" aria-hidden="true">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="rectangular" className="size-tile-md shrink-0 rounded-tile" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Skeleton textRole="body" width="55%" />
                      <Skeleton textRole="caption" width="90%" />
                      <Skeleton textRole="caption" width="40%" />
                    </div>
                    <Skeleton variant="rectangular" width="5rem" height="var(--size-control-sm)" className="shrink-0 rounded-control" />
                  </div>
                </Card>
              ))}
            </div>
          ) : tasksError && tasks.length === 0 ? (
            <ErrorState title={ti('load_failed')} onRetry={() => { void refreshTasks(); }} retryLabel={ti('retry')} />
          ) : visibleTasksCount === 0 ? (
            <EmptyState
              icon={<FaTrophy className="h-6 w-6 text-brand-muted" />}
              title={t('no_active_missions')}
              description={t('new_tasks_tomorrow')}
            />
          ) : (
            <div className="space-y-5 w-full">
              {/* Daily Operations Group */}
              {showDaily && dailyTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <SectionHeader title={t('daily_operations')} />
                    <span className="text-caption font-medium text-brand-muted">{t('daily_reset_notice')}</span>
                  </div>
                  <div className="space-y-2">
                    {dailyTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}

              {/* Lifetime Milestones Group */}
              {showMilestones && milestoneTasks.length > 0 && (
                <div className="space-y-2">
                  <SectionHeader title={t('milestones_title')} />
                  <div className="space-y-2">
                    {milestoneTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}

              {/* Community Quests Group */}
              {showSocial && socialTasks.length > 0 && (
                <div className="space-y-2">
                  <SectionHeader title={t('community_title')} />
                  <div className="space-y-2">
                    {socialTasks.map(renderTaskCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Claimed Archive Section */}
        {!loading && tasks.some((t) => t.claimed) && (
          <section aria-labelledby="archive-heading" className="w-full">
            <h2 id="archive-heading" className="sr-only">{t('completed_archive')}</h2>
            <button
              type="button"
              onClick={() => {
                telegramHaptic('selection');
                setShowArchive(!showArchive);
              }}
              aria-expanded={showArchive}
              className="ui-tap-target ui-list-row ui-list-row--interactive w-full text-sm font-semibold text-brand-primary cursor-pointer"
            >
              <span>{t.has('completed_missions') ? t('completed_missions') : 'Archive'}</span>
              <Badge size="counter" variant="secondary">{tasks.filter((t) => t.claimed).length}</Badge>
            </button>

            {showArchive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {tasks
                  .filter((t) => t.claimed)
                  .map((task) => (
                    <Card key={task.id} variant="solid" className="p-3 sm:p-3.5">
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
