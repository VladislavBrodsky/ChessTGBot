'use client';

import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonCard from "@/components/Academy/LessonCard";
import DailyHintCard from "@/components/Academy/DailyHintCard";
import Confetti from "react-confetti";
import { Chessboard } from "react-chessboard";
import { FaChessRook, FaChessKnight, FaBrain, FaLock, FaCheckCircle, FaStar, FaTrophy, FaArrowRight, FaPlay, FaFire, FaBookOpen, FaWallet, FaChevronDown, FaPalette } from 'react-icons/fa';
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { createPortal } from 'react-dom';
import { useNavbar } from '@/context/NavbarContext';
import { apiFetch } from "@/lib/api";
import { telegramAlert, telegramConfirm } from "@/lib/telegram";
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function AcademyPage() {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [completedPuzzles, setCompletedPuzzles] = useState<number[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showPremiumPromo, setShowPremiumPromo] = useState<boolean>(false);
  const [selectedLevel, setSelectedLevel] = useState<{ id: number; info: any } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const { pushHide, popHide } = useNavbar();

  const [dynamicLessons, setDynamicLessons] = useState<any[]>([]);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  // Hide the global navbar when a drawer is open
  useEffect(() => {
    if (showPremiumPromo || selectedLevel) {
      pushHide();
    } else {
      popHide();
    }
    // Cleanup on unmount or when drawer closes
    return () => popHide();
  }, [showPremiumPromo, selectedLevel, pushHide, popHide]);

  // Descriptions grouped by difficulty band for all 100 tactical levels
  const LEVEL_THEMES = [
    { range: [1, 5],   theme: 'Basic Tactics',      emoji: '🎯', fen: '8/2k5/8/8/3Q4/8/6K1/8 w - - 0 1', desc: 'Simple forks, captures, and one-move patterns. Perfect for building tactical instincts from the ground up.' },
    { range: [6, 10],  theme: 'Pawn Power',          emoji: '♟️', fen: '8/p7/1p6/8/8/1P6/P7/8 w - - 0 1', desc: 'Master pawn structure, passed pawns, and promotion tactics. Hint support available on these levels.' },
    { range: [11, 15], theme: 'Pins & Skewers',      emoji: '⚔️', fen: '8/2k5/8/2r5/2B5/2Q5/6K1/8 w - - 0 1', desc: 'Exploit pinned pieces and use skewers to win material on open diagonals and files.' },
    { range: [16, 20], theme: 'Fork Mastery',        emoji: '🔱', fen: '8/2k5/8/4N3/8/2q5/6K1/8 w - - 0 1', desc: 'Attack two pieces simultaneously with knights, bishops, and queens to gain decisive material.' },
    { range: [21, 25], theme: 'Discovered Attacks',  emoji: '💣', fen: '8/2k5/8/2b5/8/2R5/2B5/6K1 w - - 0 1', desc: 'Unleash hidden firepower by moving a piece to expose a devastating attack from behind.' },
    { range: [26, 30], theme: 'Defensive Tactics',   emoji: '🛡️', fen: '8/2k5/3q4/8/8/3N4/6K1/8 w - - 0 1', desc: 'Learn to defend accurately — counter-attacks, interpositions, and fortress construction.' },
    { range: [31, 40], theme: 'Rook Endgames',       emoji: '🏰', fen: '8/2k5/8/3R4/3P4/8/8/6K1 w - - 0 1', desc: 'Convert rook-and-pawn endgames with technique: Lucena, Philidor, and active rook play.' },
    { range: [41, 50], theme: 'Queen Tactics',       emoji: '👑', fen: '8/2k5/3q4/8/8/3Q4/6K1/8 w - - 0 1', desc: 'Harness the queen power — back-rank threats, queen sacrifices, and perpetual checks.' },
    { range: [51, 60], theme: 'Combinations',        emoji: '🌀', fen: 'r1bq1rk1/ppp2ppp/2n5/3pP3/3Pn3/2b2N2/PP2BPPP/R1BQ1RK1 w - - 0 1', desc: 'Multi-move combinations involving sacrifices, deflections, and piece coordination.' },
    { range: [61, 70], theme: 'Positional Chess',    emoji: '🎲', fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1', desc: 'Outpost control, piece activity, and prophylaxis at an intermediate-advanced level.' },
    { range: [71, 80], theme: 'Time Pressure',       emoji: '⚡', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: 'Rapid-fire puzzles designed to improve calculation speed and tactical vision under pressure.' },
    { range: [81, 90], theme: 'Complex Sacrifices',  emoji: '🧩', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', desc: 'Find the hidden move — deep sacrifices that flip the position decisively in your favour.' },
    { range: [91, 100], theme: 'Grandmaster Level',  emoji: '🏆', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: 'Elite-level puzzles used by titled players. Pure calculation and long-range precision required.' },
  ];
  const getLevelInfo = (id: number) => {
    const band = LEVEL_THEMES.find(b => id >= b.range[0] && id <= b.range[1]);
    return band || { theme: `Level ${id}`, emoji: '♟️', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', desc: 'Solve this tactical puzzle to progress.', range: [id, id] };
  };
  const nextPuzzle = puzzles.find(p => !p.is_solved);
  const nextToSolveId = nextPuzzle?.id;
  const allSolved = puzzles.length > 0 && !nextPuzzle;

  const fetchData = async () => {
    try {
      const statsRes = await apiFetch("/api/v1/users/sync", { method: "POST" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const contentLessonsRes = await apiFetch("/api/v1/content/lessons");
      if (contentLessonsRes.ok) {
        const cLessons = await contentLessonsRes.json();
        setDynamicLessons(cLessons);
      }

      const lessonsRes = await apiFetch("/api/v1/gamification/academy/unlocked-lessons");
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        if (Array.isArray(lessonsData)) {
          setUnlockedLessons(lessonsData);
        }
      }

      const completedLessonsRes = await apiFetch("/api/v1/gamification/academy/completed-lessons");
      if (completedLessonsRes.ok) {
        const completedData = await completedLessonsRes.json();
        if (Array.isArray(completedData)) {
          setCompletedLessons(completedData);
        }
      }

      const puzzlesRes = await apiFetch("/api/v1/gamification/academy/puzzles");
      if (puzzlesRes.ok) {
        const puzzlesData = await puzzlesRes.json();
        if (Array.isArray(puzzlesData)) {
          setPuzzles(puzzlesData);
          const solvedIds = puzzlesData.filter((p: any) => p.is_solved).map((p: any) => p.id);
          setCompletedPuzzles(solvedIds);
        }
      }
    } catch (e) {
      console.error("Failed to fetch academy details", e);
    } finally {
      setLoading(false);
    }
  };

  const CHESS_QUOTES = [
    { quote: "Every chess master was once a beginner.", author: "Irving Chernev" },
    { quote: "Chess is the gymnasium of the mind.", author: "Blaise Pascal" },
    { quote: "Tactics flow from a superior position.", author: "Bobby Fischer" },
    { quote: "When you see a good move, look for a better one.", author: "Emanuel Lasker" },
    { quote: "I don't believe in psychology. I believe in good moves.", author: "Bobby Fischer" }
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    fetchData();
    setQuoteIdx(Math.floor(Math.random() * CHESS_QUOTES.length));
  }, []);

  const getPlayerTitle = (level: number) => {
    if (level < 5) return 'Novice';
    if (level < 15) return 'Club Player';
    if (level < 30) return 'Expert';
    if (level < 50) return 'Candidate Master';
    if (level < 70) return 'FIDE Master';
    if (level < 90) return 'International Master';
    return 'Grandmaster';
  };

  const getNextMilestoneXP = (xp: number) => {
    const currentLevel = Math.floor(xp / 350) + 1;
    return currentLevel * 350;
  };

  const handleLessonClick = async (lessonId: string, isLocked: boolean) => {
    if (!isLocked) {
      router.push(`/${locale}/academy/lesson/${lessonId}`);
      return;
    }

    const currentXp = stats?.xp || 0;
    if (currentXp < 100) {
      telegramAlert(`This advanced lesson requires 100 XP to unlock. You only have ${currentXp} XP.`);
      return;
    }

    telegramConfirm(`Unlock "Endgame Magic" lesson by spending 100 XP? (You have ${currentXp} XP)`, async (confirmed) => {
      if (!confirmed) return;

      try {
        const res = await apiFetch("/api/v1/gamification/academy/unlock-lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lesson_id: lessonId })
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          triggerConfetti();
          telegramAlert("Lesson unlocked successfully!");
          fetchData();
        } else {
          telegramAlert(data.detail || "Failed to unlock lesson");
        }
      } catch (e) {
        console.error(e);
        telegramAlert("Unlock failed");
      }
    });
  };

  const handlePuzzleClick = async (id: number, pInfo: any) => {
    if (!pInfo) return;

    if (pInfo.is_sequential_locked) {
      telegramAlert(`You must solve Level ${id - 1} before you can access Level ${id}.`);
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
        telegramAlert(`Unlocking Level ${id} requires ${cost} XP. You only have ${currentXp} XP.`);
        return;
      }

      telegramConfirm(`Unlock Level ${id} by spending ${cost} XP? (You have ${currentXp} XP)`, async (confirmed) => {
        if (!confirmed) return;
        try {
          const res = await apiFetch(`/api/v1/gamification/academy/puzzles/${id}/unlock`, {
            method: "POST"
          });
          const data = await res.json();
          if (res.ok && data.status === "success") {
            triggerConfetti();
            telegramAlert(`Level ${id} unlocked successfully!`);
            fetchData();
          } else {
            telegramAlert(data.detail || "Failed to unlock level");
          }
        } catch (e) {
          console.error(e);
          telegramAlert("Unlock failed");
        }
      });
      return;
    }

    router.push(`/${locale}/academy/puzzle?id=${id}`);
  };

  const handleUpgradeWithXp = async () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 5000) {
      telegramAlert(`Upgrading requires 5,000 XP. You only have ${currentXp} XP.`);
      return;
    }
    try {
      const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", {
        method: "POST"
      });
      if (res.ok) {
        triggerConfetti();
        telegramAlert("Upgrade successful! You are now a Premium member.");
        setShowPremiumPromo(false);
        fetchData();
      } else {
        const err = await res.json();
        telegramAlert(err.detail || "Failed to upgrade");
      }
    } catch (e) {
      console.error(e);
      telegramAlert("Error upgrading with XP");
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
        telegramAlert("Subscription successful! You are now a Premium member.");
        setShowPremiumPromo(false);
        fetchData();
      } else {
        const err = await res.json();
        telegramAlert(err.detail || "Failed to subscribe");
      }
    } catch (e) {
      console.error(e);
      telegramAlert("Error upgrading with Balance");
    }
  };

  if (loading) {
    return (
      <LayoutWrapper className="pb-32 pt-6">
        <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto px-4 space-y-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col items-center w-full mb-4">
            <div className="h-8 bg-brand-primary opacity-10 rounded-lg w-1/2 mb-3" />
            <div className="h-px w-10 bg-brand-border-opacity-10 my-2" />
            <div className="h-2 bg-brand-primary opacity-5 rounded w-1/3 mb-4" />
            <div className="h-8 bg-brand-primary opacity-10 rounded-full w-24" />
          </div>

          {/* Daily Challenge Card Skeleton */}
          <div className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-5 bg-brand-primary opacity-10 rounded-full w-24" />
              <div className="h-4 bg-brand-primary opacity-10 rounded w-12" />
            </div>
            <div className="h-6 bg-brand-primary opacity-15 rounded-lg w-3/4" />
            <div className="h-4 bg-brand-primary opacity-10 rounded w-5/6" />
            <div className="h-10 bg-brand-primary opacity-20 rounded-xl w-full" />
          </div>

          {/* Tactics Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 px-1">
              <div className="w-4 h-4 bg-brand-primary opacity-10 rounded" />
              <div className="h-3 bg-brand-primary opacity-10 rounded w-24" />
            </div>
            <div className="glass-panel p-5 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface">
              <div className="grid grid-cols-10 gap-2 w-full">
                {Array.from({ length: 100 }, (_, i) => (
                  <div key={i} className="aspect-square rounded-xl bg-brand-primary opacity-5 border border-brand-border-opacity-5" />
                ))}
              </div>
            </div>
          </div>

          {/* Mastery Tracks Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 px-1">
              <div className="w-4 h-4 bg-brand-primary opacity-10 rounded" />
              <div className="h-3 bg-brand-primary opacity-10 rounded w-28" />
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="w-full p-4 rounded-2xl glass-panel border border-brand-border-opacity-10 bg-brand-surface space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="h-4 bg-brand-primary opacity-15 rounded w-1/3" />
                    <div className="h-4 bg-brand-primary opacity-10 rounded w-12" />
                  </div>
                  <div className="h-3 bg-brand-primary opacity-10 rounded w-2/3" />
                  <div className="w-full h-1.5 bg-brand-primary opacity-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper className="pb-32 pt-6">
      {showConfetti && typeof window !== 'undefined' && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
          />
        </div>
      )}
      <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center w-full mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-brand-primary text-3xl font-black tracking-tighter select-none uppercase"
          >
            <FaBrain className="text-2xl opacity-80" />
            {t('title')}
          </motion.div>
          <div className="h-px w-10 bg-brand-border-opacity-10 my-2" />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-primary opacity-30">{t('subtitle')}</span>

          {stats && (
            <div className="flex flex-col items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-full mt-4 shadow-md transition-all duration-300 w-full max-w-sm ${
                  stats.is_premium
                    ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse'
                    : 'bg-brand-surface border border-brand-border-opacity-10 text-brand-primary opacity-80'
                }`}
              >
                <span>{stats.is_premium ? '👑 Premium' : 'Regular'}</span>
                <div className="w-px h-2.5 bg-brand-border-opacity-10" />
                <span>Level {stats.level}</span>
                <div className="w-1 h-1 bg-current opacity-40 rounded-full" />
                <span>{stats.xp} XP</span>
              </motion.div>

              {/* Badges & Streak Row */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary" className="gap-1.5 px-3 py-1.5 bg-brand-primary/10 border-brand-primary/20 text-[10px]">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <FaFire className="text-amber-500" />
                  </motion.div> {stats.study_streak || 0} Day Streak
                </Badge>
                <Badge variant="primary" className="gap-1.5 px-3 py-1.5 bg-brand-primary/10 border-brand-primary/20 text-[10px]">
                  <FaTrophy className="text-amber-400" /> {getPlayerTitle(stats.level)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Motivational Quote */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setQuoteIdx((quoteIdx + 1) % CHESS_QUOTES.length)}
          className="w-full text-center px-6 py-4 rounded-2xl bg-brand-surface border border-brand-border-opacity-10 cursor-pointer hover:bg-brand-void/50 transition-all group"
        >
          <p className="text-xs font-semibold text-brand-primary/80 italic mb-1 transition-opacity">"{CHESS_QUOTES[quoteIdx].quote}"</p>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">— {CHESS_QUOTES[quoteIdx].author}</p>
        </motion.div>

        {/* Hint of the Day */}
        <DailyHintCard />

        {/* Daily Challenge Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="w-full"
        >
          <Card 
            variant="glass" 
            interactive
            onClick={() => {
              if (!puzzles.length) return;
              if (nextPuzzle) {
                handlePuzzleClick(nextPuzzle.id, nextPuzzle);
              } else if (allSolved) {
                handlePuzzleClick(1, puzzles[0]);
              }
            }}
            className="p-6 relative overflow-hidden group shadow-premium border-brand-primary/20 rounded-3xl"
          >
          {/* Neon Backlight Blurs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <Badge variant="secondary" className="gap-1.5 text-brand-primary bg-brand-void/60 border-brand-border-opacity-10 opacity-70">
                <FaFire className="text-amber-500 animate-pulse text-[10px]" /> {t('daily_challenge')}
              </Badge>
              {!allSolved && (
                <Badge variant="amber" className="gap-1 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                  <FaTrophy className="text-[10px]" /> +{nextPuzzle ? nextPuzzle.xp_reward : 50} XP
                </Badge>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary via-brand-primary to-amber-300 bg-clip-text text-transparent uppercase mb-2">
              {allSolved 
                ? (locale === 'ru' ? 'ВСЕ УРОВНИ РЕШЕНЫ!' : 'ALL LEVELS SOLVED!') 
                : nextPuzzle 
                  ? `${t('level_prefix')} ${nextPuzzle.id}: ${nextPuzzle.title}` 
                  : t('mate_in_2')
              }
            </h2>
            <p className="text-xs text-brand-primary opacity-60 font-medium mb-6 leading-relaxed">
              {allSolved 
                ? (locale === 'ru' ? 'Поздравляем! Вы прошли все 100 тактических уровней. Продолжайте тренироваться!' : 'Congratulations! You have completed all 100 tactical levels. Keep practicing!') 
                : nextPuzzle 
                  ? nextPuzzle.description 
                  : t('puzzle_desc')
              }
            </p>

            <Button
              variant="action"
              className="w-full shadow-neon relative overflow-hidden"
              leftIcon={<FaPlay className="text-[10px]" />}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,var(--color-brand-border-opacity-20),transparent)] -translate-x-full animate-shimmer" />
              <span className="relative z-10">
                {allSolved ? (locale === 'ru' ? 'Повторить Уровень 1' : 'Review Level 1') : t('start_puzzle')}
              </span>
            </Button>
          </div>
          </Card>
        </motion.div>


        {/* 100 Levels Tactics Grid */}
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-2 mb-4 px-1">
            <FaChessRook className="text-brand-primary opacity-40 text-xl" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60 text-center">{t('tactics_grid')}</h3>
          </div>
          <div className="rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-premium relative overflow-hidden">
            {/* Backlight Orbs */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />

            {/* Progress Header */}
            <div className="flex flex-col p-4 border-b border-brand-border-opacity-10 relative z-10 bg-brand-void/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 flex items-center gap-1.5">
                  <FaBrain className="text-brand-primary/50 text-[10px]" /> {t('tactics_grid')}
                </span>
                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
                  {completedPuzzles.length} / 100 ({Math.round(completedPuzzles.length)}%)
                </span>
              </div>
              <div className="w-full h-2 bg-brand-primary/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                  style={{ width: `${Math.max(completedPuzzles.length, 1)}%` }}
                />
              </div>
            </div>

            {/* Grid */}
            <div className="p-3.5 relative z-10">
              <div className="grid grid-cols-10 gap-1.5 w-full">
                {Array.from({ length: 100 }, (_, i) => {
                  const id = i + 1;
                  const puzzleInfo = puzzles.find(p => p.id === id);
                  const isCompleted = completedPuzzles.includes(id);
                  const isSequentialLocked = puzzleInfo ? puzzleInfo.is_sequential_locked : (id > 1);
                  const isPremiumLocked = puzzleInfo ? puzzleInfo.is_premium_locked : (id > 30);
                  const isXpLocked = puzzleInfo ? puzzleInfo.is_xp_locked : (id >= 11 && id <= 29);
                  const isActive = id === nextToSolveId;

                  let bgClass = "";
                  let statusMark = null;

                  if (isCompleted) {
                    bgClass = "tc-solved font-bold hover:scale-105";
                    statusMark = <FaCheckCircle className="absolute top-0.5 right-0.5 text-[5px] text-emerald-500" />;
                  } else if (isSequentialLocked) {
                    bgClass = "bg-brand-void/25 border-brand-border-opacity-5 text-brand-primary/20 cursor-not-allowed";
                    statusMark = <FaLock className="absolute bottom-0.5 right-0.5 text-[5px] text-brand-primary/10" />;
                  } else if (isPremiumLocked) {
                    bgClass = "tc-locked hover-shake";
                    statusMark = <FaLock className="absolute bottom-0.5 right-0.5 text-[5px] text-amber-500/60" />;
                  } else if (isXpLocked) {
                    bgClass = "bg-brand-void/50 border-amber-500/30 text-amber-500 hover:scale-105 hover:bg-brand-void/75 hover:border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.05)]";
                    statusMark = <div className="absolute bottom-0.5 right-0.5 text-[5.5px] font-bold text-amber-500/70">XP</div>;
                  } else if (isActive) {
                    bgClass = [
                      "bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-300",
                      "text-slate-900 font-black z-10 scale-110",
                      "shadow-[0_0_20px_rgba(255,200,0,0.55),inset_0_1px_3px_var(--color-brand-border-opacity-20)]",
                      "animate-active-portal",
                    ].join(" ");
                  } else {
                    bgClass = "tc-unlocked font-semibold hover:scale-105";
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedLevel({ id, info: puzzleInfo })}
                      className={`relative aspect-square rounded-xl border flex items-center justify-center text-[10px] transition-all duration-200 cursor-pointer ${bgClass}`}
                    >
                      <span>{id}</span>
                      {statusMark}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-4 py-3 border-t border-brand-border-opacity-10 relative z-10 gap-2">
              <span className="tc-legend-unlocked flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                {t('unlocked')}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.7)]" />
                {t('solved')}
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.7)]" />
                {t('premium')}
              </span>
            </div>
          </div>
        </div>

        {/* Mastery Tracks Grid */}
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-2 mb-4 px-1">
            <FaChessKnight className="text-brand-primary opacity-40 text-xl" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60 text-center">{t('mastery_tracks')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {dynamicLessons.map((lesson, index) => {
              const isUnlocked = index === 0 || index === 1 || unlockedLessons.includes(lesson.slug);
              const isCompleted = completedLessons.includes(lesson.slug);
              
              return (
                <div 
                  key={lesson.slug}
                  onClick={() => {
                    if (isUnlocked) {
                      router.push(`/${locale}/academy/lesson/${lesson.slug}`);
                    }
                  }}
                  className={`w-full p-4 rounded-2xl glass-panel border border-brand-border-opacity-10 bg-brand-surface space-y-3 cursor-pointer ${isUnlocked ? 'hover:border-brand-primary/30 transition-all' : 'opacity-60 grayscale'}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className={`font-black uppercase text-sm ${isUnlocked ? 'text-brand-primary' : 'text-brand-primary/60'}`}>
                      {lesson.title}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isUnlocked ? 'text-brand-primary/60' : 'text-brand-primary/40'}`}>
                      {lesson.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      lesson.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      lesson.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      lesson.difficulty === 'Advanced' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                    }`}>
                      {lesson.difficulty}
                    </span>
                    
                    <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-wider flex items-center gap-1">
                      <FaCheckCircle className={isCompleted ? 'text-emerald-500' : 'text-brand-primary/30'} /> 
                      {lesson.xp_reward} XP
                    </span>
                  </div>
                  {!isUnlocked && (
                    <div className="flex items-center justify-center pt-2">
                      <FaLock className="text-amber-500 mb-1" />
                      <span>100 XP</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Completed Tracks (Archive) */}
          {dynamicLessons.some(lesson => completedLessons.includes(lesson.slug)) && (
            <div className="mt-6 border border-brand-border-opacity-10 rounded-2xl bg-brand-surface/30 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowArchive(!showArchive)}
                className="w-full flex items-center justify-between p-4 bg-brand-surface/50 hover:bg-brand-surface cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500 text-sm" />
                  <span className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-80">Completed Tracks</span>
                  <span className="ml-2 text-[10px] font-bold bg-brand-primary/10 px-2 py-0.5 rounded-full text-brand-primary/60">
                    {dynamicLessons.filter(lesson => completedLessons.includes(lesson.slug)).length}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: showArchive ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaChevronDown className="text-brand-primary opacity-40 text-xs" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {showArchive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-2 grid grid-cols-1 gap-4 border-t border-brand-border-opacity-5">
                      {dynamicLessons.filter(lesson => completedLessons.includes(lesson.slug)).map(lesson => (
                        <div key={lesson.slug} className="opacity-75 hover:opacity-100 transition-opacity">
                          <LessonCard
                            title={lesson.title}
                            description={lesson.description}
                            progress={100}
                            difficulty={lesson.difficulty}
                            locked={false}
                            onClick={() => router.push(`/${locale}/academy/lesson/${lesson.slug}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Next Milestone */}
        {stats && (
          <div className="opacity-90 mt-8">
            <div className="flex flex-col items-center justify-center gap-2 mb-4 px-1">
              <FaTrophy className="text-amber-400 opacity-60 text-xl" />
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 opacity-80 text-center">Next Milestone</h3>
            </div>
            
            <div className="w-full p-5 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden shadow-sm">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              
              <div className="flex justify-between items-end mb-3 relative z-10">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/50 mb-1">Current Title</p>
                  <p className="text-sm font-black text-brand-primary">{getPlayerTitle(stats.level)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500/70 mb-1">Next Level</p>
                  <p className="text-sm font-black text-amber-400">Level {stats.level + 1}</p>
                </div>
              </div>
              
              <div className="w-full h-2 bg-brand-primary/10 rounded-full overflow-hidden relative z-10 mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  style={{ width: `${(stats.xp / getNextMilestoneXP(stats.xp)) * 100}%` }}
                />
              </div>
              
              <div className="text-center relative z-10 mt-3">
                <p className="text-[10px] font-bold text-brand-primary/60">
                  You need <span className="text-amber-400 font-black">{getNextMilestoneXP(stats.xp) - stats.xp} XP</span> to reach Level {stats.level + 1}. <br/> Solve one more puzzle!
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Premium Upgrade Promotion Drawer */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
      {showPremiumPromo && (
      <div className="bottom-drawer-backdrop z-[110]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setShowPremiumPromo(false)}
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" 
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
        <div className="absolute top-0 left-1/2 w-72 h-72 bg-gradient-to-b from-amber-500/10 to-transparent rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />

        <div className="bottom-drawer-handle relative z-10" />
        
        <div className="flex flex-col items-center text-center mt-2 relative z-10">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-3 animate-bounce">
            <span className="text-xl">👑</span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest mb-1 bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow">
            {t('unlock_grid')}
          </h2>
          <p className="text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
            {t('level_premium_req')}
          </p>
        </div>
      
        <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-4 shadow-premium relative z-10">
          <p className="text-center font-black text-amber-400 text-xs uppercase tracking-widest mb-1">{t('premium_perks')}</p>
          <ul className="space-y-2.5 text-[11px] text-brand-primary/80">
            <li className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheckCircle size={9} /></span>
              <span className="leading-tight">{t('perk_li3')}</span>
            </li>
          </ul>
          <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
          <div className="flex justify-between items-center text-[10px] text-brand-primary/50 uppercase tracking-widest bg-brand-void/50 border border-brand-border-opacity-5 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1"><FaTrophy className="text-amber-500 text-[10px]" /> {stats?.xp || 0} XP</span>
            <span className="flex items-center gap-1"><FaWallet className="text-brand-primary/40 text-[10px]" /> {((stats?.balance || 0)/100).toFixed(2)} USDT</span>
          </div>
        </div>
      
        <div className="w-full flex flex-col gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeWithXp}
            className="w-full bg-brand-void border border-brand-primary/15 hover:border-brand-primary/30 text-brand-primary py-3.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm transition-all"
          >
            <span className="text-xs uppercase font-black tracking-[0.2em]">{t('unlock_with_xp')}</span>
            <span className="text-[10px] font-bold text-brand-primary/50">{t('free_unlock_path')}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(245, 158, 11, 0.45)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeWithBalance}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border border-yellow-400/30 text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-premium relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,var(--color-brand-border-opacity-20),transparent)] -translate-x-full animate-shimmer" />
            <span className="text-xs uppercase font-black tracking-[0.2em]">{t('buy_premium')}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('instant_activation')}</span>
          </motion.button>
    
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPremiumPromo(false)}
            className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest cursor-pointer shadow-sm border border-brand-border-opacity-10 text-brand-primary/60 hover:text-brand-primary/95 transition-all"
          >
            <span>{t('cancel')}</span>
          </motion.button>
        </div>
      </motion.div>
      </div>
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
        <div className="bottom-drawer-backdrop z-[110]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLevel(null)}
            className="absolute inset-0 bg-[rgba(0,0,0,0.55)] backdrop-blur-sm"
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
            <div className={`absolute top-0 left-1/2 w-64 h-64 rounded-full blur-3xl -translate-x-1/2 pointer-events-none opacity-20 ${isCompleted ? 'bg-emerald-500' : isPremLocked ? 'bg-amber-500' : 'bg-brand-primary'}`} />

            <div className="bottom-drawer-handle relative z-10" />

            <div className="relative z-10 space-y-4 px-1">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{band.emoji}</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/40">
                      {isCompleted ? '✅ Solved' : isPremLocked ? '👑 Premium Required' : isXpLocked ? '🔒 XP Required' : isSeqLocked ? '🔒 Sequential Lock' : '▶ Available'}
                    </p>
                    <h3 className="text-lg font-black tracking-tight text-brand-primary uppercase leading-none">
                      Level {id} — {band.theme}
                    </h3>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${isCompleted ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : isPlayable ? 'bg-brand-primary/10 border-brand-border-opacity-10 text-brand-primary/60' : 'bg-brand-void/50 border-brand-border-opacity-5 text-brand-primary/30'}`}>
                  #{id} / 100
                </span>
              </div>

              {/* Mini Board Preview */}
              <div className="w-full aspect-square max-w-[200px] mx-auto mb-4 rounded-xl overflow-hidden shadow-inner-glow border border-brand-border-opacity-10 pointer-events-none opacity-80">
                <Chessboard options={{ position: band.fen, allowDragging: false, boardStyle: { borderRadius: "8px", overflow: "hidden" } }} />
              </div>

              {/* Description */}
              <p className="text-sm text-brand-primary/70 leading-relaxed font-medium">
                {band.desc}
              </p>

              {/* Hint badge — only levels 1-10 */}
              {hintsEnabled && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                  <span className="text-emerald-400 text-lg">💡</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Hint Available</p>
                    <p className="text-[10px] text-emerald-400/70 font-medium">Use the hint button inside the puzzle to reveal the best next move.</p>
                  </div>
                </div>
              )}

              {/* XP reward */}
              {info?.xp_reward && (
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">Reward for solving</span>
                  <span className="text-sm font-black text-amber-400">+{info.xp_reward} XP</span>
                </div>
              )}

              {/* CTAs */}
              <div className="space-y-2 pt-1">
                {isSeqLocked && (
                  <div className="w-full py-3 rounded-xl border border-brand-border-opacity-10 bg-brand-surface text-center text-[10px] font-black uppercase tracking-widest text-brand-primary/30">
                    🔒 Complete Level {id - 1} first
                  </div>
                )}
                {isPremLocked && !isSeqLocked && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); setShowPremiumPromo(true); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 font-black uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    👑 Unlock with Premium
                  </motion.button>
                )}
                {isXpLocked && !isSeqLocked && !isPremLocked && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); handlePuzzleClick(id, info); }}
                    className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black uppercase tracking-widest text-[11px]"
                  >
                    🔓 Spend {info?.xp_cost ?? '—'} XP to Unlock
                  </motion.button>
                )}
                {isPlayable && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setSelectedLevel(null); router.push(`/${locale}/academy/puzzle?id=${id}`); }}
                    className="w-full py-3.5 rounded-xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-[11px] shadow-neon relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,var(--color-brand-border-opacity-10),transparent)] -translate-x-full animate-shimmer" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <FaPlay className="text-[10px]" />
                      {isCompleted ? 'Replay Level' : 'Start Level'}
                    </span>
                  </motion.button>
                )}
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="w-full py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest text-brand-primary/40 hover:text-brand-primary/70 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        );
      })()}
      </AnimatePresence>,
      document.body
      )}
    </LayoutWrapper>
  );
}
