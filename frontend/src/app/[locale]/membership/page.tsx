'use client';

import { Badge, BadgeRow } from '@/components/ui/Badge';
 
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { useAnimationsEnabled } from "@/hooks/useAnimationsEnabled";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/Button";
import Confetti from "react-confetti";
import TierComparison from "@/components/TierComparison";
import { apiFetch } from "@/lib/api";
import { useLocale, useTranslations } from 'next-intl';
import { telegramAlert, telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import { DepositDialog as DepositModal } from '@/components/Wallet/WalletDialogs';
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';

const stripEmojis = (str: string): string => {
  if (!str) return "";
  return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
};

/* ─── Ultra-Premium Gold Themed SVG Icons ─────────────────────────────────── */
const IconBoost = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconReferral = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="18" cy="7" r="2"/>
    <path d="M3 21v-2a5 5 0 0 1 5-5h3"/>
    <path d="M15 14l2 2 4-4"/>
  </svg>
);
const IconThemes = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 2a5 5 0 0 1 5 5c0 5-5 9-5 9S7 12 7 7a5 5 0 0 1 5-5z"/>
    <circle cx="12" cy="7" r="2"/>
  </svg>
);
const IconAcademy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M2 10l10-6 10 6-10 6-10-6z"/>
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>
  </svg>
);
const IconWager = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);


import VIPConfirmSheet from "@/components/Membership/VIPConfirmSheet";
import { FaCrown } from 'react-icons/fa';

