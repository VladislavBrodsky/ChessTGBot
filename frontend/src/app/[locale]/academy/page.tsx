'use client';

import { motion } from "framer-motion";
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
    </LayoutWrapper>
  );
}
