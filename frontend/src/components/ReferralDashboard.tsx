'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  FaChartLine,
  FaCheck,
  FaCopy,
  FaFire,
  FaQrcode,
  FaShareAlt,
  FaUsers,
} from 'react-icons/fa';
import { FiArrowRight } from 'react-icons/fi';
import { GramAmount, GramMark } from '@/components/ui/GramAmount';
import { useUser } from '@/context/UserContext';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { telegramHaptic } from '@/lib/telegram';
import { mainMiniAppLink, shareInvitation } from '@/lib/invitations';
import { logTelemetryEvent } from '@/lib/telemetry';
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
  reward_terms?: { required_games: number; referrer_bonus_cents: number; gram_reward_nano: string; gram_requires_deposit: boolean; daily_bonus_cap: number };
  milestone_progress?: { joined: number; pending_activity: number; qualified: number; usdt_credited: number; gram_credited: number };
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
  const offer = useTranslations('BalanceOpportunity');
  const inviteText = useTranslations('Invitations');
  const tg = useTranslations('Gram');
  const ti = useTranslations('Index');
  const locale = useLocale();
  const { stats: user, syncStats, syncBalance } = useUser();
  const { data, error, isLoading, mutate } = useSWRFetch<ReferralStats>('/api/v1/users/referrals/stats', { refreshInterval: 30000, revalidateOnFocus: true });
  const [feedback, setFeedback] = useState('');
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') { void Promise.resolve(mutate()).catch(() => undefined); void Promise.resolve(syncBalance?.()).catch(() => undefined); } };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [mutate, syncBalance]);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const referralStats = data && Number.isFinite(data.total_referrals) && Number.isFinite(data.active_referrals) && Number.isFinite(data.total_earnings_usdt) ? data : null;

  const code = user?.referral_code || referralCode || '';
  const validCode = /^[A-Za-z0-9_-]{1,60}$/.test(code);
  const bot = (user?.bot_username || botUsername || process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').replace(/^@+/, '');
  const inviteLink = validCode ? mainMiniAppLink(bot, `ref_${code}`) : '';

  const copyInvite = async () => {
    if (!validCode) return;
    logTelemetryEvent('referral_copy', { source: 'referral_dashboard' });
    if (await copyToClipboard(inviteLink)) {
      setFeedback('');
      setCopied(true);
      telegramHaptic('success');
      window.setTimeout(() => setCopied(false), 2000);
    } else { setFeedback(offer('copy_failed')); }
  };

  const shareInvite = () => {
    if (!validCode) return;
    telegramHaptic('selection');
    try {
      if (shareInvitation(inviteLink, inviteText('referral_share_text')) === false) throw new Error('Share blocked');
      setFeedback(offer('share_opened'));
      logTelemetryEvent('referral_share_opened', { source: 'referral_dashboard' });
    } catch { setFeedback(offer('share_failed')); }
  };

  return (
    <section aria-labelledby="referrals-heading" className="w-full space-y-3.5">
      <SectionHeader id="referrals-heading" title={t('dashboard_title')} />

      <Card variant="solid" className="space-y-3 p-4">
        {referralStats?.reward_terms && <p className="t-body">{offer('bonus', { amount: (referralStats.reward_terms.referrer_bonus_cents / 100).toFixed(2), cap: referralStats.reward_terms.daily_bonus_cap })}</p>}
        {typeof referralStats?.qualifying_min_moves === 'number' && <p className="t-caption text-brand-muted">{offer('terms', { moves: referralStats.qualifying_min_moves })}</p>}
        {typeof referralStats?.qualifying_min_moves !== 'number' && <ol className="list-decimal ps-5 t-caption text-brand-muted">
          <li>{tg('referral_step_join')}</li><li>{tg('referral_step_deposit')}</li><li>{tg('referral_step_matches')}</li>
        </ol>}
        <p className="t-caption text-brand-muted">{offer('separate')}</p>
        <p className="t-caption text-brand-muted">{offer('delayed')}</p>

      </Card>
      {error && referralStats && <p role="status" className="t-caption text-brand-danger">{offer('failed')}</p>}
      {feedback && <p role="status" className="t-caption text-brand-muted">{feedback}</p>}
      {/* Invite Hub & Action Controls */}
      {validCode ? <Card variant="solid" className="space-y-3.5 p-3.5 sm:p-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="t-title-3">{t('your_link')}</h3>

          </div>
          <div
            onClick={copyInvite}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyInvite(); } }}
            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-brand-elevated border border-brand-border cursor-pointer hover:border-brand-border-opacity-30 transition-colors"
          >
            <p className="selectable truncate font-mono text-caption text-brand-primary flex-1" dir="ltr">{inviteLink}</p>
            <span className="shrink-0 text-brand-muted hover:text-brand-primary transition-colors p-1" aria-hidden="true">
              {copied ? <FaCheck className="text-brand-action" size={14} /> : <FaCopy size={14} />}
            </span>
          </div>
        </div>

        {/* Primary Action Button: Telegram Share with Action Emerald Sheen */}
        <Button
          variant="action"
          size="lg"
          onClick={shareInvite}
          leftIcon={<FaShareAlt size={16} />}
          className="w-full text-base font-semibold"
        >
          {t('share_now')}
        </Button>

        {/* Secondary Action: Quick Copy */}
        <Button
          variant="secondary"
          onClick={copyInvite}
          leftIcon={copied ? <FaCheck className="text-brand-action" /> : <FaCopy />}
          className="w-full"
        >
          {copied ? t('copied') : t('copy')}
        </Button>

        {/* In-App QR Code Trigger Action Link */}
        <button
          type="button"
          onClick={() => {
            telegramHaptic('selection');
            setShowQrModal(true);
          }}
          className="ui-action-link w-full text-start"
        >
          <span className="shrink-0 text-xl text-brand-action" aria-hidden="true"><FaQrcode /></span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-brand-primary">{t('qr_code_button')}</p>
            <p className="text-caption text-brand-muted">{t('qr_code_sub')}</p>
          </div>
          <span className="text-brand-muted" aria-hidden="true"><FiArrowRight size={18} className="rtl:rotate-180" /></span>
        </button>
      </Card> : <ErrorState title={t('your_link')} message={ti('load_failed')} onRetry={() => syncStats()} retryLabel={ti('retry')} />}

      {referralStats?.milestone_progress && <Card variant="solid" className="space-y-4 p-4" role="region" aria-label={offer('progress_title')}>
        <h3 className="t-title-3">{offer('progress_title')}</h3>
        <dl className="grid grid-cols-3 gap-2">
          {([
            ['stage_joined', 'joined', referralStats.milestone_progress.joined],
            ['stage_pending', 'pending', referralStats.milestone_progress.pending_activity],
            ['stage_qualified', 'qualified', referralStats.milestone_progress.qualified],
          ] as const).map(([label, accessible, count]) => <div key={label} className="min-w-0 space-y-1 rounded-control bg-brand-elevated p-3">
            <dt className="t-caption text-brand-muted break-words" aria-label={offer(accessible)}>{offer(label)}</dt>
            <dd className="t-numeric-lg">{count.toLocaleString(locale)}</dd>
          </div>)}
        </dl>
        <div className="space-y-2 border-t border-brand-border pt-3">
          <p className="t-caption text-brand-muted">{offer('issued_title')}</p>
          <dl className="grid grid-cols-2 gap-3">
            {([
              ['usdt_credited', referralStats.milestone_progress.usdt_credited],
              ['gram_credited', referralStats.milestone_progress.gram_credited],
            ] as const).map(([label, count]) => <div key={label} className="min-w-0 space-y-1">
              <dt className="t-caption text-brand-muted">{offer(label)}</dt>
              <dd className="t-numeric-lg">{count.toLocaleString(locale)}</dd>
            </div>)}
          </dl>
        </div>
      </Card>}
      {!referralStats && (error || !isLoading) ? (
        <ErrorState title={ti('load_failed')} message={ti('load_failed')} onRetry={() => mutate()} retryLabel={ti('retry')} />
      ) : !referralStats && isLoading ? (
        <SkeletonList count={3} />
      ) : referralStats ? <>
        {/* Bento Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="ui-stat">
            <div className="flex items-center justify-between w-full">
              <span className="t-eyebrow text-brand-muted">{t('total_label')}</span>
              <FaUsers className="text-brand-muted" size={14} aria-hidden="true" />
            </div>
            <p className="ui-stat__value">{referralStats.total_referrals.toLocaleString(locale)}</p>
            <p className="ui-stat__meta">{t('total_sublabel')}</p>
          </div>
          <div className="ui-stat ui-stat--accent">
            <div className="flex items-center justify-between w-full">
              <span className="t-eyebrow text-brand-action flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-action animate-pulse" />
                {t('active_label')}
              </span>
              <FaFire className="text-brand-action" size={14} aria-hidden="true" />
            </div>
            <p className="ui-stat__value text-brand-primary">{referralStats.active_referrals.toLocaleString(locale)}</p>
            <p className="ui-stat__meta">{t('active_sublabel')}</p>
          </div>
          <div className="ui-stat ui-stat--gold">
            <div className="flex items-center justify-between w-full">
              <span className="t-eyebrow text-brand-gold">{t('earnings_label')}</span>
              <FaChartLine className="text-brand-gold" size={14} aria-hidden="true" />
            </div>
            <p className="ui-stat__value whitespace-nowrap text-brand-primary">
              <bdi>{formatUsd(Math.round(referralStats.total_earnings_usdt * 100))}</bdi>
              <span className="sr-only"> USDT</span>
            </p>
            <p className="ui-stat__meta">{t('scale_stat_settlement')}</p>
          </div>
        </div>

        {/* Qualification Quest Card */}
        <Card variant="solid" className="space-y-3 p-3.5 sm:p-4">
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
            {typeof referralStats.gram_rewarded_referrals === 'number' && (
              <p className="t-caption text-end text-brand-muted font-medium">
                {tg('referral_qualified', { count: referralStats.gram_rewarded_referrals })}
              </p>
            )}
          </div>
        </Card>

        {Array.isArray(referralStats.earnings_chart) && referralStats.earnings_chart.length > 0 && (
          <Card variant="solid" className="p-3">
            <div className="mb-1 flex items-center gap-2 text-caption font-medium text-brand-muted"><FaChartLine aria-hidden="true" />{t('chart_label')}</div>
            <EarningsChart data={referralStats.earnings_chart} label={t('chart_label')} />
          </Card>
        )}
      </> : null}

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