export default function MembershipPage() {
  const locale = useLocale();
  const tm = useTranslations('Membership');
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');

  useNavbarHideWhileMounted();
  const animations = useAnimationsEnabled();

  const FEATURES = [
    { icon: <IconBoost />,    title: tm('premium_boost'),   desc: tm('premium_boost_desc')   },
    { icon: <IconReferral />, title: tm('priority_match'),  desc: tm('priority_match_desc')  },
    { icon: <IconWager />,    title: tm('wager_title'),      desc: tm('wager_desc')           },
    { icon: <IconThemes />,   title: tm('elite_skins'),     desc: tm('elite_skins_desc')     },
    { icon: <IconAcademy />,  title: tm('engine_analysis'), desc: tm('engine_analysis_desc') },
  ];

  const MONTHLY_CENTS = 2900;
  const ANNUAL_CENTS  = 29580;

  const { walletBalance, walletAddress, syncBalance, stats, syncStats, balanceError, loadingBalance } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 400, height: 600 });
  const [submitting, setSubmitting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [confirmingXpUpgrade, setConfirmingXpUpgrade] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        setShowDepositModal(true);
      }
    }
  }, []);

  const cost = billingPeriod === 'annual' ? ANNUAL_CENTS : MONTHLY_CENTS;

  const handleXpUpgrade = () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 5000) {
      telegramHaptic('error');
      telegramAlert(tm('xp_upgrade_alert', { xp: currentXp }));
      return;
    }
    setConfirmingXpUpgrade(true);
  };

  const handleConfirmXpUpgrade = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        telegramHaptic('success');
        setShowSuccess(true);
        setShowConfetti(true);
        setConfirmingXpUpgrade(false);
        syncStats();
      } else {
        telegramHaptic('error');
        telegramAlert(data.detail || tm('failed_xp_upgrade'));
        setConfirmingXpUpgrade(false);
      }
    } catch {
      telegramHaptic('error');
      telegramAlert(tm('upgrade_failed'));
      setConfirmingXpUpgrade(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageSubscription = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/wallet/stripe/portal", {
        method: "POST",
        body: JSON.stringify({ redirect_path: "/membership" })
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        telegramHaptic('error');
        telegramAlert(data.detail || tm('upgrade_failed'));
        setSubmitting(false);
      }
    } catch {
      telegramHaptic('error');
      telegramAlert(tm('upgrade_failed'));
      setSubmitting(false);
    }
  };

  // Upgrade Stripe subscription monthly → annual via Stripe.Subscription.modify()
  const handleUpgradeStripe = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/wallet/stripe/upgrade", {
        method: "POST",
        body: JSON.stringify({ billing_period: "annual" })
      });
      const data = await res.json();
      if (res.ok && data.status === "upgraded") {
        telegramHaptic('success');
        setShowSuccess(true);
        setShowConfetti(true);
        syncStats();
      } else {
        telegramHaptic('error');
        telegramAlert(data.detail || tm('upgrade_failed'));
      }
    } catch {
      telegramHaptic('error');
      telegramAlert(tm('upgrade_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // Upgrade balance subscription monthly → annual (prorated)
  const handleUpgradeBalance = async () => {
    if (submitting) return;
    if (balanceError || loadingBalance) {
      telegramHaptic('warning');
      if (balanceError) void syncBalance();
      return;
    }

    // Calculate prorated upgrade cost
    const now = Date.now();
    const expiresAt = stats?.premium_expires_at ? new Date(stats.premium_expires_at).getTime() : now;
    const remainingDays = Math.max((expiresAt - now) / 86400000, 0);
    const unusedCredit = Math.floor(remainingDays * (2900 / 30)); // cents
    const upgradeCost = Math.max(29580 - unusedCredit, 0);

    if (walletBalance < upgradeCost) {
      telegramHaptic('warning');
      setShowInsufficient(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/users/subscribe", {
        method: "POST",
        body: JSON.stringify({ tier: 'premium', billing_period: 'annual' })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        telegramHaptic('success');
        setShowSuccess(true);
        setShowConfetti(true);
        syncStats();
        await syncBalance();
      } else {
        telegramHaptic('error');
        if (data.detail?.toLowerCase().includes("insufficient")) setShowInsufficient(true);
        else telegramAlert(data.detail || tm('upgrade_failed'));
      }
    } catch {
      telegramHaptic('error');
      telegramAlert(tm('upgrade_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubscribeStripe = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/wallet/stripe/subscribe", {
        method: "POST",
        body: JSON.stringify({ billing_period: billingPeriod, redirect_path: "/membership" })
      });
      const data = await res.json();
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        telegramHaptic('error');
        telegramAlert(data.detail || tm('upgrade_failed'));
        setSubmitting(false);
      }
    } catch {
      telegramHaptic('error');
      telegramAlert(tm('upgrade_failed'));
      setSubmitting(false);
    }
  };

  const handleSubscribeBalance = async () => {
    if (submitting) return;
    if (balanceError || loadingBalance) {
      telegramHaptic('warning');
      if (balanceError) void syncBalance();
      return;
    }
    if (walletBalance < cost) { telegramHaptic('warning'); setShowInsufficient(true); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/users/subscribe", {
        method: "POST",
        body: JSON.stringify({ tier: 'premium', billing_period: billingPeriod })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        telegramHaptic('success'); setShowSuccess(true); setShowConfetti(true);
        syncStats(); await syncBalance();
      } else {
        telegramHaptic('error');
        if (data.detail?.toLowerCase().includes("insufficient")) setShowInsufficient(true);
        else telegramAlert(data.detail || tm('upgrade_failed'));
      }
    } catch { telegramHaptic('error'); telegramAlert(tm('upgrade_failed')); }
    finally { setSubmitting(false); }
  };

  return (
    <LayoutWrapper className="w-full relative">

      <main className="app-page app-page--focused">

        {/* Hero with Gold Accents */}
        <PageHeader icon={<FaCrown />} tone="premium" title={stripEmojis(tm('title'))} description={tm('subtitle')} backHref={`/${locale}/settings`} />

        {/* ── Active membership badge ──────────────────────────── */}
        {stats?.is_premium && stats.premium_expires_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-brand-surface border border-brand-border-opacity-20 rounded-[20px] p-4 flex items-center gap-3 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-caption font-semibold normal-case tracking-normal text-emerald-500">{tm('active_membership')}</span>
              <span className="text-sm font-bold text-brand-primary">
                {tc('expires')} {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Pricing Selector (Cards Side-by-Side) ─────────────── */}
        <div className="grid grid-cols-2 gap-3 w-full max-[350px]:grid-cols-1">
          {/* Monthly Card */}
          <button type="button"
            onClick={() => { telegramHaptic('selection'); setBillingPeriod('monthly'); }}
            aria-pressed={billingPeriod === 'monthly'}
            className={`ui-tap-target p-4 rounded-2xl text-start transition-all flex flex-col justify-between gap-3 min-h-32 border ${
              billingPeriod === 'monthly'
                ? "bg-brand-elevated border-brand-primary/50 text-brand-primary shadow-sm"
                : "bg-brand-surface border-brand-border text-brand-muted hover:border-brand-border-opacity-30"
            }`}
          >
            <BadgeRow>
              <span className="text-caption font-semibold text-brand-muted">{tm('monthly')}</span>
              {stats?.is_premium && (stats.premium_billing_period || 'monthly') === 'monthly' && <Badge>{tc('current_plan')}</Badge>}
            </BadgeRow>
            <div className="space-y-0.5">
              <p className="t-numeric-lg"><bdi>${(MONTHLY_CENTS / 100).toFixed(2)}</bdi></p>
              <p className="t-caption text-brand-muted">{tm('per_month')}</p>
            </div>
          </button>

          {/* Annual Card */}
          <button type="button"
            onClick={() => { telegramHaptic('selection'); setBillingPeriod('annual'); }}
            aria-pressed={billingPeriod === 'annual'}
            className={`ui-tap-target p-4 rounded-2xl text-start transition-all flex flex-col justify-between gap-3 min-h-32 border ${
              billingPeriod === 'annual'
                ? "bg-brand-elevated border-brand-primary/50 text-brand-primary shadow-sm"
                : "bg-brand-surface border-brand-border text-brand-muted hover:border-brand-border-opacity-30"
            }`}
          >
            <BadgeRow>
              <span className="text-caption font-semibold text-brand-primary">{tm('annual')}</span>
              {stats?.is_premium && stats.premium_billing_period === 'annual'
                ? <Badge>{tc('current_plan')}</Badge>
                : <Badge variant="purple">{tm('discount')}</Badge>}
            </BadgeRow>
            <div className="space-y-0.5">
              <p className="t-numeric-lg text-brand-primary"><bdi>${(ANNUAL_CENTS / 100 / 12).toFixed(2)}</bdi></p>
              <p className="t-caption text-brand-muted">{tm('per_month')}</p>
              <p className="t-caption text-brand-muted">{tm('billed_yearly', { amount: (ANNUAL_CENTS / 100).toFixed(0) })}</p>
            </div>
          </button>
        </div>

        {/* ── Features list with Gold Accents ──────────────────── */}
        <section aria-labelledby="vip-perks-heading" className="w-full">
          <h2 id="vip-perks-heading" className="sr-only">{tm('perks_heading')}</h2>
          <ul role="list" className="w-full flex flex-col space-y-2.5 list-none m-0 p-0">
            {FEATURES.map((f, i) => (
              <li
                key={i}
                className="ui-list-row list-item-contain"
              >
                <span className="ui-icon-tile ui-icon-tile--premium">
                  {f.icon}
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-semibold text-brand-primary leading-tight mb-0.5">
                    {stripEmojis(f.title)}
                  </span>
                  <span className="text-caption text-brand-muted font-medium leading-snug">
                    {stripEmojis(f.desc)}
                  </span>
                </div>
                <FaCheck className="shrink-0" style={{ color: 'var(--badge-purple-ink)' }} fontSize={12} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Subscribe CTA (Glowing Gold Button) ───────────────── */}
        <div className="w-full pt-1 flex flex-col gap-2">
          {stats?.is_premium ? (
            (stats.premium_billing_period || 'monthly') === 'monthly' && billingPeriod === 'annual' ? (
              <>
                <Button variant="premium" size="lg" className="w-full"
                  onClick={stats.has_stripe_subscription ? handleUpgradeStripe : handleUpgradeBalance}
                  isLoading={submitting}
                  disabled={!stats.has_stripe_subscription && loadingBalance}>
                  {submitting ? tm('processing') : !stats.has_stripe_subscription && balanceError ? tw('balance_unavailable') : !stats.has_stripe_subscription && loadingBalance ? `${tw('usdt_balance')}…` : tm('annual_upgrade', { discount: tm('discount') })}
                </Button>

                {stats.has_stripe_subscription && (
                  <Button variant="ghost" className="w-full" onClick={handleUpgradeBalance} disabled={submitting || loadingBalance}>
                    {balanceError ? tw('balance_unavailable') : loadingBalance ? `${tw('usdt_balance')}…` : tm('upgrade_balance')}
                  </Button>
                )}
              </>
            ) : (stats.premium_billing_period || 'monthly') === 'annual' && billingPeriod === 'monthly' ? (
              <div className="ui-stat ui-stat--premium items-center text-center">
                <span className="text-sm font-semibold text-brand-primary">
                  {tm('annual_active')}
                </span>
                <span className="ui-stat__meta">
                  {tm('annual_active_description')}
                </span>
              </div>
            ) : stats?.has_stripe_subscription ? (
              <Button variant="secondary" size="lg" className="w-full" onClick={handleManageSubscription} isLoading={submitting}>
                {submitting ? tm('processing') : tm('manage_subscription')}
              </Button>
            ) : (
              <div className="ui-stat ui-stat--premium items-center text-center">
                <span className="text-sm font-semibold text-brand-primary">
                  {tm('balance_active')}
                </span>
                <span className="ui-stat__meta">
                  {tm('balance_active_description')}
                </span>
              </div>
            )
          ) : (
            <>
              <Button variant="premium" size="lg" className="w-full" onClick={handleSubscribeStripe} isLoading={submitting}>
                {submitting ? tm('processing') : tm('subscribe_card')}
              </Button>

              <Button variant="secondary" className="w-full" onClick={handleSubscribeBalance} disabled={submitting || loadingBalance}>
                {balanceError ? tw('balance_unavailable') : loadingBalance ? `${tw('usdt_balance')}…` : tm('pay_balance')}
              </Button>
            </>
          )}
        </div>

        {/* ── Compare tiers toggle ─────────────────────────────── */}
        <Button variant="ghost" className="self-center" aria-expanded={showComparison}
          onClick={() => { telegramHaptic('light'); setShowComparison(v => !v); }}>
          {showComparison ? tm('hide_comparison') : tm('compare_tiers')}
        </Button>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden"
            >
              <TierComparison />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── XP Upgrade (Free Path) ───────────────────────────── */}
        {stats && !stats.is_premium && (
          <div className="ui-hero-card ui-hero-card--premium w-full p-5 space-y-3 text-center">
            <Badge variant="purple">{tm('xp_upgrade_badge')}</Badge>
            <h3 className="text-section-title font-semibold text-brand-primary">
              {tm('xp_upgrade_title')}
            </h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              {tm('xp_upgrade_desc')}
            </p>
            <p className="text-caption font-semibold text-brand-primary tabular-nums">
              {tm('xp_upgrade_cost', { xp: stats.xp.toLocaleString(locale) })}
            </p>
            <Button variant="outline" className="w-full" onClick={handleXpUpgrade}>
              {tm('xp_upgrade_btn')}
            </Button>
          </div>
        )}

        <p className="w-full text-caption text-brand-muted text-center leading-relaxed font-medium px-4 pb-8">
          {tm('legal')}
        </p>
      </main>

      <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} maxWidth="sm" title={stripEmojis(tm('success_title'))} description={stripEmojis(tm('success_subtitle'))}
        footer={<Button variant="primary" className="w-full" onClick={() => setShowSuccess(false)}>{stripEmojis(tm('success_btn'))}</Button>}>
        {showConfetti && animations && <div className="fixed inset-0 pointer-events-none"><Confetti width={windowDimensions.width} height={windowDimensions.height} recycle={false} numberOfPieces={56} gravity={0.2} onConfettiComplete={() => setShowConfetti(false)} /></div>}
        <p className="t-body text-brand-muted">{stripEmojis(tm('success_desc'))}</p>
      </Modal>
      <Modal isOpen={showInsufficient} onClose={() => setShowInsufficient(false)} maxWidth="sm" title={stripEmojis(tm('insufficient_title'))}
        footer={<div className="space-y-2"><Button variant="primary" className="w-full" onClick={() => { setShowInsufficient(false); setShowDepositModal(true); }}>{tm('insufficient_topup_btn')}</Button><Button variant="secondary" className="w-full" onClick={() => setShowInsufficient(false)}>{tm('insufficient_cancel_btn')}</Button></div>}>
        <p className="t-body text-brand-muted">{tm('insufficient_desc', { cost: (cost / 100).toFixed(2), balance: (walletBalance / 100).toFixed(2) })}</p>
      </Modal>

      {/* ── Deposit modal (portals itself internally) ────────────── */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            onClose={() => setShowDepositModal(false)}
            onSuccess={async () => { await syncBalance(); syncStats(); setShowDepositModal(false); }}
            walletAddress={walletAddress}
            chosenWager={cost}
            walletBalance={walletBalance}
          />
        )}
      </AnimatePresence>

      {/* ── VIP XP Upgrade Confirmation Sheet ────────────────────── */}
      <VIPConfirmSheet
        isOpen={confirmingXpUpgrade}
        title={tm('xp_upgrade_title')}
        description={tm('xp_upgrade_desc')}
        costText={`${(5000).toLocaleString(locale)} XP`}
        balanceText={`${(stats?.xp || 0).toLocaleString(locale)} XP`}
        loading={submitting}
        onConfirm={handleConfirmXpUpgrade}
        onCancel={() => setConfirmingXpUpgrade(false)}
      />
    </LayoutWrapper>
  );
}
