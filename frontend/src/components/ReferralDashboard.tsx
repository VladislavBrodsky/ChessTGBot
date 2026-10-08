'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaChartLine, FaCopy, FaQrcode, FaShareAlt, FaUsers } from 'react-icons/fa';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ErrorState } from './ui/ErrorState';
import { SkeletonList } from './ui/Skeleton';
import { ActionLink, SectionHeader } from './ui/PageHeader';

interface EarningPoint { date: string; amount: number; }
interface ReferralStats {
  total_referrals: number;
  active_referrals: number;
  total_earnings_usdt: number;
  earnings_chart: EarningPoint[];
}
interface ReferralDashboardProps { referralCode?: string; botUsername?: string; }

function EarningsChart({ data, label }: { data: EarningPoint[]; label: string }) {
  const values = new Map(data.map(point => [point.date, point.amount]));
  const today = new Date();
  const amounts = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (29 - index));
    return Math.max(0, values.get(date.toISOString().slice(0, 10)) || 0);
  });
  const peak = Math.max(0.01, ...amounts);
  const points = amounts.map((amount, index) => `${8 + index * 284 / 29},${80 - amount / peak * 64}`).join(' ');
  return (
    <svg viewBox="0 0 300 88" role="img" aria-label={label} className="h-24 w-full text-brand-action">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Referral metrics come only from /users/referrals/stats; unavailable is never shown as zero. */
export default function ReferralDashboard({ referralCode, botUsername }: ReferralDashboardProps = {}) {
  const t = useTranslations('Referral');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { stats: user, syncStats } = useUser();
  const { data, error, isLoading, mutate } = useSWRFetch<ReferralStats>('/api/v1/users/referrals/stats');
  const [copied, setCopied] = useState(false);
  const referralStats = data && Number.isFinite(data.total_referrals) && Number.isFinite(data.active_referrals) && Number.isFinite(data.total_earnings_usdt) ? data : null;

  const code = user?.referral_code || referralCode || '';
  const validCode = /^[A-Za-z0-9_-]{1,64}$/.test(code);
  const bot = (user?.bot_username || botUsername || process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').replace(/^@+/, '');
  const inviteLink = `https://t.me/${bot}?start=ref_${code}`;

  const copyInvite = async () => {
    if (!validCode) return;
    if (await copyToClipboard(inviteLink)) {
      setCopied(true);
      telegramHaptic('success');
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInvite = () => {
    if (!validCode) return;
    telegramHaptic('selection');
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section aria-labelledby="referrals-heading" className="w-full space-y-4">
      <SectionHeader id="referrals-heading" title={t('dashboard_title')} />

      {!referralStats && (error || !isLoading) ? (
        <ErrorState title={ti('load_failed')} message={ti('load_failed')} onRetry={() => mutate()} retryLabel={ti('retry')} />
      ) : !referralStats && isLoading ? (
        <SkeletonList count={3} />
      ) : referralStats ? <>
        <div className="grid grid-cols-2 gap-3">
          <Card variant="solid" className="p-4">
            <FaUsers className="mb-3 text-brand-muted" size={18} aria-hidden="true" />
            <p className="text-2xl font-semibold tabular-nums">{referralStats.total_referrals.toLocaleString(locale)}</p>
            <p className="mt-1 text-caption text-brand-muted">{t('total_label')}</p>
          </Card>
          <Card variant="solid" className="p-4">
            <FaUsers className="mb-3 text-brand-action" size={18} aria-hidden="true" />
            <p className="text-2xl font-semibold tabular-nums">{referralStats.active_referrals.toLocaleString(locale)}</p>
            <p className="mt-1 text-caption text-brand-muted">{t('active_label')}</p>
          </Card>
          <Card variant="solid" className="col-span-2 p-4">
            <p className="text-2xl font-semibold tabular-nums">{referralStats.total_earnings_usdt.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</p>
            <p className="mt-1 text-caption text-brand-muted">{t('earnings_label')}</p>
          </Card>
        </div>
        {Array.isArray(referralStats.earnings_chart) && referralStats.earnings_chart.length > 0 && (
          <Card variant="solid" className="p-4">
            <div className="mb-2 flex items-center gap-2 text-caption font-medium text-brand-muted"><FaChartLine aria-hidden="true" />{t('chart_label')}</div>
            <EarningsChart data={referralStats.earnings_chart} label={t('chart_label')} />
          </Card>
        )}
      </> : null}

      {validCode ? <Card variant="solid" className="space-y-4 p-4">
        <div>
          <h3 className="text-base font-semibold">{t('your_link')}</h3>
          <p className="mt-1 break-all text-caption text-brand-muted">{inviteLink}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={copyInvite} leftIcon={<FaCopy />} className="w-full">{copied ? t('copied') : t('copy')}</Button>
          <Button variant="secondary" onClick={shareInvite} leftIcon={<FaShareAlt />} className="w-full">{t('share_invite')}</Button>
        </div>
        <ActionLink href={`/${locale}/qr?code=${encodeURIComponent(code)}`} icon={<FaQrcode />}>{t('invite_qr_alt')}</ActionLink>
      </Card> : <ErrorState title={t('your_link')} message={ti('load_failed')} onRetry={() => syncStats()} retryLabel={ti('retry')} />}
    </section>
  );
}
