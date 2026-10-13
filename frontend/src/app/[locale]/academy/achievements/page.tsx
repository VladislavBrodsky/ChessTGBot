'use client';

import { useState } from "react";
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import { FaTrophy, FaStar, FaShieldAlt, FaBook, FaFire, FaCoins, FaLock } from "react-icons/fa";
import { PageHeader } from '@/components/ui/PageHeader';
import { useLocale, useTranslations } from 'next-intl';
import LayoutWrapper from "@/components/LayoutWrapper";
import BadgeShowcaseModal from "@/components/BadgeShowcaseModal";
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
  const { data, error: loadError, isLoading: loading, mutate: loadAchievements } = useSWRFetch<Achievement[]>('/api/v1/gamification/achievements', { revalidateOnFocus: false });
  const achievements = Array.isArray(data) ? data : [];
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <LayoutWrapper className="">
      <main className="w-full app-page mx-auto relative z-10 flex flex-col">
        <PageHeader icon={<FaTrophy />} tone="gold" title={t('achievements')} description={loading ? <Skeleton textRole="body" width="12ch" /> : loadError && !data ? ti('load_failed') : `${t('unlocked')}: ${unlockedCount} / ${achievements.length}`}  backHref={`/${locale}/academy`} />

        {loading && <div className="grid grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true">{[0, 1].map(i => <Card key={i} variant="solid" className="p-4 min-h-48 flex flex-col items-center gap-3"><Skeleton variant="rectangular" width={40} height={40} /><SkeletonText lines={2} className="w-full" /><Skeleton textRole="caption" width={64} /></Card>)}</div>}
        {loadError && !data && <ErrorState title={ti('load_failed')} onRetry={() => { void loadAchievements(); }} retryLabel={ti('retry')} />}
        {!loading && !loadError && achievements.length === 0 && <EmptyState title={t('achievements')} />}

        {achievements.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  ? 'glass-panel ui-stat--accent' 
                  : 'glass-panel'
              }`}
            >
              <div className={`text-4xl mb-3 ${ach.unlocked ? 'text-brand-success' : 'text-brand-muted'}`}>
                {iconMap[ach.icon] || <FaTrophy />}
              </div>
              
              <h2 className="text-sm font-semibold text-brand-primary normal-case mb-1 header-balanced">{ach.title}</h2>
              <p className="text-caption text-brand-muted font-medium leading-tight mb-3 flex-1 text-pretty">{ach.description}</p>
              
              {ach.xp_reward > 0 && (
                <Badge variant={ach.unlocked ? 'emerald' : 'secondary'} className="mt-auto">+{ach.xp_reward} XP</Badge>
              )}
              
              {!ach.unlocked && (
                <div className="absolute top-2 right-2">
                  <FaLock className="text-sm text-brand-muted" aria-hidden="true" />
                </div>
              )}
            </Card>
          ))}
        </div>}
      </main>

      <BadgeShowcaseModal
        isOpen={Boolean(selectedBadge)}
        onClose={() => setSelectedBadge(null)}
        badge={selectedBadge}
      />
    </LayoutWrapper>
  );
}
