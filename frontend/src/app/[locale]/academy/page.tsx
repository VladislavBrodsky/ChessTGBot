'use client';

import BoardA11y from '@/components/game/BoardA11y';
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import LayoutWrapper from "@/components/LayoutWrapper";
import AcademyProgressCard from '@/components/Academy/AcademyProgressCard';
import LessonCard from "@/components/Academy/LessonCard";
import DailyHintCard from "@/components/Academy/DailyHintCard";
import { FaChessKnight, FaBrain, FaLock, FaBolt, FaCheckCircle, FaTrophy, FaPlay, FaFire, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { Drawer } from '@/components/ui/Drawer';
import { useUser } from '@/context/UserContext';
import useSWR from 'swr';
import { apiFetch } from "@/lib/api";
import { telegramAlert, telegramConfirm, telegramHaptic } from "@/lib/telegram";
import { Card } from '@/components/ui/Card';

const TACTICS_STAGES = [
  { id: 1, start: 1, end: 20, label: '1–20', name: 'Novice' },
  { id: 2, start: 21, end: 40, label: '21–40', name: 'Intermediate' },
  { id: 3, start: 41, end: 60, label: '41–60', name: 'Advanced' },
  { id: 4, start: 61, end: 80, label: '61–80', name: 'Master' },
  { id: 5, start: 81, end: 100, label: '81–100', name: 'Grandmaster' },
] as const;
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { Badge, BadgeRow } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuickTile } from '@/components/ui/QuickTile';
import { FiLayers } from 'react-icons/fi';
import { getXPProgress } from '@/lib/xpProgress';
import { FaGraduationCap } from 'react-icons/fa';

// These libraries are only needed after a user opens a puzzle preview or
// earns a reward. Keeping them out of the Academy entry bundle makes normal
// navigation and the initial lesson list render sooner on mobile.
const Chessboard = dynamic(
  () => import('react-chessboard').then((module) => module.Chessboard),
  { ssr: false },
);
const Confetti = dynamic(() => import('react-confetti'), { ssr: false });

const CHESS_QUOTES = [
  { key: 'quote_0', author: 'Irving Chernev' },
  { key: 'quote_1', author: 'Blaise Pascal' },
  { key: 'quote_2', author: 'Bobby Fischer' },
  { key: 'quote_3', author: 'Emanuel Lasker' },
  { key: 'quote_4', author: 'Bobby Fischer' },
] as const;

interface AcademyPuzzle {
  id: number;
  title: string;
  description: string;
  xp_reward: number;
  xp_cost?: number;
  is_solved: boolean;
  is_sequential_locked: boolean;
  is_premium_locked: boolean;
  is_xp_locked: boolean;
}

interface AcademyLesson {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  xp_reward: number;
}

