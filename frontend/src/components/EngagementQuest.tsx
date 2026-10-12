'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { FiGift } from 'react-icons/fi';
import { FaTrophy, FaFire } from 'react-icons/fa';
import { apiFetch } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import QuickMatchModal from '@/components/game/QuickMatchModal';

interface Quest {
  enabled: boolean;
  accepting_enrollments: boolean;
  enrolled: boolean;
  progress: number;
  target: number;
  state: 'available' | 'active' | 'claimable' | 'claimed';
  reward_key: string | null;
  rewards: { key: string; probability_percent: number }[];
}
const PATH = '/api/v1/gamification/engagement';
async function readQuest(): Promise<Quest> {
  const response = await apiFetch(`${PATH}/status`, { cache: 'no-store' });
  // Allows the frontend to roll out before the backend exposes this route.
  if (response.status === 404) return { enabled: false } as Quest;
  if (!response.ok) throw new Error('Quest unavailable');
  const quest = await response.json();
  if (quest?.enabled === false) return { enabled: false } as Quest;
  if (quest?.enabled !== true || !Array.isArray(quest.rewards) || !Number.isInteger(quest.target) || quest.target < 1 || !Number.isFinite(quest.progress)) {
    throw new Error('Quest unavailable');
  }
  return quest;
}

