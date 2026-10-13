'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FiGift, FiInfo } from 'react-icons/fi';
import { apiFetch, sendTelemetryEvent } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';

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
  const tReferral = useTranslations('Referral');
  const locale = useLocale();
  const router = useRouter();
  const { stats, syncStats } = useUser();
  const { data, error, isValidating, mutate } = useSWR(stats ? PATH : null, readQuest, { errorRetryCount: 1 });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [details, setDetails] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const referralCode = stats?.referral_code;
  const canShare = typeof referralCode === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(referralCode);

  function shareInvite() {
    if (!canShare || !referralCode) return;
    const bot = (stats?.bot_username || process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').replace(/^@+/, '');
    if (!/^[A-Za-z0-9_]{5,32}$/.test(bot)) return;
    const inviteLink = `https://t.me/${bot}?start=ref_${referralCode}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`;
    telegramHaptic('selection');
    void sendTelemetryEvent('engagement_quest_share', { campaign_id: 'first-three-v1' });
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  }

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
          <span className="ui-icon-tile ui-icon-tile--gold">
            <FiGift size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="engagement-title" className="t-title-3 truncate">{t('title')}</h2>
            <p className="t-caption text-brand-muted">{t('subtitle')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            telegramHaptic('selection');
            setDetails(true);
          }}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-brand-elevated/80 border border-brand-border text-brand-muted hover:text-white hover:border-brand-action/40 transition-all text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
          aria-label={t('odds')}
        >
          <FiInfo size={13} className="text-brand-action" aria-hidden="true" />
          <span>{t('brief')}</span>
        </button>
      </div>

      <p className="t-body text-brand-muted">{t('description')}</p>
      
      <div className="space-y-1.5">
        <div className="flex items-center gap-3" role="progressbar" aria-label={t('progress', { count: data.progress, total: data.target })} aria-valuemin={0} aria-valuemax={data.target} aria-valuenow={data.progress}>
          <div className="grid flex-1 grid-cols-3 gap-2" aria-hidden="true">
            {Array.from({ length: data.target }, (_, i) => (
              <span
                key={i}
                className={`h-2 rounded-pill transition-all duration-300 ${
                  i < data.progress
                    ? 'bg-brand-action shadow-xs'
                    : 'bg-brand-elevated border border-brand-border/80'
                }`}
              />
            ))}
          </div>
          <span className="t-numeric-sm tabular-nums font-bold text-white shrink-0">
            {data.progress}/{data.target}
          </span>
        </div>
        <p className="t-caption text-brand-muted text-right font-medium" aria-live="polite">
          {busy ? t('loading') : data.state === 'claimed' && data.reward_key ? rewardLabel(data.reward_key) : data.state === 'active' ? t('remaining', { count: data.target - data.progress }) : t('qualification')}
        </p>
      </div>

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
            router.push(`/${locale}/game`);
          }
        }}
      >
        {label}
      </Button>

      {data.state === 'claimed' && canShare && (
        <Button variant="secondary" className="w-full" onClick={shareInvite}>
          {tReferral('share_invite')}
        </Button>
      )}

      {isValidating && !busy && <p className="t-caption text-brand-muted" role="status">{t('refreshing')}</p>}
      {failed && <ErrorState title={t('action_error')} message={t('retry_message')} onRetry={() => void mutate()} retryLabel={t('retry')} />}
    </Card>

    {/* Odds, Prizes & Rules Modal */}
    <Modal isOpen={details || revealed} onClose={() => { setDetails(false); setRevealed(false); }} title={revealed ? t('revealed') : t('title')} description={t('virtual_only')}>
      <div className="space-y-4">
        {revealed && data.reward_key && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
            <span className="ui-eyebrow text-brand-muted block">{t('revealed')}</span>
            <p className="t-title-2 text-white" role="status">{rewardLabel(data.reward_key)}</p>
          </div>
        )}
        
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

  </>;
}
