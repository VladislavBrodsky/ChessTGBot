'use client';

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { FaTrophy, FaStar, FaShieldAlt, FaBook, FaFire, FaCoins, FaLock } from "react-icons/fa";
import { PageHeader } from '@/components/ui/PageHeader';
import { useLocale, useTranslations } from 'next-intl';
import LayoutWrapper from "@/components/LayoutWrapper";
import BadgeShowcaseModal from "@/components/BadgeShowcaseModal";
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

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
  const locale = useLocale();
  const t = useTranslations('Academy');
  const ti = useTranslations('Index');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const [loadError, setLoadError] = useState(false);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await apiFetch('/api/v1/gamification/achievements');
      if (!res.ok) throw new Error('Achievements unavailable');
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid achievements');
      setAchievements(data);
    } catch (error) {
      console.error('Could not load achievements', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAchievements();
  }, [loadAchievements]);

  if (loading) {
    return (
      <LayoutWrapper className="">
        <div className="w-full app-page mx-auto " role="status" aria-label="Loading achievements">
          <div className="mx-auto h-9 w-44 rounded-xl bg-brand-bg-opacity-10" />
          <div className="mx-auto h-3 w-28 rounded-full bg-brand-bg-opacity-5" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-48 rounded-2xl border border-brand-border-opacity-10 bg-brand-surface" />
            ))}
          </div>
        </div>
      </LayoutWrapper>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <LayoutWrapper className="">
      <div className="w-full app-page mx-auto relative z-10 flex flex-col">
        <PageHeader title={t('achievements')} description={`${t('unlocked')}: ${unlockedCount} / ${achievements.length}`} backHref={`/${locale}/academy`} />

        {loadError && <ErrorState title={ti('load_failed')} onRetry={loadAchievements} retryLabel={ti('retry')} />}
        {!loadError && achievements.length === 0 && <EmptyState title={t('achievements')} />}

        {!loadError && achievements.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <Card
              key={ach.id}
              variant="solid"
              interactive
              onClick={() => {
                setSelectedBadge(ach);
              }}
              className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all cursor-pointer select-none active:scale-[0.97] ${
                ach.unlocked 
                  ? 'glass-panel border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-500/50' 
                  : 'glass-panel opacity-60 border-brand-border-opacity-10 bg-brand-surface grayscale hover:opacity-80'
              }`}
            >
              <div className={`text-4xl mb-3 ${ach.unlocked ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-slate-500'}`}>
                {iconMap[ach.icon] || <FaTrophy />}
              </div>
              
              <h3 className="text-sm font-semibold text-brand-primary normal-case mb-1 header-balanced">{ach.title}</h3>
              <p className="text-caption text-brand-muted font-medium leading-tight mb-3 flex-1 text-pretty">{ach.description}</p>
              
              {ach.xp_reward > 0 && (
                <div className="mt-auto inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="text-caption font-semibold normal-case">+{ach.xp_reward} XP</span>
                </div>
              )}
              
              {!ach.unlocked && (
                <div className="absolute top-2 right-2">
                  <FaLock className="text-sm text-slate-500" />
                </div>
              )}
            </Card>
          ))}
        </div>}
      </div>

      <BadgeShowcaseModal
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
      />
    </LayoutWrapper>
  );
}