export default function AcademyPage() {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const ti = useTranslations('Index');
  const tm = useTranslations('Marketplace');
  const tc = useTranslations('Common');
  const router = useRouter();
  const { stats, syncStats: mutateStats } = useUser();

  const fetcher = (url: string) => apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

  const { data: dynamicLessons, error: lessonsError, mutate: mutateLessons } = useSWR("/api/v1/content/lessons", fetcher);
  const { data: academyState, error: academyError, mutate: mutateAcademyState } = useSWR("/api/v1/gamification/academy/state", fetcher);

  const unlockedLessons = academyState?.unlocked_lessons;
  const completedLessons = academyState?.completed_lessons;
  const puzzles = academyState?.puzzles;
  const mutateUnlocked = mutateAcademyState;
  const mutatePuzzles = mutateAcademyState;

  const academyLoadFailed = (!dynamicLessons && lessonsError) || (!academyState && academyError);
  const loading = !stats || (!dynamicLessons && !lessonsError) || (!academyState && !academyError);

  const puzzlesList = (puzzles || []) as AcademyPuzzle[];
  const lessonsList = (dynamicLessons || []) as AcademyLesson[];

  const completedPuzzles = puzzlesList.filter((p) => p.is_solved).map((p) => p.id);

  const [showPremiumPromo, setShowPremiumPromo] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<{ id: number; info: any } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCompletedCat, setShowCompletedCat] = useState<Record<string, boolean>>({});
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [showAllLevels, setShowAllLevels] = useState<boolean>(false);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Descriptions grouped by difficulty band for all 100 tactical levels
  const LEVEL_THEMES = [
    { range: [1, 5],   theme: t('band_0_title'),      emoji: '🎯', fen: '8/2k5/8/8/3Q4/8/6K1/8 w - - 0 1', desc: t('band_0_description') },
    { range: [6, 10],  theme: t('band_1_title'),          emoji: '♟️', fen: '8/p7/1p6/8/8/1P6/P7/8 w - - 0 1', desc: t('band_1_description') },
    { range: [11, 15], theme: t('band_2_title'),      emoji: '⚔️', fen: '8/2k5/8/2r5/2B5/2Q5/6K1/8 w - - 0 1', desc: t('band_2_description') },
    { range: [16, 20], theme: t('band_3_title'),        emoji: '🔱', fen: '8/2k5/8/4N3/8/2q5/6K1/8 w - - 0 1', desc: t('band_3_description') },
    { range: [21, 25], theme: t('band_4_title'),  emoji: '💣', fen: '8/2k5/8/2b5/8/2R5/2B5/6K1 w - - 0 1', desc: t('band_4_description') },
    { range: [26, 30], theme: t('band_5_title'),   emoji: '🛡️', fen: '8/2k5/3q4/8/8/3N4/6K1/8 w - - 0 1', desc: t('band_5_description') },
    { range: [31, 40], theme: t('band_6_title'),       emoji: '🏰', fen: '8/2k5/8/3R4/3P4/8/8/6K1 w - - 0 1', desc: t('band_6_description') },
    { range: [41, 50], theme: t('band_7_title'),       emoji: '👑', fen: '8/2k5/3q4/8/8/3Q4/6K1/8 w - - 0 1', desc: t('band_7_description') },
    { range: [51, 60], theme: t('band_8_title'),        emoji: '🌀', fen: 'r1bq1rk1/ppp2ppp/2n5/3pP3/3Pn3/2b2N2/PP2BPPP/R1BQ1RK1 w - - 0 1', desc: t('band_8_description') },
    { range: [61, 70], theme: t('band_9_title'),    emoji: '🎲', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', desc: t('band_9_description') },
    { range: [71, 80], theme: t('band_10_title'),       emoji: '⚡', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: t('band_10_description') },
    { range: [81, 90], theme: t('band_11_title'),  emoji: '🧩', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', desc: t('band_11_description') },
    { range: [91, 100], theme: t('band_12_title'),  emoji: '🏆', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: t('band_12_description') },
  ];
  const getLevelInfo = (id: number) => {
    const band = LEVEL_THEMES.find(b => id >= b.range[0] && id <= b.range[1]);
    return band || { theme: `${t('level_prefix')} ${id}`, emoji: '♟️', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: t('puzzle_description'), range: [id, id] };
  };
  const nextPuzzle = puzzlesList.find((p) => !p.is_solved);
  const nextToSolveId = nextPuzzle?.id;
  const allSolved = puzzlesList.length > 0 && !nextPuzzle;

  useEffect(() => {
    if (nextToSolveId) {
      const stage = TACTICS_STAGES.find((s) => nextToSolveId >= s.start && nextToSolveId <= s.end);
      if (stage) setActiveStageId(stage.id);
    }
  }, [nextToSolveId]);

  const activeStage = TACTICS_STAGES.find((s) => s.id === activeStageId) || TACTICS_STAGES[0];
  const displayedPuzzles = showAllLevels
    ? puzzlesList
    : puzzlesList.filter((p) => p.id >= activeStage.start && p.id <= activeStage.end);

  const stageCompletedCount = puzzlesList.filter(
    (p) => p.id >= activeStage.start && p.id <= activeStage.end && p.is_solved
  ).length;
  const stageTotalCount = activeStage.end - activeStage.start + 1;
  const stageProgressPct = Math.round((stageCompletedCount / stageTotalCount) * 100);

  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    setQuoteIdx(Math.floor(Math.random() * CHESS_QUOTES.length));
  }, []);

  const getPlayerTitle = (level: number) => {
    if (level < 5) return t('title_novice');
    if (level < 15) return t('title_club');
    if (level < 30) return t('title_expert');
    if (level < 50) return t('title_candidate');
    if (level < 70) return t('title_master');
    if (level < 90) return t('title_elite');
    return t('title_grandmaster');
  };

  const xpProgress = stats ? getXPProgress(stats.xp, stats.level) : null;

  const handlePuzzleClick = async (id: number, pInfo: any) => {
    if (!pInfo) return;

    if (pInfo.is_sequential_locked) {
      telegramAlert(t('complete_previous', { level: id - 1 }));
      return;
    }

    if (pInfo.is_premium_locked) {
      setShowPremiumPromo(true);
      return;
    }

    if (pInfo.is_xp_locked) {
      const currentXp = stats?.xp || 0;
      const cost = pInfo.xp_cost;
      if (currentXp < cost) {
        telegramAlert(t('not_enough_xp', { level: id, cost, xp: currentXp }));
        return;
      }

      telegramConfirm(t('confirm_unlock', { level: id, cost, xp: currentXp }), async (confirmed) => {
        if (!confirmed) return;
        try {
          const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${id}/unlock`, {
            method: "POST"
          });
          const data = await res.json();
            if (res.ok && data.status === "success") {
              triggerConfetti();
              telegramAlert(t('level_unlocked', { level: id }));
              mutateStats();
              mutateUnlocked();
              mutatePuzzles();
            } else {
            telegramAlert(t('unlock_failed'));
          }
        } catch (e) {
          console.error(e);
          telegramAlert(t('unlock_failed'));
        }
      });
      return;
    }

    router.push(`/${locale}/academy/puzzle?id=${id}`);
  };

  const handleUpgradeWithXp = async () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 5000) {
      telegramAlert(t('xp_upgrade_alert', { xp: currentXp.toLocaleString(locale) }));
      return;
    }
    try {
      const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", {
        method: "POST"
      });
      if (res.ok) {
        triggerConfetti();
        telegramAlert(t('upgrade_success'));
        setShowPremiumPromo(false);
        mutateStats();
        mutatePuzzles();
      } else {
        const _err = await res.json().catch(() => ({}));
        telegramAlert(t('upgrade_failed'));
      }
    } catch (e) {
      console.error(e);
      telegramAlert(t('upgrade_failed'));
    }
  };

  const handleUpgradeWithBalance = async () => {
    try {
      const res = await apiFetch("/api/v1/users/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: "premium", billing_period: "annual" })
      });
      if (res.ok) {
        triggerConfetti();
        telegramAlert(t('subscription_success'));
        setShowPremiumPromo(false);
        mutateStats();
        mutatePuzzles();
      } else {
        const _err = await res.json().catch(() => ({}));
        telegramAlert(t('upgrade_failed'));
      }
    } catch (e) {
      console.error(e);
      telegramAlert(t('upgrade_failed'));
    }
  };

  if (academyLoadFailed) {
    return (
      <LayoutWrapper className="w-full">
        <main className="app-page w-full mx-auto">
          <PageHeader title={t('title')} description={t('subtitle')} icon={<FaGraduationCap />} tone="info" />
          <ErrorState
            title={t('load_error')}
            message={t('load_error_description')}
            retryLabel={ti('retry')}
            onRetry={() => { void mutateLessons(); void mutateAcademyState(); }}
          />
        </main>
      </LayoutWrapper>
    );
  }

  if (loading) {
    return <LayoutWrapper className="w-full">
      <main className="app-page">
        <PageHeader title={t('title')} description={t('subtitle')} icon={<FaGraduationCap />} tone="info" />
        <AcademyProgressCard loading completedCount={0} totalCount={0} totalXp={0} streak={0} />
        <Card variant="solid" className="w-full p-4 space-y-3" aria-busy="true">
          <Skeleton textRole="caption" width="40%" /><Skeleton textRole="title-2" width="70%" />
          <Skeleton textRole="body" width="90%" /><Skeleton variant="rectangular" height="var(--size-control-md)" className="rounded-control" />
        </Card>
        <SkeletonList count={3} />
      </main>
    </LayoutWrapper>;
  }

  return (
    <LayoutWrapper className="w-full ">
      {showConfetti && typeof window !== 'undefined' && (
        <div className="fixed inset-0 z-20 pointer-events-none flex items-center justify-center">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={window.innerWidth < 768 ? 80 : 140}
            gravity={0.15}
          />
        </div>
      )}
      <main className="w-full app-page mx-auto ">

        {/* Header */}
        <PageHeader title={t('title')} description={t('subtitle')} icon={<FaGraduationCap />} tone="info" />

        {/* Academy Progress Card — prominent hero with integrated level and rank badges */}
        <AcademyProgressCard
          loading={!stats}
          completedCount={(completedLessons as string[]).filter(slug => lessonsList.some((l: any) => l.slug === slug)).length}
          totalCount={lessonsList.length}
          totalXp={stats?.xp ?? 0}
          streak={stats?.study_streak || 0}
          level={stats?.level}
          playerTitle={stats ? getPlayerTitle(stats.level) : undefined}
          isPremium={stats?.is_premium}
        />

        {/* Daily Challenge Section */}
        {puzzlesList.length === 0 ? (
          <section className="w-full space-y-3" aria-labelledby="daily-challenge-empty-title">
            <SectionHeader id="daily-challenge-empty-title" title={t('daily_challenge')} />
            <EmptyState
              icon={<FaChessKnight size={22} aria-hidden="true" />}
              title={t('puzzles_empty_title')}
              description={t('puzzles_empty_description')}
              actionLabel={ti('retry')}
              onAction={() => { void mutateAcademyState(); }}
            />
          </section>
        ) : <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          <Card
            variant="glass"
            className="w-full p-4 relative overflow-hidden group"
          >
          <div className="relative z-10">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
              <Badge variant="secondary" icon={<FaFire />}>
                {t('daily_challenge')}
              </Badge>
              {!allSolved && nextPuzzle && (
                <Badge variant="emerald" icon={<FaTrophy />}>
                  +{nextPuzzle.xp_reward} XP
                </Badge>
              )}
            </div>

            <h2 className="t-title-2 text-brand-primary mb-1">
              {allSolved
                ? t('all_levels_solved')
                : nextPuzzle
                  ? `${t('level_prefix')} ${nextPuzzle.id}: ${nextPuzzle.title.replace(/\s*[—\-]\s*Level\s*\d+/i, '')}`
                  : t('all_levels_solved')
              }
            </h2>
            <p className="text-sm text-brand-muted font-medium mb-4 leading-snug">
              {allSolved
                ? t('all_levels_congrats')
                : nextPuzzle
                  ? nextPuzzle.description
                  : t('all_levels_congrats')
              }
            </p>

            <Button
              variant="action"
              size="lg"
              className="w-full relative overflow-hidden"
              leftIcon={<FaPlay className="text-caption" />}
              onClick={() => {
                if (!puzzlesList.length) return;
                if (nextPuzzle) {
                  handlePuzzleClick(nextPuzzle.id, nextPuzzle);
                } else if (allSolved) {
                  handlePuzzleClick(1, puzzlesList[0]);
                }
              }}
            >
              <span className="relative z-10">
                {allSolved ? t('review_level_1') : t('start_puzzle')}
              </span>
            </Button>
          </div>
          </Card>
        </motion.div>}


        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full"
        >
          <Card
            variant="solid"
            interactive
            aria-label={t('next_quote')}
            onClick={() => setQuoteIdx((quoteIdx + 1) % CHESS_QUOTES.length)}
            className="w-full text-center px-4 py-3 group"
          >
            <p className="text-sm font-medium text-brand-primary mb-1">“{t(CHESS_QUOTES[quoteIdx].key)}”</p>
            <p className="text-caption font-medium text-brand-muted">— {CHESS_QUOTES[quoteIdx].author}</p>
          </Card>
        </motion.div>

        {/* Hint of the Day */}
        <DailyHintCard />

        {/* 100 Levels Tactics Grid with Stage Navigation */}
        {puzzlesList.length > 0 && (
          <section className="space-y-3" aria-labelledby="tactics-grid-title">
            <SectionHeader id="tactics-grid-title" title={t('tactics_grid')} action={
              <Badge variant="emerald" className="font-bold">
                <bdi>{completedPuzzles.length} / {puzzlesList.length} ({Math.round((completedPuzzles.length / puzzlesList.length) * 100)}%)</bdi>
              </Badge>
            } />

            <Card variant="solid" className="w-full relative overflow-hidden rounded-2xl p-0">
              {/* Progress Header & Stage Progress Bar */}
              <div className="flex flex-col p-4 border-b border-brand-border relative z-10 gap-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="ui-icon-tile ui-icon-tile--gold size-8 rounded-lg shrink-0">
                      <FaBrain className="text-caption" aria-hidden="true" />
                    </span>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-brand-primary">
                        {showAllLevels ? 'All 100 Levels' : `Stage ${activeStage.id}: ${activeStage.name} (${activeStage.label})`}
                      </h3>
                      <p className="text-caption text-brand-muted font-medium">
                        {showAllLevels
                          ? `${completedPuzzles.length} of 100 Puzzles Solved`
                          : `${stageCompletedCount} of ${stageTotalCount} Solved (${stageProgressPct}%)`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      telegramHaptic('selection');
                      setShowAllLevels(!showAllLevels);
                    }}
                    className={`ui-tap-target px-2.5 py-1.5 rounded-xl text-caption font-semibold transition-all border cursor-pointer ${
                      showAllLevels
                        ? 'bg-brand-elevated text-brand-primary border-brand-action shadow-sm'
                        : 'bg-brand-surface border-brand-border text-brand-muted hover:text-brand-primary'
                    }`}
                  >
                    {showAllLevels ? 'View Stages' : 'View All 100'}
                  </button>
                </div>

                <div
                  className="w-full h-2 bg-brand-elevated rounded-full overflow-hidden mt-1"
                  role="progressbar"
                  aria-label={t('tactics_grid')}
                  aria-valuemin={0}
                  aria-valuemax={showAllLevels ? puzzlesList.length : stageTotalCount}
                  aria-valuenow={showAllLevels ? completedPuzzles.length : stageCompletedCount}
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${showAllLevels ? (completedPuzzles.length / puzzlesList.length) * 100 : stageProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Current Objective Quick-Action Banner */}
              {!allSolved && nextPuzzle && (
                <div className="mx-4 mt-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 rounded-xl border border-amber-500/30 bg-brand-elevated p-3 shadow-sm">
                  <div className="flex min-w-0 flex-1 basis-40 items-center gap-2.5 text-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-brand-void flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm animate-pulse">
                      {nextPuzzle.id}
                    </div>
                    <div className="min-w-0">
                      <span className="ui-eyebrow text-amber-400">Current Objective</span>
                      <h4 className="text-sm font-bold text-brand-primary truncate">
                        {nextPuzzle.title.replace(/\s*[—\-]\s*Level\s*\d+/i, '') || `${t('level_prefix')} ${nextPuzzle.id}`}
                      </h4>
                    </div>
                  </div>
                  <Button
                    variant="action"
                    size="sm"
                    className="shrink-0 max-[360px]:w-full"
                    leftIcon={<FaPlay className="text-caption" />}
                    onClick={() => {
                      telegramHaptic('light');
                      handlePuzzleClick(nextPuzzle.id, nextPuzzle);
                    }}
                  >
                    Play {nextPuzzle.id}
                  </Button>
                </div>
              )}

              {/* Interactive Stage Tabs */}
              {!showAllLevels && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 pt-3 pb-1 -mx-0">
                  {TACTICS_STAGES.map((stage) => {
                    const isSelected = activeStageId === stage.id;
                    const stageSolved = puzzlesList.filter(p => p.id >= stage.start && p.id <= stage.end && p.is_solved).length;
                    const isFullySolved = stageSolved === (stage.end - stage.start + 1);
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => {
                          telegramHaptic('selection');
                          setActiveStageId(stage.id);
                        }}
                        className={`ui-tap-target px-3 py-1.5 rounded-xl text-caption font-semibold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                          isSelected
                            ? 'bg-brand-elevated text-brand-primary border-brand-action shadow-sm'
                            : 'bg-brand-surface border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary'
                        }`}
                      >
                        <span>{stage.label}</span>
                        <span className={`text-caption font-bold ${isFullySolved ? 'text-emerald-400' : 'text-brand-muted'}`}>
                          {isFullySolved ? '✓' : `${stageSolved}/20`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Responsive Level Cells Grid */}
              <div className="p-4 relative z-10">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
                  {displayedPuzzles.map(puzzleInfo => {
                    const id = puzzleInfo.id;
                    const isCompleted = completedPuzzles.includes(id);
                    const isSequentialLocked = puzzleInfo.is_sequential_locked;
                    const isPremiumLocked = puzzleInfo.is_premium_locked;
                    const isXpLocked = puzzleInfo.is_xp_locked;
                    const isActive = id === nextToSolveId;

                    let bgClass = "";
                    let statusMark = null;

                    if (isCompleted) {
                      bgClass = "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold hover:scale-105 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                      statusMark = <FaCheckCircle className="absolute top-1.5 right-1.5 text-xs text-emerald-400" aria-hidden="true" />;
                    } else if (isActive) {
                      bgClass = "bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold z-10 scale-105 shadow-[0_0_16px_rgba(245,158,11,0.35)] animate-pulse";
                      statusMark = <FaBolt className="absolute top-1.5 right-1.5 text-xs text-amber-400" aria-hidden="true" />;
                    } else if (isSequentialLocked) {
                      bgClass = "bg-brand-void/40 border-brand-border-opacity-10 text-brand-muted cursor-not-allowed";
                      statusMark = <FaLock className="absolute bottom-1.5 right-1.5 text-xs text-brand-muted" aria-hidden="true" />;
                    } else if (isPremiumLocked) {
                      bgClass = "bg-purple-500/10 border-purple-500/30 text-purple-300 hover-shake";
                      statusMark = <FaLock className="absolute bottom-1.5 right-1.5 text-xs text-purple-400" aria-hidden="true" />;
                    } else if (isXpLocked) {
                      bgClass = "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:scale-105";
                      statusMark = <FaBolt className="absolute bottom-1.5 right-1.5 text-xs text-emerald-400" aria-hidden="true" />;
                    } else {
                      bgClass = "bg-brand-elevated border-brand-border text-brand-primary font-semibold hover:scale-105";
                    }

                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => {
                          telegramHaptic('light');
                          setSelectedLevel({ id, info: puzzleInfo });
                        }}
                        className={`min-h-[48px] w-full aspect-square relative rounded-2xl border flex items-center justify-center text-caption font-bold transition-all duration-200 cursor-pointer ${bgClass}`}
                        aria-label={`${t('level_prefix')} ${id}`}
                      >
                        <span>{id}</span>
                        {statusMark}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <BadgeRow className="px-4 py-3 border-t border-brand-border relative z-10 justify-between items-center">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary">{t('unlocked')}</Badge>
                  <Badge variant="emerald">{t('solved')}</Badge>
                  <Badge variant="purple">{t('premium')}</Badge>
                </div>
                <span className="text-caption font-semibold text-brand-muted">
                  Tap level for hints & reward
                </span>
              </BadgeRow>
            </Card>
          </section>
        )}

        {/* Mastery Tracks Grid */}
        <section className="space-y-4" aria-labelledby="mastery-tracks-title">
          <SectionHeader id="mastery-tracks-title" title={t('mastery_tracks')} />

          {lessonsList.length === 0 && (
            <EmptyState icon={<FaChessKnight size={22} aria-hidden="true" />} title={t('mastery_tracks')} description={t('master_the_game')} />
          )}

          {/* Category-grouped lessons */}
          {(() => {
            const LESSON_CATEGORIES = [
              { id: 'fundamentals', label: t('category_fundamentals'), emoji: '♟️', slugs: ['piece-values','the-chessboard-coordinates','the-mighty-pawns','the-noble-knights','the-swift-bishops','the-heavy-rooks','the-all-powerful-queen','the-king-check','checkmate-the-goal','castling','en-passant','pawn-promotion','stalemate-and-draws'] },
              { id: 'openings', label: t('category_openings'), emoji: '🏁', slugs: ['the-3-opening-principles','e4-vs-d4-the-philosophy','the-italian-game','the-ruy-lopez-spanish','the-sicilian-defense','the-french-defense','the-caro-kann','the-queens-gambit','the-slav-defense','the-kings-indian-defense','the-nimzo-indian','the-english-opening','gambits-kings-gambit','gambits-evans-gambit','punishing-early-queen-moves','the-london-system','pawn-storms','greek-gift-sacrifice','development-imbalances','the-center-fork-trick','transpositions'] },
              { id: 'tactics', label: t('category_tactics'), emoji: '⚔️', slugs: ['forks','hanging-pieces','counting-defenders','scholars-mate','pins-absolute-relative','skewers','discovered-attacks','discovered-checks','double-checks','removing-the-defender','deflection','decoy-sacrifices','clearance-sacrifices','interference','x-ray-attacks','windmills','trapped-pieces','zwischenzug'] },
              { id: 'mating_patterns', label: t('category_mating_patterns'), emoji: '👑', slugs: ['basic-mates-2-rooks','basic-mates-king-queen','basic-mates-king-rook','back-rank-mates','smothered-mates','anastasias-mate','arabian-mate','fools-mate-quick-traps'] },
              { id: 'strategy', label: t('category_strategy'), emoji: '🧠', slugs: ['good-vs-bad-bishops','outposts','the-bishop-pair','open-files-and-rooks','the-7th-rank','doubled-pawns','isolated-pawns-iqp','backward-pawns','passed-pawns','pawn-chains','space-advantage','prophylaxis','improving-the-worst-piece','the-center-classical','the-center-hypermodern','weak-color-complexes','minority-attacks','blockades'] },
              { id: 'endgames', label: t('category_endgames'), emoji: '🏆', slugs: ['centralizing-the-king','the-rule-of-the-square','key-squares-opposition','triangulation','zugzwang','philidor-position','lucena-position','vancura-position','bishop-vs-knight-endgames','opposite-colored-bishops','queen-vs-pawn-on-7th','pawn-breakthroughs'] },
              { id: 'classics', label: t('category_classics'), emoji: '📖', slugs: ['the-immortal-game','the-evergreen-game','morphys-opera-house-game','the-game-of-the-century','kasparovs-immortal','carlsens-endgame-squeeze'] },
              { id: 'mindset', label: t('category_mindset'), emoji: '🧘', slugs: ['psychological-chess','time-management','the-masters-mindset'] },
            ];

            // Build slug -> lesson map
            const lessonBySlug = Object.fromEntries(lessonsList.map(l => [l.slug, l]));

            return LESSON_CATEGORIES.map(cat => {
              const catLessons = cat.slugs
                .map(slug => lessonBySlug[slug])
                .filter(Boolean);
              if (catLessons.length === 0) return null;

              const completedInCat = catLessons.filter(l => (completedLessons as string[]).includes(l.slug)).length;
              const catProgress = Math.round((completedInCat / catLessons.length) * 100);

              const isExpanded = !!showCompletedCat[cat.id];
              const visibleLessons = catLessons.filter(l => {
                const isCompleted = (completedLessons as string[]).includes(l.slug);
                return !isCompleted || isExpanded;
              });

              return (
                <div key={cat.id} className="mb-8">
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-brand-primary">{cat.label}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-medium text-brand-muted tabular-nums">{completedInCat}/{catLessons.length}</span>
                      {catProgress === 100 && <Badge variant="emerald">{tc('completed')}</Badge>}
                    </div>
                  </div>
                  {/* Category progress bar */}
                  <div className="w-full h-1 bg-brand-elevated rounded-full overflow-hidden mb-2" role="progressbar" aria-label={cat.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={catProgress}>
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${catProgress === 100 ? 'bg-brand-action' : 'bg-brand-muted'}`}
                      style={{ width: `${catProgress}%` }}
                    />
                  </div>

                  {/* Toggle Show Completed Button */}
                  {completedInCat > 0 && (
                    <div className="flex justify-end mb-4 px-1">
                      <button type="button"
                        onClick={() => setShowCompletedCat(prev => ({...prev, [cat.id]: !prev[cat.id]}))}
                        className="ui-tap-target text-caption font-semibold text-brand-muted hover:text-brand-primary transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <><span>{t('hide_completed')}</span><FaChevronUp className="text-caption"/></>
                        ) : (
                          <><span>{t('show_completed', { count: completedInCat })}</span><FaChevronDown className="text-caption"/></>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Lessons grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {visibleLessons.map((lesson, _idx) => {
                      // Find global index for unlock logic
                      const globalIndex = lessonsList.findIndex(l => l.slug === lesson.slug);
                      const isCompleted = (completedLessons as string[]).includes(lesson.slug);
                      const previousCompleted = globalIndex > 0 ? (completedLessons as string[]).includes(lessonsList[globalIndex - 1].slug) : true;
                      const isUnlocked = isCompleted || globalIndex === 0 || globalIndex === 1 || previousCompleted || (unlockedLessons as string[]).includes(lesson.slug);
                      return (
                        <LessonCard
                          key={lesson.slug}
                          title={lesson.title}
                          description={lesson.description}
                          progress={isCompleted ? 100 : 0}
                          locked={!isUnlocked}
                          difficulty={lesson.difficulty}
                          duration={`${lesson.xp_reward} XP`}
                          onClick={() => {
                            if (isUnlocked) router.push(`/${locale}/academy/lesson/${lesson.slug}`);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </section>

        <nav className="grid grid-cols-2 gap-3" aria-label={t('title')}>
          <QuickTile href={`/${locale}/academy/achievements`} icon={<FaTrophy />} tone="gold" label={t('achievements')} />
          <QuickTile href={`/${locale}/academy/themes`} icon={<FiLayers />} tone="info" label={tm('section_themes')} />
        </nav>

        {/* Next Milestone */}
        {stats && (
          <section className="space-y-3" aria-labelledby="next-milestone-title">
            <SectionHeader id="next-milestone-title" title={t('next_milestone')} />
            <Card variant="solid" className="w-full p-5 rounded-2xl">
              <div className="flex justify-between items-end mb-3 gap-3">
                <div className="min-w-0">
                  <p className="ui-eyebrow mb-1">{t('current_title')}</p>
                  <p className="text-sm font-semibold text-brand-primary">{getPlayerTitle(xpProgress!.displayedLevel)}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="ui-eyebrow mb-1">{t('next_level')}</p>
                  <p className="text-sm font-semibold text-brand-success">{`${t('level_prefix')} ${xpProgress!.displayedLevel + 1}`}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-brand-elevated rounded-full overflow-hidden mb-3" role="progressbar" aria-label={t('next_milestone')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(xpProgress!.progressPercentage)}>
                <div className="h-full bg-brand-action rounded-full transition-all duration-700" style={{ width: `${xpProgress!.progressPercentage}%` }} />
              </div>
              <p className="text-caption font-medium text-brand-muted">
                {t('xp_to_level', { xp: Math.max(0, xpProgress!.nextLevelXp - stats.xp).toLocaleString(locale), level: xpProgress!.displayedLevel + 1 })} {t('keep_practising')}
              </p>
            </Card>
          </section>
        )}

      </main>

      <Drawer isOpen={showPremiumPromo} onClose={() => setShowPremiumPromo(false)} title={t('unlock_grid')} description={t('level_premium_req')} layer={110}
        footer={<div className="space-y-2"><Button variant="primary" className="w-full" onClick={handleUpgradeWithBalance}>{t('buy_premium')}</Button><Button variant="secondary" className="w-full" onClick={handleUpgradeWithXp}>{t('unlock_with_xp')}</Button></div>}>
        <h3 className="t-body font-semibold">{t('premium_perks')}</h3>
          <ul className="space-y-2.5 text-caption text-brand-muted">
            <li className="flex items-start gap-2.5">
              <span className="text-purple-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-purple-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li3')}</span>
            </li>
          </ul>
      </Drawer>

      {/* Level Info Drawer — tap any grid tile to see description + CTA */}
      {selectedLevel && (() => {
        const { id, info } = selectedLevel;
        const band = getLevelInfo(id);
        const isCompleted = completedPuzzles.includes(id);
        const isSeqLocked = info ? info.is_sequential_locked : id > 1;
        const isPremLocked = info ? info.is_premium_locked : id > 30;
        const isXpLocked  = info ? info.is_xp_locked : (id >= 11 && id <= 29);
        const isPlayable  = !isSeqLocked && !isPremLocked && !isXpLocked;
        const hintsEnabled = id <= 20 || Boolean(stats?.is_premium) || (info && !info.is_xp_locked && !info.is_premium_locked);

        return <Drawer isOpen onClose={() => setSelectedLevel(null)} layer={110} title={t('level_theme', { level: id, theme: band.theme })}
          description={isCompleted ? t('solved') : isPremLocked ? t('premium_required') : isXpLocked ? t('xp_required') : isSeqLocked ? t('sequential_lock') : t('available')}>
              {/* Mini Board Preview */}
              <div className="w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-xl overflow-hidden shadow-inner-glow border border-brand-border-opacity-10 pointer-events-none opacity-80">
                <BoardA11y><Chessboard options={{ position: band.fen, allowDragging: false, darkSquareStyle: { backgroundColor: '#2e3a4e' }, lightSquareStyle: { backgroundColor: '#cbd5e1' }, boardStyle: { borderRadius: "8px", overflow: "hidden" } }} /></BoardA11y>
              </div>

              {/* Description */}
              <p className="text-sm text-brand-muted leading-relaxed font-medium">
                {band.desc}
              </p>

              {/* Hint badge */}
              {hintsEnabled && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-emerald-400 text-lg">💡</span>
                  <div>
                    <p className="text-caption font-semibold normal-case tracking-normal text-emerald-400">{t('hint_available')}</p>
                    <p className="text-caption text-emerald-400/70 font-medium">{t('hint_description')}</p>
                  </div>
                </div>
              )}

              {/* XP reward */}
              {info?.xp_reward && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-caption font-semibold normal-case tracking-normal text-emerald-400/70">{t('solve_reward')}</span>
                  <span className="text-sm font-semibold text-emerald-400">+{info.xp_reward} XP</span>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-2 pt-1">
                {isSeqLocked && (
                  <div className="w-full py-3 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-center text-caption font-semibold normal-case tracking-normal text-brand-muted">
                    🔒 {t('complete_previous', { level: id - 1 })}
                  </div>
                )}
                {isPremLocked && !isSeqLocked && (
                  <Button variant="premium" className="w-full" onClick={() => { setSelectedLevel(null); setShowPremiumPromo(true); }}
                  >
                    👑 {t('unlock_with_premium')}
                  </Button>
                )}
                {isXpLocked && !isSeqLocked && !isPremLocked && (
                  <Button variant="primary" onClick={() => { setSelectedLevel(null); handlePuzzleClick(id, info); }}
                    className="ui-tap-target w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold normal-case tracking-normal text-caption"
                  >
                    🔓 {t('spend_unlock', { cost: info?.xp_cost ?? '—' })}
                  </Button>
                )}
                {isPlayable && (
                  <Button variant="primary" onClick={() => { setSelectedLevel(null); router.push(`/${locale}/academy/puzzle?id=${id}`); }}
                    className="ui-tap-target w-full py-3.5 rounded-xl bg-brand-primary text-brand-void font-semibold normal-case tracking-normal text-caption shadow-neon relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <FaPlay className="text-caption" />
                      {isCompleted ? t('replay_level') : t('start_level')}
                    </span>
                  </Button>
                )}
                <button type="button"
                  onClick={() => setSelectedLevel(null)}
                  className="ui-tap-target w-full py-2.5 rounded-xl text-caption normal-case font-semibold tracking-normal text-brand-muted hover:text-brand-muted transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
        </Drawer>;
      })()}
    </LayoutWrapper>
  );
}
