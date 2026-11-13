'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BalanceOpportunity } from './BalanceOpportunity';
import { SnapPicker } from '@/components/ui/SnapPicker';
import { formatUsd, winnerCents } from '@/lib/settlement';
import { TIME_CONTROLS } from './lobby/BetSlip';

interface Props {
  onClose: () => void;
  onCreate: (wager: number, timeControl: number) => void;
  onTopUp: (stake: number, time: number) => void;
  initialTime: number;
  initialWager: number;
  walletBalance: number;
  loadingBalance: boolean;
  balanceError: boolean;
  isCreating: boolean;
  error?: string;
  initialMode?: 'free' | 'paid';
}

export default function FriendChallengeDrawer(p: Props) {
  const t = useTranslations('Game');
  const [time, setTime] = useState(p.initialTime);
  const [stakeInput, setStakeInput] = useState(((Number.isFinite(p.initialWager) && p.initialWager >= 100 ? p.initialWager : 500) / 100).toFixed(2));
  const stake = /^\d+(?:\.\d{1,2})?$/.test(stakeInput) ? Math.round(Number(stakeInput) * 100) : 0;
  const invalidStake = (!Number.isSafeInteger(stake) || stake < 100);
  const balanceUnavailable = (p.loadingBalance || p.balanceError);
  const insufficientBalance = !balanceUnavailable && !invalidStake && stake > p.walletBalance;
  const canCreate = !p.isCreating && !invalidStake && !balanceUnavailable && !insufficientBalance;

  return <Drawer isOpen onClose={p.onClose} title={t('friend_setup_title')} description={t('friend_setup_description')}
    footer={insufficientBalance ? undefined : <Button variant="primary" className="w-full" disabled={!canCreate} isLoading={p.isCreating}
      onClick={() => p.onCreate(stake, time)}>
      {t('friend_create_staked', { amount: formatUsd(stake) })}
    </Button>}>


    <div className="space-y-3">
      <Input label={t('friend_stake_amount')} inputMode="decimal" value={stakeInput} onChange={event => setStakeInput(event.target.value)}
        error={invalidStake ? t('lobby_min_stake', { amount: '$1.00' }) : undefined} />
      <div className="flex flex-wrap gap-2" aria-label={t('friend_stake_amount')}>
        {[100, 500, 1000, 2500].map(cents => <Button key={cents} variant="secondary" size="sm" onClick={() => setStakeInput((cents / 100).toFixed(2))}>{formatUsd(cents)}</Button>)}
      </div>
    </div>

    <SnapPicker id="friend-time" label={t('time_control')} value={time} onChange={setTime}
      options={TIME_CONTROLS.map(seconds => ({ value: seconds, label: `${seconds / 60}m` }))} itemWidth={68} />

    <Card variant="solid" className="space-y-2 p-4">
      <p className="text-sm text-brand-primary">{t('friend_terms_paid', { stake: formatUsd(stake), minutes: time / 60 })}</p>
      <p className="text-sm text-brand-muted">{t('friend_payout', { amount: formatUsd(winnerCents(stake)) })}</p>
      <p className="text-sm text-brand-muted">{t('friend_stake_disclosure')}</p>
      <p className="text-sm text-brand-muted">{t('friend_expiry_notice')}</p>
    </Card>

    {balanceUnavailable && <p role="alert" className="text-sm text-brand-muted">{t('friend_balance_unavailable')}</p>}
    <BalanceOpportunity stake={stake} source="friend_challenge" timeControl={time} onTopUp={() => p.onTopUp(stake, time)} />
    {p.error && <p role="alert" className="text-sm text-brand-danger">{p.error}</p>}
  </Drawer>;
}
