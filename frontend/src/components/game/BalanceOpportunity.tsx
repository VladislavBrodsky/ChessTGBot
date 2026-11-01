'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
    const refresh = () => { if (document.visibilityState === 'visible') void Promise.resolve(syncBalance()).catch(() => undefined); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.clearInterval(timer); };
  }, [syncBalance]);
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
    {insufficient && <Card variant="solid" className="space-y-3 p-4">
      <p className="t-body" role="status">{t('shortfall', { amount: new Intl.NumberFormat(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format((stake-walletBalance)/100) })}</p>
      {showTopUp && <Button variant="primary" className="w-full" onClick={() => { logTelemetryEvent('balance_opportunity_topup', { source, stake_cents: stake }); onTopUp(); }}>{t('topup')}</Button>}
      <Button variant="secondary" className="w-full" onClick={() => { setView('referrals'); logTelemetryEvent('balance_opportunity_referrals', { source }); }}>{t('invite')}</Button>
      <p className="t-caption text-brand-muted">{t('separate')}</p>
      <Button variant="ghost" className="w-full" onClick={() => setView('ai')}>{t('practice')}</Button>
    </Card>}
    {view === 'referrals' && <Drawer isOpen layer={110} onClose={() => { setView('offer'); void Promise.resolve(syncBalance()).catch(() => undefined); }} title={t('invite')}>
      <ReferralDashboard />
    </Drawer>}
    {view === 'ai' && <AiDifficultyDrawer layer={110} error={error ? t('failed') : undefined} onClose={() => setView('offer')} onSelect={difficulty => { void practice(difficulty); }} isCreating={busy} />}
  </>;
}
