'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FaChartLine, FaCopy, FaQrcode, FaShareAlt, FaUsers } from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { GramAmount, GramMark } from '@/components/ui/GramAmount';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';
import { mainMiniAppLink, shareInvitation } from '@/lib/invitations';
import { copyToClipboard } from '@/lib/clipboard';
import { formatUsd } from '@/lib/settlement';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ErrorState } from './ui/ErrorState';
import { SkeletonList } from './ui/Skeleton';
import { SectionHeader } from './ui/PageHeader';
import { ReferralQrModal } from './ReferralQrModal';

interface EarningPoint { date: string; amount: number; }
interface ReferralStats {
  qualifying_min_moves?: number;
  gram_rewards_nano?: string;
  gram_rewarded_referrals?: number;
  total_referrals: number;
  activated_referrals?: number;
  activation_rate?: number;
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
    <svg viewBox="0 0 300 88" role="img" aria-label={label} className="h-16 w-full text-brand-action">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Referral metrics come only from /users/referrals/stats; unavailable is never shown as zero. */
export default function ReferralDashboard({ referralCode, botUsername }: ReferralDashboardProps = {}) {
  const t = useTranslations('Referral');
  const inviteText = useTranslations('Invitations');
  const tg = useTranslations('Gram');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { stats: user, syncStats } = useUser();
  const { data, error, isLoading, mutate } = useSWRFetch<ReferralStats>('/api/v1/users/referrals/stats');
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const referralStats = data && Number.isFinite(data.total_referrals) && Number.isFinite(data.active_referrals) && Number.isFinite(data.total_earnings_usdt) ? data : null;

  const code = user?.referral_code || referralCode || '';
  const validCode = /^[A-Za-z0-9_-]{1,60}$/.test(code);
  const bot = (user?.bot_username || botUsername || process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').replace(/^@+/, '');
  const inviteLink = validCode ? mainMiniAppLink(bot, `ref_${code}`) : '';

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
    shareInvitation(inviteLink, inviteText('share_text'));
  };

  return (
    <section aria-labelledby="referrals-heading" className="w-full space-y-3">
      <SectionHeader id="referrals-heading" title={t('dashboard_title')} />

      {!referralStats && (error || !isLoading) ? (
        <ErrorState title={ti('load_failed')} message={ti('load_failed')} onRetry={() => mutate()} retryLabel={ti('retry')} />
      ) : !referralStats && isLoading ? (
        <SkeletonList count={3} />
      ) : referralStats ? <>
        <div className="grid grid-cols-3 gap-2">
          <div className="ui-stat">
            <FaUsers className="text-brand-muted" size={14} aria-hidden="true" />
            <p className="ui-stat__value">{referralStats.total_referrals.toLocaleString(locale)}</p>
            <p className="ui-stat__meta">{t('total_label')}</p>
          </div>
          <div className="ui-stat ui-stat--accent">
            <FaUsers className="text-brand-action" size={14} aria-hidden="true" />
            <p className="ui-stat__value">{referralStats.active_referrals.toLocaleString(locale)}</p>
            <p className="ui-stat__meta">{t('active_label')}</p>
          </div>
          <div className="ui-stat">
            <FaChartLine className="text-brand-muted" size={14} aria-hidden="true" />
            <p className="ui-stat__value whitespace-nowrap"><bdi>{formatUsd(Math.round(referralStats.total_earnings_usdt * 100))}</bdi><span className="sr-only"> USDT</span></p>
            <p className="ui-stat__meta">{t('earnings_label')}</p>
          </div>
        </div>
        <Card variant="solid" className="space-y-3 p-3">
          <div className="flex items-start gap-3">
            <span className="ui-icon-tile ui-icon-tile--info shrink-0"><GramMark className="h-5 w-5" /></span>
            <div className="min-w-0 space-y-0.5">
              <h3 className="t-title-3">{tg('referral_reward')}</h3>
              <p className="t-caption text-brand-muted">{tg('referral_credited_once')}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="t-eyebrow text-brand-muted">{tg('referral_needs')}</p>
            <ol className="ui-steps">
              <li><span>{tg('referral_step_join')}</span></li>
              <li><span>{tg('referral_step_deposit')}</span></li>
              <li>
                <span>
                  {tg('referral_step_matches')}
                  {typeof referralStats.qualifying_min_moves === 'number' && <span className="ui-steps__hint">{tg('referral_minimum', { moves: referralStats.qualifying_min_moves })}</span>}
                </span>
              </li>
            </ol>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-brand-border pt-3">
            <div className="min-w-0">
              <p className="t-caption text-brand-muted">{tg('referral_earned')}</p>
              <GramAmount nano={referralStats.gram_rewards_nano} className="t-numeric text-brand-primary" />
            </div>
            {typeof referralStats.gram_rewarded_referrals === 'number' && <p className="t-caption text-end text-brand-muted">{tg('referral_qualified', { count: referralStats.gram_rewarded_referrals })}</p>}
          </div>
        </Card>
        {Array.isArray(referralStats.earnings_chart) && referralStats.earnings_chart.length > 0 && (
          <Card variant="solid" className="p-3">
            <div className="mb-1 flex items-center gap-2 text-caption font-medium text-brand-muted"><FaChartLine aria-hidden="true" />{t('chart_label')}</div>
            <EarningsChart data={referralStats.earnings_chart} label={t('chart_label')} />
          </Card>
        )}
      </> : null}

      {validCode ? <Card variant="solid" className="space-y-3 p-3">
        <div className="min-w-0">
          <h3 className="t-title-3">{t('your_link')}</h3>
          <p className="selectable mt-0.5 truncate text-caption text-brand-muted" dir="ltr">{inviteLink}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={copyInvite} leftIcon={<FaCopy />} className="w-full">{copied ? t('copied') : t('copy')}</Button>
          <Button variant="secondary" onClick={shareInvite} leftIcon={<FaShareAlt />} className="w-full">{t('share_invite')}</Button>
        </div>
        <button
          type="button"
          onClick={() => {
            telegramHaptic('selection');
            setShowQrModal(true);
          }}
          className="ui-action-link w-full text-start"
        >
          <span className="shrink-0 text-xl text-brand-action" aria-hidden="true"><FaQrcode /></span>
          <span className="min-w-0 flex-1">{t('invite_qr_alt')}</span>
          <span className="text-brand-muted" aria-hidden="true"><FiArrowRight size={18} className="rtl:rotate-180" /></span>
        </button>
      </Card> : <ErrorState title={t('your_link')} message={ti('load_failed')} onRetry={() => syncStats()} retryLabel={ti('retry')} />}

      {validCode && (
        <ReferralQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          inviteLink={inviteLink}
          botUsername={bot}
          code={code}
        />
      )}
    </section>
  );
}