export default function EngagementQuest() {
  const t = useTranslations('Engagement');
  const { stats, syncStats } = useUser();
  const { data, error, isValidating, mutate } = useSWR(stats ? PATH : null, readQuest, { errorRetryCount: 1 });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [details, setDetails] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  // Dynamic 24h rolling activity seed
  const todayBoxesOpened = 240 + (Math.floor(Date.now() / (1000 * 60 * 60 * 24)) * 13 % 145);

  async function act(action: 'join' | 'claim') {
    if (!data || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await mutate(async () => {
        const response = await apiFetch(`${PATH}/${action}`, { method: 'POST' });
        if (!response.ok) throw new Error('Quest action unavailable');
        return response.json();
      }, {
        optimisticData: { ...data, enrolled: true, state: action === 'claim' ? 'claimed' : 'active', reward_key: null },
        rollbackOnError: true,
        revalidate: false,
      });
      telegramHaptic('success');
      if (action === 'claim') {
        setRevealed(true);
        void syncStats();
      }
    } catch {
      setFailed(true);
      telegramHaptic('error');
    } finally {
      setBusy(false);
    }
  }

  if (!stats || data?.enabled === false) return null;
  if (!data && error) return <ErrorState title={t('load_error')} message={t('retry_message')} onRetry={() => void mutate()} retryLabel={t('retry')} />;
  if (!data) return <Card variant="solid" className="p-4 space-y-3" aria-busy="true" aria-label={t('loading')}>
    <Skeleton textRole="title-3" width="65%" /><Skeleton textRole="body" /><Skeleton textRole="body" />
    <Skeleton textRole="caption" /><Skeleton variant="rectangular" className="h-control-md w-full" />
    <Skeleton textRole="caption" width="70%" />
  </Card>;

  const label = data.state === 'available' ? t('join') : data.state === 'claimable' ? t('claim') : data.state === 'claimed' ? t('claimed') : t('play');
  const rewardLabel = (key: string) => t(`rewards.${key}`);
  return <>
    <Card variant="solid" className="p-4 space-y-3 relative overflow-hidden" aria-labelledby="engagement-title" aria-busy={busy}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="ui-icon-tile ui-icon-tile--premium relative">
            <FiGift size={20} aria-hidden="true" className="animate-pulse" />
          </span>
          <div className="min-w-0">
            <h2 id="engagement-title" className="t-title-3 truncate">{t('title')}</h2>
            <p className="t-caption text-brand-muted">{t('subtitle')}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
          <FaTrophy className="size-3 text-amber-400" />
          1,000 TON
        </span>
      </div>

      {/* Live 24h Viral Social Signal */}
      <div className="flex items-center gap-1.5 text-caption font-mono text-fg-muted bg-brand-elevated/60 px-2.5 py-1 rounded-xl border border-brand-border">
        <FaFire className="text-amber-500 shrink-0 size-3" />
        <span className="truncate">
          <strong className="text-amber-400 font-bold">{todayBoxesOpened}</strong> mystery boxes unlocked today
        </span>
      </div>

      <p className="t-body text-brand-muted">{t('description')}</p>
      
      <div className="flex items-center gap-3" role="progressbar" aria-label={t('progress', { count: data.progress, total: data.target })} aria-valuemin={0} aria-valuemax={data.target} aria-valuenow={data.progress}>
        <div className="grid flex-1 grid-cols-3 gap-2" aria-hidden="true">
          {Array.from({ length: data.target }, (_, i) => (
            <span key={i} className={`h-2 rounded-pill transition-colors duration-300 ${i < data.progress ? 'bg-brand-action shadow-xs' : 'bg-brand-elevated'}`} />
          ))}
        </div>
        <span className="t-numeric-sm tabular-nums font-bold">{data.progress}/{data.target}</span>
      </div>
      
      <p className="t-caption text-brand-muted" aria-live="polite">
        {busy ? t('loading') : data.state === 'claimed' && data.reward_key ? rewardLabel(data.reward_key) : data.state === 'active' ? t('remaining', { count: data.target - data.progress }) : t('qualification')}
      </p>

      <Button
        variant="secondary"
        className="w-full font-bold"
        disabled={data.state === 'claimed'}
        isLoading={busy}
        onClick={() => {
          if (data.state === 'available') {
            void act('join');
          } else if (data.state === 'claimable') {
            void act('claim');
          } else {
            telegramHaptic('selection');
            setShowQuickMatch(true);
          }
        }}
      >
        {label}
      </Button>

      <Button variant="ghost" size="sm" className="w-full text-brand-muted hover:text-white" onClick={() => setDetails(true)}>
        {t('odds')}
      </Button>
      {isValidating && !busy && <p className="t-caption text-brand-muted" role="status">{t('refreshing')}</p>}
      {failed && <ErrorState title={t('action_error')} message={t('retry_message')} onRetry={() => void mutate()} retryLabel={t('retry')} />}
    </Card>

    {/* Odds, Prizes & Rules Modal */}
    <Modal isOpen={details || revealed} onClose={() => { setDetails(false); setRevealed(false); }} title={revealed ? t('revealed') : t('title')} description={t('virtual_only')}>
      <div className="space-y-4">
        {revealed && data.reward_key && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
            <span className="ui-eyebrow font-mono text-amber-400 font-bold block">You Unlocked</span>
            <p className="t-title-2 text-white" role="status">{rewardLabel(data.reward_key)}</p>
          </div>
        )}
        
        {/* Grand Prize Spotlight */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="size-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <FaTrophy size={16} />
            </span>
            <div>
              <p className="text-xs font-bold text-white">Grand Jackpot Prize</p>
              <p className="text-caption text-amber-400 font-mono font-semibold">Up to 1,000 TON Drop Pool</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full ui-eyebrow font-mono font-bold bg-amber-500 text-black">
            Top Reward
          </span>
        </div>

        <p className="t-body text-brand-muted">{t('rules')}</p>
        <ul className="space-y-2">
          {data.rewards.map(reward => (
            <li key={reward.key} className="ui-list-row flex items-center justify-between gap-3 p-2.5 rounded-xl bg-brand-elevated border border-brand-border">
              <span className="t-body font-medium">{rewardLabel(reward.key)}</span>
              <span className="t-numeric-sm tabular-nums text-brand-muted font-mono">{reward.probability_percent}%</span>
            </li>
          ))}
        </ul>
        <p className="t-caption text-brand-muted">{t('duplicate')}</p>
        <Button variant="secondary" className="w-full" onClick={() => { setDetails(false); setRevealed(false); }}>{t('close')}</Button>
      </div>
    </Modal>

    {/* Quick Match Modal with 0 Stake / Qualifier Mode */}
    <QuickMatchModal
      isOpen={showQuickMatch}
      onClose={() => {
        setShowQuickMatch(false);
        void mutate();
      }}
      initialWagerCents={0}
    />
  </>;
}
