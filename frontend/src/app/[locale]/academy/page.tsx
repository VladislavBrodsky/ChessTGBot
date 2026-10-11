'use client';

import BoardA11y from '@/components/game/BoardA11y';
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import LayoutWrapper from "@/components/LayoutWrapper";
import AcademyProgressCard from '@/components/Academy/AcademyProgressCard';
import LessonCard from "@/components/Academy/LessonCard";
import DailyHintCard from "@/components/Academy/DailyHintCard";
import { FaChessKnight, FaBrain, FaLock, FaBolt, FaCheckCircle, FaTrophy, FaPlay, FaFire, FaWallet, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { useNavbar } from '@/context/NavbarContext';
import { useUser } from '@/context/UserContext';
import useSWR from 'swr';
import { apiFetch } from "@/lib/api";
import { telegramAlert, telegramConfirm } from "@/lib/telegram";
import { Card } from '@/components/ui/Card';
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
  const { pushHide, popHide } = useNavbar();


  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Hide the global navbar when a drawer is open
  useEffect(() => {
    if (!showPremiumPromo && !selectedLevel) return;
    pushHide();
    // Cleanup on unmount or when drawer closes
    return () => popHide();
  }, [showPremiumPromo, selectedLevel, pushHide, popHide]);

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
    return (
      <LayoutWrapper className="w-full ">
        <div className="w-full app-page mx-auto animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center w-full mb-4">
            <div className="h-8 bg-brand-primary opacity-10 rounded-lg w-1/2 mb-3" />
            <div className="h-px w-10 bg-brand-border-opacity-10 my-2" />
            <div className="h-2 bg-brand-primary opacity-5 rounded w-1/3 mb-4" />
            <div className="h-8 bg-brand-primary opacity-10 rounded-full w-24" />
          </div>

          {/* Daily Challenge Card Skeleton */}
          <Card variant="glass" className="w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-brand-primary opacity-10 rounded-full w-24" />
              <div className="h-4 bg-brand-primary opacity-10 rounded w-12" />
            </div>
            <div className="h-6 bg-brand-primary opacity-15 rounded-lg w-3/4" />
            <div className="h-4 bg-brand-primary opacity-10 rounded w-5/6" />
            <div className="h-10 bg-brand-primary opacity-20 rounded-xl w-full" />
          </Card>

          {/* Tactics Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <div className="w-4 h-4 bg-brand-primary opacity-10 rounded" />
              <div className="h-3 bg-brand-primary opacity-10 rounded w-24" />
            </div>
            <Card variant="glass" className="p-5">
              <div className="grid grid-cols-10 gap-2 w-full">
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-brand-primary opacity-5 border border-brand-border-opacity-5" />
                ))}
              </div>
            </Card>
          </div>

          {/* Mastery Tracks Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 px-1">
              <div className="w-4 h-4 bg-brand-primary opacity-10 rounded" />
              <div className="h-3 bg-brand-primary opacity-10 rounded w-28" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <Card key={n} variant="glass" className="w-full p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-brand-primary opacity-15 rounded w-1/3" />
                    <div className="h-4 bg-brand-primary opacity-10 rounded w-12" />
                  </div>
                  <div className="h-3 bg-brand-primary opacity-10 rounded w-2/3" />
                  <div className="w-full h-1.5 bg-brand-primary opacity-5 rounded-full" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
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
        <header className="flex flex-col items-center w-full gap-2">
          <PageHeader title={t('title')} description={t('subtitle')} icon={<FaGraduationCap />} tone="info" />

          {stats && (
            <BadgeRow className="justify-center">
              {stats.is_premium && <Badge variant="purple">{t('premium')}</Badge>}
              <Badge variant="primary">{ti('level')} {stats.level}</Badge>
              <Badge variant="secondary" icon={<FaTrophy />}>{getPlayerTitle(stats.level)}</Badge>
            </BadgeRow>
          )}
        </header>

        {/* Academy Progress Card — prominent, right below header */}
        {stats && (
          <AcademyProgressCard 
            completedCount={(completedLessons as string[]).filter(slug => lessonsList.some((l: any) => l.slug === slug)).length}
            totalCount={lessonsList.length}
            totalXp={stats?.xp ?? 0}
            streak={stats?.study_streak || 0}
          />
        )}

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
            className="ui-hero-card p-4 relative overflow-hidden group"
          >
          {/* Neon Backlight Blurs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[radial-gradient(circle,var(--color-brand-primary)_0%,transparent_70%)] opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-[radial-gradient(circle,rgba(16,185,129,1)_0%,transparent_70%)] opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

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


        {/* 100 Levels Tactics Grid */}
        {puzzlesList.length > 0 && <section className="space-y-2" aria-labelledby="tactics-grid-title">
          <SectionHeader id="tactics-grid-title" title={t('tactics_grid')} />
          <Card variant="solid" className="ui-hero-card w-full relative overflow-hidden rounded-2xl">
            {/* Progress Header */}
            <div className="flex flex-col px-3 py-2.5 border-b border-brand-border relative z-10">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-brand-primary flex items-center gap-1.5">
                  <FaBrain className="text-brand-muted text-caption" aria-hidden="true" /> {nextToSolveId ? `${t('level_prefix')} ${nextToSolveId}` : allSolved ? t('all_levels_solved') : t('unlocked')}
                </span>
                <Badge variant="emerald">
                  {completedPuzzles.length} / {puzzlesList.length} ({Math.round((completedPuzzles.length / puzzlesList.length) * 100)}%)
                </Badge>
              </div>
              <div className="w-full h-2 bg-brand-elevated rounded-full overflow-hidden" role="progressbar" aria-label={t('tactics_grid')} aria-valuemin={0} aria-valuemax={puzzlesList.length} aria-valuenow={completedPuzzles.length}>
                <div 
                  className="h-full bg-brand-action rounded-full transition-all duration-700"
                  style={{ width: `${(completedPuzzles.length / puzzlesList.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Grid */}
            <div className="p-3 relative z-10">
              <div className="tactics-grid">
                {puzzlesList.map(puzzleInfo => {
                  const id = puzzleInfo.id;
                  const isCompleted = completedPuzzles.includes(id);
                  const isSequentialLocked = puzzleInfo.is_sequential_locked;
                  const isPremiumLocked = puzzleInfo.is_premium_locked;
                  const isXpLocked = puzzleInfo.is_xp_locked;
                  const isActive = id === nextToSolveId;

                  let bgClass = "";
                  let statusMark = null;

                  if (isCompleted) {
                    bgClass = "tc-solved font-bold hover:scale-105";
                    statusMark = <FaCheckCircle className="absolute top-1 right-1 text-[9px] text-emerald-500" aria-hidden="true" />;
                  } else if (isSequentialLocked) {
                    bgClass = "bg-brand-void/25 border-brand-border-opacity-5 text-brand-muted cursor-not-allowed";
                    statusMark = <FaLock className="absolute bottom-1 right-1 text-[8px] text-brand-muted" aria-hidden="true" />;
                  } else if (isPremiumLocked) {
                    bgClass = "tc-locked hover-shake";
                    statusMark = <FaLock className="absolute bottom-1 right-1 text-[8px] text-purple-500/70" aria-hidden="true" />;
                  } else if (isXpLocked) {
                    bgClass = "bg-brand-void/50 border-emerald-500/30 text-emerald-500 hover:scale-105 hover:bg-brand-void/75 hover:border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.05)]";
                    statusMark = <FaBolt className="absolute bottom-1 right-1 text-[8px] text-emerald-500/80" aria-hidden="true" />;
                  } else if (isActive) {
                    bgClass = [
                      "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300",
                      "text-slate-900 font-semibold z-10 scale-110",
                      "shadow-[0_0_20px_rgba(255,200,0,0.55),inset_0_1px_3px_var(--color-brand-border-opacity-20)]",
                      "animate-active-portal",
                    ].join(" ");
                  } else {
                    bgClass = "tc-unlocked font-semibold hover:scale-105";
                  }

                  return (
                    <button type="button"
                      key={id}
                      onClick={() => setSelectedLevel({ id, info: puzzleInfo })}
                      className={`tactics-cell relative rounded-xl border flex items-center justify-center text-caption transition-all duration-200 cursor-pointer ${bgClass}`}
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
            <BadgeRow className="px-3 py-2.5 border-t border-brand-border relative z-10">
              <Badge variant="secondary">{t('unlocked')}</Badge>
              <Badge variant="emerald">{t('solved')}</Badge>
              <Badge variant="purple">{t('premium')}</Badge>
            </BadgeRow>
          </Card>
        </section>}

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

      {/* Premium Upgrade Promotion Drawer */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
      {showPremiumPromo && (
      <motion.div className="bottom-drawer-backdrop z-[110]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setShowPremiumPromo(false)}
        className="absolute inset-0 bg-black/80" 
        style={{ touchAction: 'none' }}
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-20"
      >
        {/* Glowing Backlight */}
        <div className="absolute top-0 left-1/2 w-72 h-72 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.15)_0%,transparent_70%)] rounded-full -translate-x-1/2 pointer-events-none" />

        <div className="bottom-drawer-handle relative z-10" />
        
        <div className="flex flex-col items-center text-center mt-2 relative z-10">
          <span className="ui-icon-tile ui-icon-tile--premium w-14 h-14 rounded-2xl mb-3"><FaTrophy size={22} aria-hidden="true" /></span>
          <h2 className="text-xl font-semibold text-brand-primary mb-1">
            {t('unlock_grid')}
          </h2>
          <p className="text-sm font-medium text-brand-muted mb-6">
            {t('level_premium_req')}
          </p>
        </div>
      
        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-4 shadow-premium relative z-10">
          <p className="text-center font-semibold text-sm mb-1" style={{ color: 'var(--badge-purple-ink)' }}>{t('premium_perks')}</p>
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
          <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
          <div className="flex justify-between items-center text-caption text-brand-muted normal-case tracking-normal bg-brand-void/50 border border-brand-border-opacity-5 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1"><FaTrophy className="text-emerald-500 text-caption" /> {stats?.xp || 0} XP</span>
            <span className="flex items-center gap-1"><FaWallet className="text-brand-muted text-caption" /> {((stats?.balance || 0)/100).toFixed(2)} USDT</span>
          </div>
        </div>
      
        <div className="w-full flex flex-col gap-3 relative z-10">
          <motion.button type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeWithXp}
            className="ui-tap-target w-full bg-brand-void border border-brand-primary/15 hover:border-brand-primary/30 text-brand-primary py-3.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm transition-all"
          >
            <span className="text-sm normal-case font-semibold tracking-normal">{t('unlock_with_xp')}</span>
            <span className="text-caption font-bold text-brand-muted">{t('free_unlock_path')}</span>
          </motion.button>
          
          <motion.button type="button"
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(168, 85, 247, 0.45)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeWithBalance}
            className="ui-tap-target w-full bg-purple-600 hover:bg-purple-600 text-white border border-purple-400/30 py-4 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-premium relative overflow-hidden transition-colors"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full animate-shimmer" />
            <span className="text-sm normal-case font-semibold tracking-normal relative z-10">{t('buy_premium')}</span>
            <span className="text-caption font-semibold normal-case tracking-normal opacity-80">{t('instant_activation')}</span>
          </motion.button>
    
          <motion.button type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPremiumPromo(false)}
            className="ui-tap-target w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-caption normal-case font-semibold tracking-normal cursor-pointer shadow-sm border border-brand-border-opacity-10 text-brand-muted hover:text-brand-primary transition-all"
          >
            <span>{t('cancel')}</span>
          </motion.button>
        </div>
      </motion.div>
      </motion.div>
      )}
      </AnimatePresence>,
      document.body
      )}

      {/* Level Info Drawer — tap any grid tile to see description + CTA */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
      {selectedLevel && (() => {
        const { id, info } = selectedLevel;
        const band = getLevelInfo(id);
        const isCompleted = completedPuzzles.includes(id);
        const isSeqLocked = info ? info.is_sequential_locked : id > 1;
        const isPremLocked = info ? info.is_premium_locked : id > 30;
        const isXpLocked  = info ? info.is_xp_locked : (id >= 11 && id <= 29);
        const isPlayable  = !isSeqLocked && !isPremLocked && !isXpLocked;
        const hintsEnabled = id <= 10;

        return (
        <motion.div className="bottom-drawer-backdrop z-[110]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLevel(null)}
            className="absolute inset-0 bg-black/80"
            style={{ touchAction: 'none' }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="bottom-drawer-sheet relative z-20"
          >
            {/* Glow */}
            <div className={`absolute top-0 left-1/2 w-64 h-64 rounded-full bg-[radial-gradient(ellipse_at_top,currentColor_0%,transparent_70%)] opacity-20 -translate-x-1/2 pointer-events-none ${isCompleted ? 'text-emerald-500' : isPremLocked ? 'text-purple-500' : 'text-brand-primary'}`} />

            <div className="bottom-drawer-handle relative z-10" />

            <div className="relative z-10 space-y-4 px-1">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-2xl">{band.emoji}</span>
                  <div>
                    <p className="text-caption font-semibold normal-case tracking-normal text-brand-muted">
                      {isCompleted ? t('solved') : isPremLocked ? t('premium_required') : isXpLocked ? t('xp_required') : isSeqLocked ? t('sequential_lock') : t('available')}
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-brand-primary normal-case leading-none">
                      {t('level_theme', { level: id, theme: band.theme })}
                    </h3>
                  </div>
                </div>
                <Badge variant={isCompleted ? 'emerald' : 'secondary'}>#{id} / 100</Badge>
              </div>

              {/* Mini Board Preview */}
              <div className="w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-xl overflow-hidden shadow-inner-glow border border-brand-border-opacity-10 pointer-events-none opacity-80">
                <BoardA11y><Chessboard options={{ position: band.fen, allowDragging: false, darkSquareStyle: { backgroundColor: '#2e3a4e' }, lightSquareStyle: { backgroundColor: '#cbd5e1' }, boardStyle: { borderRadius: "8px", overflow: "hidden" } }} /></BoardA11y>
              </div>

              {/* Description */}
              <p className="text-sm text-brand-muted leading-relaxed font-medium">
                {band.desc}
              </p>

              {/* Hint badge — only levels 1-10 */}
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
                  <motion.button type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); setShowPremiumPromo(true); }}
                    className="ui-tap-target w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-600 text-white font-semibold normal-case tracking-normal text-caption shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-colors"
                  >
                    👑 {t('unlock_with_premium')}
                  </motion.button>
                )}
                {isXpLocked && !isSeqLocked && !isPremLocked && (
                  <motion.button type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); handlePuzzleClick(id, info); }}
                    className="ui-tap-target w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-semibold normal-case tracking-normal text-caption"
                  >
                    🔓 {t('spend_unlock', { cost: info?.xp_cost ?? '—' })}
                  </motion.button>
                )}
                {isPlayable && (
                  <motion.button type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); router.push(`/${locale}/academy/puzzle?id=${id}`); }}
                    className="ui-tap-target w-full py-3.5 rounded-xl bg-brand-primary text-brand-void font-semibold normal-case tracking-normal text-caption shadow-neon relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,var(--color-brand-border-opacity-10),transparent)] -translate-x-full animate-shimmer" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <FaPlay className="text-caption" />
                      {isCompleted ? t('replay_level') : t('start_level')}
                    </span>
                  </motion.button>
                )}
                <button type="button"
                  onClick={() => setSelectedLevel(null)}
                  className="ui-tap-target w-full py-2.5 rounded-xl text-caption normal-case font-semibold tracking-normal text-brand-muted hover:text-brand-muted transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        );
      })()}
      </AnimatePresence>,
      document.body
      )}
    </LayoutWrapper>
  );
}
