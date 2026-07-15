'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import { FaTrophy, FaStar, FaShieldAlt, FaBook, FaFire, FaCoins, FaLock } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface Achievement {
  id: number;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

const iconMap: Record<string, React.ReactNode> = {
  "fa-trophy": <FaTrophy />,
  "fa-star": <FaStar />,
  "fa-shield-alt": <FaShieldAlt />,
  "fa-book": <FaBook />,
  "fa-fire": <FaFire />,
  "fa-coins": <FaCoins />
};

export default function AchievementsPage() {
  const t = useTranslations('Academy');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/v1/gamification/achievements')
      .then(res => res.json())
      .then(data => {
        setAchievements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="pb-24 pt-6 px-4 md:px-6 w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-8 relative z-10 flex flex-col h-full overflow-y-auto hide-scrollbar">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-brand-primary uppercase tracking-tight">Achievements</h1>
        <p className="text-sm font-bold text-brand-primary opacity-60 tracking-widest uppercase">
          Unlocked {unlockedCount} / {achievements.length}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((ach, idx) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
              ach.unlocked 
                ? 'glass-panel border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'glass-panel opacity-50 border-brand-border-opacity-10 bg-brand-surface grayscale'
            }`}
          >
            <div className={`text-4xl mb-3 ${ach.unlocked ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-500'}`}>
              {iconMap[ach.icon] || <FaTrophy />}
            </div>
            
            <h3 className="text-sm font-black text-brand-primary uppercase mb-1">{ach.title}</h3>
            <p className="text-[10px] text-brand-primary/60 font-medium leading-tight mb-3 flex-1">{ach.description}</p>
            
            {ach.xp_reward > 0 && (
              <div className="mt-auto inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                <span className="text-[9px] font-black uppercase">+{ach.xp_reward} XP</span>
              </div>
            )}
            
            {!ach.unlocked && (
              <div className="absolute top-2 right-2">
                <FaLock className="text-xs text-slate-500" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
