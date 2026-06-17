'use client';

import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import LessonCard from "@/components/Academy/LessonCard";
import { FaBrain, FaChessKnight, FaChessRook, FaChessBishop, FaFire } from "react-icons/fa";
import Link from "next/link";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

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
    const solved = localStorage.getItem("completed_puzzles");
    if (solved) {
      setCompletedPuzzles(JSON.parse(solved));
    }
  }, []);

  const handleLessonClick = async (lessonId: string, isLocked: boolean) => {
    if (!isLocked) {
      router.push(`/${locale}/academy/lesson/${lessonId}`);
      return;
    }

    const currentXp = stats?.xp || 0;
    if (currentXp < 100) {
      alert(`This advanced lesson requires 100 XP to unlock. You only have ${currentXp} XP.`);
      return;
    }

    const confirmUnlock = confirm(`Unlock "Endgame Magic" lesson by spending 100 XP? (You have ${currentXp} XP)`);
    if (!confirmUnlock) return;

    try {
      const res = await apiFetch("/api/v1/gamification/academy/unlock-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson_id: lessonId })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        alert("Lesson unlocked successfully!");
        fetchData();
      } else {
        alert(data.detail || "Failed to unlock lesson");
      }
    } catch (e) {
      console.error(e);
      alert("Unlock failed");
    }
  };

  const handlePuzzleClick = (id: number, isLocked: boolean) => {
    if (isLocked) {
      setShowPremiumPromo(true);
    } else {
      router.push(`/${locale}/academy/puzzle?id=${id}`);
    }
  };

  const handleUpgradeWithXp = async () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 500) {
      alert(`Upgrading requires 500 XP. You only have ${currentXp} XP.`);
      return;
    }
    try {
      const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", {
        method: "POST"
      });
      if (res.ok) {
        alert("Upgrade successful! You are now a Premium member.");
        setShowPremiumPromo(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to upgrade");
      }
    } catch (e) {
      console.error(e);
      alert("Error upgrading with XP");
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
        alert("Subscription successful! You are now a Premium member.");
        setShowPremiumPromo(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to subscribe");
      }
    } catch (e) {
      console.error(e);
      alert("Error upgrading with Balance");
    }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6">
      <div className="w-full max-w-sm mx-auto px-4 space-y-8">

        {/* Header */}
        <div className="flex flex-col items-center w-full mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-brand-primary text-3xl font-black tracking-tighter select-none"
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
              className="flex items-center gap-3 text-[9px] font-black text-brand-primary opacity-80 uppercase tracking-widest bg-brand-surface border border-brand-border-opacity-10 py-2 px-3.5 rounded-full mt-4 shadow-sm"
            >
              <span>Level {stats.level}</span>
              <div className="w-1 h-1 bg-brand-primary/40 rounded-full" />
              <span>{stats.xp} XP</span>
            </motion.div>
          )}
        </div>

        {/* Daily Challenge Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full glass-panel p-6 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface relative overflow-hidden group hover:bg-brand-bg-opacity-5 transition-all cursor-pointer shadow-sm"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-bg-opacity-5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-brand-primary opacity-60 bg-brand-bg-opacity-5 px-2.5 py-1.5 rounded-full border border-brand-border-opacity-10">
                <FaFire className="text-brand-primary opacity-80" /> {t('daily_challenge')}
              </span>
              <span className="text-xs font-bold text-brand-primary">+50 XP</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-brand-primary uppercase mb-2">{t('mate_in_2')}</h2>
            <p className="text-sm text-brand-primary opacity-60 font-medium mb-6">{t('puzzle_desc')}</p>

            <Link href={`/${locale}/academy/puzzle`}>
              <button className="w-full py-3 rounded-xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs cursor-pointer shadow-sm">
                {t('start_puzzle')}
              </button>
            </Link>
          </div>
        </motion.div>

        {/* 100 Levels Tactics Grid */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <FaChessRook className="text-brand-primary opacity-40" />
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary opacity-60">{t('tactics_grid')}</h3>
          </div>
          <div className="glass-panel p-5 rounded-3xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm">
            <div className="grid grid-cols-10 gap-2 w-full">
              {Array.from({ length: 100 }, (_, i) => {
                const id = i + 1;
                const isCompleted = completedPuzzles.includes(id);
                const isPremiumLocked = id > 1 && !(stats?.is_premium);

                let bgClass = "bg-brand-void/60 border-brand-border-opacity-10 text-brand-primary opacity-60 hover:opacity-100 hover:scale-105";
                let statusMark = null;

                if (isCompleted) {
                  bgClass = "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-black hover:bg-emerald-500/30";
                } else if (isPremiumLocked) {
                  bgClass = "bg-amber-500/10 border-amber-500/20 text-amber-500/60";
                  statusMark = <span className="absolute bottom-0.5 right-0.5 text-[6px] opacity-75">🔒</span>;
                }

                return (
                  <button
                    key={id}
                    onClick={() => handlePuzzleClick(id, isPremiumLocked)}
                    className={`relative aspect-square rounded-xl border flex items-center justify-center text-[10px] transition-all duration-200 cursor-pointer ${bgClass}`}
                  >
                    <span>{id}</span>
                    {statusMark}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[8px] font-bold text-brand-primary opacity-40 uppercase tracking-wider mt-4 px-1">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brand-primary" /> {t('unlocked')}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t('solved')}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {t('premium')}</span>
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
        className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" 
      />
      <motion.div 
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }} 
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="bottom-drawer-sheet relative z-20"
      >
      <div className="bottom-drawer-handle" />
          <div className="flex flex-col items-center text-center mt-2">
      <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-brand-primary">
        {t('unlock_grid')}
      </h2>
      <p className="text-[10px] font-bold text-brand-primary opacity-40 uppercase tracking-[0.2em] mb-6">
        {t('level_premium_req')}
      </p>
      </div>
      
      <div className="w-full bg-brand-surface rounded-2xl p-5 border border-brand-border-opacity-10 mb-4 space-y-3 shadow-sm text-xs font-bold text-brand-primary/80 leading-relaxed">
        <p className="text-center font-black text-brand-primary text-sm mb-1">{t('premium_perks')}</p>
        <ul className="list-disc pl-4 space-y-1 text-[11px] text-brand-primary/60">
          <li>{t('perk_li1')}</li>
          <li>{t('perk_li2')}</li>
          <li>{t('perk_li3')}</li>
        </ul>
        <div className="h-px w-full bg-brand-border-opacity-10 my-2" />
        <div className="flex justify-between items-center text-[10px] text-brand-primary/50 uppercase tracking-wider">
          <span>{t('your_stats', { xp: stats?.xp || 0, balance: ((stats?.balance || 0)/100).toFixed(2) })}</span>
        </div>
      </div>
      
      <div className="w-full flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgradeWithXp}
          className="w-full bg-brand-primary text-brand-void py-3.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm"
        >
          <span className="text-xs uppercase font-black tracking-[0.2em]">{t('unlock_with_xp')}</span>
          <span className="text-[8px] font-bold opacity-80">{t('free_unlock_path')}</span>
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleUpgradeWithBalance}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-brand-void py-3.5 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)] -translate-x-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          <span className="text-xs uppercase font-black tracking-[0.2em]">{t('buy_premium')}</span>
          <span className="text-[8px] font-bold opacity-90">{t('instant_activation')}</span>
        </motion.button>
 
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowPremiumPromo(false)}
          className="w-full glass-panel py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer shadow-sm"
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
