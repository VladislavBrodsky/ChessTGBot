'use client';

import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonCard from "@/components/Academy/LessonCard";
import { FaBrain, FaChessKnight, FaChessRook, FaChessBishop, FaFire, FaCheck, FaLock, FaPlay, FaTrophy, FaWallet } from "react-icons/fa";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { telegramAlert, telegramConfirm } from "@/lib/telegram";

export default function AcademyPage() {
  const locale = useLocale();
  const t = useTranslations('Academy');
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [unlockedLessons, setUnlockedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [completedPuzzles, setCompletedPuzzles] = useState<number[]>([]);
  const [showPremiumPromo, setShowPremiumPromo] = useState<boolean>(false);
  const nextToSolveId = puzzles.find(p => !p.is_solved && !p.is_sequential_locked && !p.is_premium_locked && !p.is_xp_locked)?.id;

  const fetchData = async () => {
    try {
      const statsRes = await apiFetch("/api/v1/users/sync", { method: "POST" });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const lessonsRes = await apiFetch("/api/v1/gamification/academy/unlocked-lessons");
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json();
        if (Array.isArray(lessonsData)) {
          setUnlockedLessons(lessonsData);
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

  useEffect(() => {
    fetchData();
  }, []);

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
    if (currentXp < 500) {
      telegramAlert(`Upgrading requires 500 XP. You only have ${currentXp} XP.`);
      return;
    }
    try {
      const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", {
        method: "POST"
      });
      if (res.ok) {
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
        <div className="w-full max-w-sm mx-auto px-4 space-y-8 animate-pulse">
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
      <div className="w-full max-w-sm mx-auto px-4 space-y-8">

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
          <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-brand-primary opacity-30">{t('subtitle')}</span>

          {stats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-3 text-[9.5px] font-black uppercase tracking-widest py-2 px-4 rounded-full mt-4 shadow-md transition-all duration-300 ${
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
          )}
        </div>

        {/* Daily Challenge Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="w-full glass-panel p-6 rounded-3xl border border-brand-primary/20 bg-brand-surface relative overflow-hidden group transition-all duration-300 cursor-pointer shadow-premium"
        >
          {/* Neon Backlight Blurs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-primary opacity-70 bg-brand-void/60 px-3 py-1.5 rounded-full border border-brand-border-opacity-10">
                <FaFire className="text-amber-500 animate-pulse text-[10px]" /> {t('daily_challenge')}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                <FaTrophy className="text-[9px]" /> +50 XP
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight bg-gradient-to-r from-brand-primary via-brand-primary to-amber-300 bg-clip-text text-transparent uppercase mb-2">
              {t('mate_in_2')}
            </h2>
            <p className="text-xs text-brand-primary opacity-60 font-medium mb-6 leading-relaxed">{t('puzzle_desc')}</p>

            <Link href={`/${locale}/academy/puzzle`}>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(255, 255, 255, 0.15)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-[11px] cursor-pointer relative overflow-hidden shadow-neon transition-all"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <FaPlay className="text-[9px]" /> {t('start_puzzle')}
                </span>
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* 100 Levels Tactics Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <FaChessRook className="text-brand-primary opacity-40" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('tactics_grid')}</h3>
          </div>
          <div className="rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-premium relative overflow-hidden">
            {/* Backlight Orbs */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none" />

            {/* Progress Header */}
            <div className="flex flex-col p-4 border-b border-brand-border-opacity-10 relative z-10 bg-brand-void/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary/60 flex items-center gap-1.5">
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
                    statusMark = <FaCheck className="absolute top-0.5 right-0.5 text-[5px] text-emerald-500" />;
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
                      "shadow-[0_0_20px_rgba(255,200,0,0.55),inset_0_1px_3px_rgba(255,255,255,0.3)]",
                      "animate-active-portal",
                    ].join(" ");
                  } else {
                    bgClass = "tc-unlocked font-semibold hover:scale-105";
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => handlePuzzleClick(id, puzzleInfo)}
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
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest px-4 py-3 border-t border-brand-border-opacity-10 relative z-10 gap-2">
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
          <div className="flex items-center gap-2 mb-2 px-1">
            <FaChessKnight className="text-brand-primary opacity-40" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('mastery_tracks')}</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <LessonCard
              title={t('opening_title')}
              description={t('opening_desc')}
              progress={30}
              difficulty={t('beginner')}
              duration="10 min"
              onClick={() => handleLessonClick('opening-principles', false)}
            />
            <LessonCard
              title={t('tactics_title')}
              description={t('tactics_desc')}
              progress={0}
              difficulty={t('intermediate')}
              duration="15 min"
              onClick={() => handleLessonClick('tactical-patterns', false)}
            />
            <LessonCard
              title={t('endgame_title')}
              description={t('endgame_desc')}
              progress={0}
              difficulty={t('advanced')}
              duration="20 min"
              locked={!unlockedLessons.includes('endgame-basics')}
              onClick={() => handleLessonClick('endgame-basics', !unlockedLessons.includes('endgame-basics'))}
            />
          </div>
        </div>

        {/* Recent Analysis */}
        <div className="opacity-50">
          <div className="flex items-center gap-2 mb-2 px-1">
            <FaChessBishop className="text-brand-primary opacity-40" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('recent_analysis')}</h3>
          </div>
          <div className="w-full p-4 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface flex items-center justify-center h-24 text-[10px] uppercase tracking-widest text-brand-primary opacity-30 font-bold shadow-sm">
            {t('no_analysis')}
          </div>
        </div>

      </div>

      {/* Premium Upgrade Promotion Drawer */}
      <AnimatePresence>
      {showPremiumPromo && (
      <div className="bottom-drawer-backdrop z-[110]">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        onClick={() => setShowPremiumPromo(false)}
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" 
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-20 overflow-hidden"
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
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheck size={9} /></span>
              <span className="leading-tight">{t('perk_li1')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheck size={9} /></span>
              <span className="leading-tight">{t('perk_li2')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0"><FaCheck size={9} /></span>
              <span className="leading-tight">{t('perk_li3')}</span>
            </li>
          </ul>
          <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
          <div className="flex justify-between items-center text-[10px] text-brand-primary/50 uppercase tracking-widest bg-brand-void/50 border border-brand-border-opacity-5 px-3 py-2 rounded-xl">
            <span className="flex items-center gap-1"><FaTrophy className="text-amber-500 text-[8px]" /> {stats?.xp || 0} XP</span>
            <span className="flex items-center gap-1"><FaWallet className="text-brand-primary/40 text-[8px]" /> {((stats?.balance || 0)/100).toFixed(2)} USDT</span>
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
            <span className="text-[8px] font-bold text-brand-primary/50">{t('free_unlock_path')}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(245, 158, 11, 0.45)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpgradeWithBalance}
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 border border-yellow-400/30 text-brand-void py-4 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-premium relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <span className="text-xs uppercase font-black tracking-[0.2em]">{t('buy_premium')}</span>
            <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{t('instant_activation')}</span>
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
      </AnimatePresence>
    </LayoutWrapper>
  );
}
