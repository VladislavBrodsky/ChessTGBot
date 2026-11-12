'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaUserFriends, FaChessKnight, FaWallet } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import ReferralDashboard from '@/components/ReferralDashboard';
import AiDifficultyDrawer from './AiDifficultyDrawer';
import { apiFetch } from '@/lib/api';
import { logTelemetryEvent } from '@/lib/telemetry';

export function BalanceOpportunity({ stake, source, onTopUp, showTopUp = true, timeControl = 600 }: {
  stake: number; source: string; onTopUp: () => void; showTopUp?: boolean; timeControl?: number;
}) {
  const t = useTranslations('BalanceOpportunity');
  const locale = useLocale();
  const router = useRouter();
  const { walletBalance, loadingBalance, balanceError, syncBalance } = useUser();
  const [view, setView] = useState<'offer' | 'referrals' | 'ai'>('offer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const insufficient = !loadingBalance && !balanceError && Number.isSafeInteger(stake) && stake >= 100 && walletBalance < stake;
  const viewed = useRef(false);
  useEffect(() => {
    if (insufficient && !viewed.current) {
      viewed.current = true;
      logTelemetryEvent('balance_opportunity_view', { source, stake_cents: stake });
    }
  }, [insufficient, source, stake]);
  useEffect(() => {
    if (!insufficient && view === 'offer') return;
    const refresh = () => { if (document.visibilityState === 'visible') void Promise.resolve(syncBalance()).catch(() => undefined); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.clearInterval(timer); };
  }, [syncBalance, insufficient, view]);
  const practice = async (difficulty: string) => {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const res = await apiFetch(`/api/v1/game/create?type=computer&difficulty=${encodeURIComponent(difficulty)}&time_control=${timeControl}&wager=0`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.game_id) throw new Error('Practice unavailable');
      router.push(`/${locale}/game?id=${encodeURIComponent(data.game_id)}`);
    } catch { setError(true); } finally { setBusy(false); }
  };
  return <>
    {insufficient && <Card variant="solid" className="space-y-3 p-4" role="region" aria-label={t('balance_title')}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="t-caption text-brand-muted">{t('balance_title')}</p>
          <p className="t-title-2" role="status">{t('needed', { amount: new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format((stake-walletBalance)/100) })}</p>
        </div>
        <span className="ui-icon-tile ui-icon-tile--info shrink-0" aria-hidden="true"><FaWallet /></span>
      </div>
      {showTopUp && <Button variant="primary" className="w-full" onClick={() => { logTelemetryEvent('balance_opportunity_topup', { source, stake_cents: stake }); onTopUp(); }}>{t('topup')}</Button>}
      <div className="grid grid-cols-2 items-stretch gap-2">
        <Button variant="secondary" aria-label={t('invite')} className="w-full min-w-0" leftIcon={<FaUserFriends aria-hidden="true" className="shrink-0" />} onClick={() => { setView('referrals'); logTelemetryEvent('balance_opportunity_referrals', { source }); }}>{t('invite_short')}</Button>
        <Button variant="ghost" className="w-full min-w-0" leftIcon={<FaChessKnight aria-hidden="true" className="shrink-0" />} onClick={() => setView('ai')}>{t('practice')}</Button>
      </div>
      <p className="t-caption text-brand-muted border-t border-brand-border pt-3">{t('separate')}</p>
    </Card>}
    {view === 'referrals' && <Drawer isOpen layer={110} onClose={() => { setView('offer'); void Promise.resolve(syncBalance()).catch(() => undefined); }} title={t('invite')}>
      <ReferralDashboard />
    </Drawer>}
    {view === 'ai' && <AiDifficultyDrawer layer={110} error={error ? t('failed') : undefined} onClose={() => setView('offer')} onSelect={difficulty => { void practice(difficulty); }} isCreating={busy} />}
  </>;
}
