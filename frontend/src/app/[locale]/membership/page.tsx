'use client';
 
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaCheck } from "react-icons/fa";
import Confetti from "react-confetti";
import TierComparison from "@/components/TierComparison";
import { apiFetch } from "@/lib/api";
import { useLocale, useTranslations } from 'next-intl';
import { telegramAlert, telegramConfirm, telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import DepositModal from "@/components/Wallet/DepositModal";
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';
import { BiSupport } from 'react-icons/bi';
import Link from "next/link";

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
const IconCrown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M3 20h18v2H3z"/>
  </svg>
);

export default function MembershipPage() {
  const locale = useLocale();
  const t = useTranslations('Index');
  const tm = useTranslations('Membership');
  const tw = useTranslations('Wallet');

  useNavbarHideWhileMounted();

  const FEATURES = [
    { icon: <IconBoost />,    title: tm('premium_boost'),   desc: tm('premium_boost_desc')   },
    { icon: <IconReferral />, title: tm('priority_match'),  desc: tm('priority_match_desc')  },
    { icon: <IconWager />,    title: tm('wager_title'),      desc: tm('wager_desc')           },
    { icon: <IconThemes />,   title: tm('elite_skins'),     desc: tm('elite_skins_desc')     },
    { icon: <IconAcademy />,  title: tm('engine_analysis'), desc: tm('engine_analysis_desc') },
  ];

  const MONTHLY_CENTS = 2900;
  const ANNUAL_CENTS  = 29580;

  const { walletBalance, walletAddress, syncBalance, stats, syncStats } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [tgUser, setTgUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 400, height: 600 });
  const [submitting, setSubmitting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
      if (window.Telegram?.WebApp) setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
      
      const params = new URLSearchParams(window.location.search);
      const status = params.get('status');
      const sessionId = params.get('session_id');
      if (status === 'success' && sessionId) {
        setShowDepositModal(true);
      }
    }
  }, []);

  const cost = billingPeriod === 'annual' ? ANNUAL_CENTS : MONTHLY_CENTS;

  const handleXpUpgrade = async () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 5000) {
      telegramHaptic('error');
      telegramAlert(tm('xp_upgrade_alert', { xp: currentXp }));
      return;
    }
    telegramConfirm(tm('xp_upgrade_confirm', { xp: currentXp }), async (ok) => {
      if (!ok) return;
      try {
        const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", { method: "POST" });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          telegramHaptic('success'); setShowSuccess(true); setShowConfetti(true); syncStats();
        } else {
          telegramHaptic('error'); telegramAlert(data.detail || tm('failed_xp_upgrade'));
        }
      } catch { telegramHaptic('error'); telegramAlert(tm('upgrade_failed')); }
    });
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

      <div className="w-full max-w-md flex flex-col items-center mx-auto space-y-5 px-4 relative z-10">

        {/* Hero with Gold Accents */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center text-center pt-2 pb-1 space-y-3"
        >
          <div className="w-16 h-16 rounded-[22px] bg-brand-elevated text-purple-500 flex items-center justify-center border border-brand-border-opacity-20 shadow-sm">
            <IconCrown />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-brand-primary leading-none">
              {stripEmojis(tm('title'))}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-muted mt-2">
              {tm('subtitle')}
            </p>
          </div>
        </motion.div>

        {/* ── Active membership badge ──────────────────────────── */}
        {stats?.is_premium && stats.premium_expires_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-brand-surface border border-brand-border-opacity-20 rounded-[20px] p-4 flex items-center gap-3 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{tm('active_membership')}</span>
              <span className="text-xs font-bold text-brand-primary">
                Expires {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Pricing Selector (Cards Side-by-Side) ─────────────── */}
        <div className="grid grid-cols-2 gap-3 w-full max-[350px]:grid-cols-1">
          {/* Monthly Card */}
          <button
            onClick={() => { telegramHaptic('light'); setBillingPeriod('monthly'); }}
            className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between h-32 border relative overflow-hidden backdrop-blur-sm ${
              billingPeriod === 'monthly'
                ? "bg-brand-elevated border-brand-primary/50 text-brand-primary shadow-sm"
                : "bg-brand-surface border-brand-border-opacity-20 text-brand-primary hover:border-brand-primary/30"
            }`}
          >
            {stats?.is_premium && (stats.premium_billing_period || 'monthly') === 'monthly' && (
              <div className="absolute top-0 right-0">
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-bl-xl bg-brand-elevated border-b border-l border-brand-border-opacity-20 text-brand-primary/70">
                  Current Plan
                </div>
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-muted">{tm('monthly')}</span>
            <div>
              <div className="flex items-end leading-none">
                <span className="text-2xl font-black tracking-tighter">${(MONTHLY_CENTS / 100).toFixed(0)}</span>
                <span className="text-xs font-black text-brand-muted mb-0.5">.00</span>
              </div>
              <span className="text-[10px] font-bold block mt-1 uppercase text-brand-muted">{tm('per_month')}</span>
            </div>
          </button>

          {/* Annual Card */}
          <button
            onClick={() => { telegramHaptic('light'); setBillingPeriod('annual'); }}
            className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between h-32 border relative overflow-hidden backdrop-blur-sm ${
              billingPeriod === 'annual'
                ? "bg-brand-elevated border-brand-primary/50 text-brand-primary shadow-sm"
                : "bg-brand-surface border-brand-border-opacity-20 text-brand-primary hover:border-brand-primary/30"
            }`}
          >
            {/* Badges */}
            <div className="absolute top-0 right-0 flex flex-col items-end">
              {stats?.is_premium && stats.premium_billing_period === 'annual' ? (
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-bl-xl bg-brand-elevated border-b border-l border-brand-border-opacity-20 text-brand-primary/70">
                  Current Plan
                </div>
              ) : (
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-bl-xl bg-purple-500 text-white">
                  {tm('discount')}
                </div>
              )}
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{tm('annual')}</span>
            <div>
              <div className="flex items-end leading-none">
                <span className="text-2xl font-black tracking-tighter text-brand-primary">${(ANNUAL_CENTS / 100 / 12).toFixed(2)}</span>
                <span className="text-xs font-black text-brand-muted mb-0.5">/mo</span>
              </div>
              <span className="text-[10px] font-bold block mt-1 uppercase text-brand-muted">
                {tm('billed_yearly', { amount: (ANNUAL_CENTS / 100).toFixed(0) })}
              </span>
            </div>
          </button>
        </div>

        {/* ── Features list with Gold Accents ──────────────────── */}
        <div className="w-full flex flex-col space-y-2.5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 bg-brand-surface border border-brand-border-opacity-20 rounded-[18px] hover:border-brand-primary/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-[12px] bg-brand-elevated border border-brand-border-opacity-10 flex items-center justify-center text-purple-500 shrink-0 group-hover:scale-105 transition-transform duration-300">
                {f.icon}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary leading-none mb-0.5">
                  {stripEmojis(f.title)}
                </span>
                <span className="text-[10px] text-brand-muted font-medium leading-snug truncate">
                  {stripEmojis(f.desc)}
                </span>
              </div>
              <FaCheck className="text-purple-500 shrink-0" fontSize={10} />
            </div>
          ))}
        </div>

        {/* ── Subscribe CTA (Glowing Gold Button) ───────────────── */}
        <div className="w-full pt-1 flex flex-col gap-2">
          {stats?.is_premium ? (
            (stats.premium_billing_period || 'monthly') === 'monthly' && billingPeriod === 'annual' ? (
              <>
                <motion.button
                  whileHover={submitting ? {} : { scale: 1.015 }}
                  whileTap={submitting ? {} : { scale: 0.985 }}
                  onClick={stats.has_stripe_subscription ? handleUpgradeStripe : handleUpgradeBalance}
                  disabled={submitting}
                  className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center shadow-premium relative overflow-hidden ${
                    submitting 
                      ? 'opacity-60 cursor-not-allowed bg-purple-500 text-white' 
                  : 'bg-purple-500 text-white hover:brightness-95'
                  }`}
                >
                  {submitting && <div className="w-4 h-4 rounded-full border-2 border-brand-void border-t-transparent animate-spin mr-2.5" />}
                  {submitting ? tm('processing') : "UPGRADE TO ANNUAL (-15%)"}
                </motion.button>

                {stats.has_stripe_subscription && (
                  <button
                    onClick={handleUpgradeBalance}
                    disabled={submitting}
                    className="w-full py-2.5 rounded-[16px] font-bold text-[10px] uppercase tracking-wider text-brand-muted hover:text-brand-primary transition-colors flex items-center justify-center border border-transparent hover:border-brand-border-opacity-20 hover:bg-brand-elevated"
                  >
                    Upgrade using internal balance
                  </button>
                )}
              </>
            ) : (stats.premium_billing_period || 'monthly') === 'annual' && billingPeriod === 'monthly' ? (
              <div className="relative overflow-hidden w-full py-4 px-5 rounded-[20px] bg-brand-surface border border-purple-500/30 flex flex-col items-center gap-1 text-center">
                <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-purple-500">
                  You're on the best plan!
                </span>
                <span className="text-[10px] text-brand-muted font-medium">
                  Your annual subscription is active and gives you the maximum discount.
                </span>
              </div>
            ) : stats?.has_stripe_subscription ? (
              <motion.button
                whileHover={submitting ? {} : { scale: 1.015 }}
                whileTap={submitting ? {} : { scale: 0.985 }}
                onClick={handleManageSubscription}
                disabled={submitting}
                className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center shadow-sm relative overflow-hidden ${
                  submitting 
                    ? 'opacity-60 cursor-not-allowed bg-brand-surface text-brand-primary border border-brand-border-opacity-10' 
                    : 'bg-brand-surface text-brand-primary border border-brand-border-opacity-10 hover:border-purple-500/50'
                }`}
              >
                {submitting && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2.5" />}
                {submitting ? tm('processing') : "Manage Subscription"}
              </motion.button>
            ) : (
              <div className="relative overflow-hidden w-full py-4 px-5 rounded-[20px] bg-brand-surface border border-purple-500/30 flex flex-col items-center gap-1 text-center">
                <span className="relative z-10 text-[10px] font-black uppercase tracking-widest text-purple-500">
                  Active via In-App Balance
                </span>
                <span className="text-[10px] text-brand-muted font-medium">
                  Your Premium was activated using your internal wallet balance. To cancel or change your plan, it will expire automatically on the date shown above.
                </span>
              </div>
            )
          ) : (
            <>
              <motion.button
                whileHover={submitting ? {} : { scale: 1.015 }}
                whileTap={submitting ? {} : { scale: 0.985 }}
                onClick={handleSubscribeStripe}
                disabled={submitting}
                className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center shadow-premium relative overflow-hidden ${
                  submitting 
                    ? 'opacity-60 cursor-not-allowed bg-purple-500 text-white' 
                  : 'bg-purple-500 text-white hover:brightness-95'
                }`}
              >
                {submitting && <div className="w-4 h-4 rounded-full border-2 border-brand-void border-t-transparent animate-spin mr-2.5" />}
                {submitting ? tm('processing') : "Subscribe with Card"}
              </motion.button>

              <button
                onClick={handleSubscribeBalance}
                disabled={submitting}
                className="w-full py-2.5 rounded-[16px] font-bold text-[10px] uppercase tracking-wider text-brand-muted hover:text-brand-primary transition-colors flex items-center justify-center border border-transparent hover:border-brand-border-opacity-20 hover:bg-brand-elevated"
              >
                Pay with internal balance
              </button>
            </>
          )}
        </div>

        {/* ── Compare tiers toggle ─────────────────────────────── */}
        <button
          onClick={() => { telegramHaptic('light'); setShowComparison(v => !v); }}
          className="text-[10px] font-black uppercase tracking-widest text-brand-muted hover:text-brand-primary transition-colors py-1 mt-1"
        >
          {showComparison ? `▴ ${tm('hide_comparison')}` : `▾ ${tm('compare_tiers')}`}
        </button>

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
          <div className="w-full bg-brand-surface border border-brand-border-opacity-20 p-5 rounded-[24px] space-y-3 text-center shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 opacity-80 block">
              {tm('xp_upgrade_badge')}
            </span>
            <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight">
              {tm('xp_upgrade_title')}
            </h3>
            <p className="text-[10px] text-brand-muted leading-relaxed">
              {tm('xp_upgrade_desc')}
            </p>
            <div className="bg-purple-500/10 rounded-xl py-2 border border-purple-500/25 text-[10px] font-black uppercase text-purple-500 tracking-widest max-w-[220px] mx-auto">
              {tm('xp_upgrade_cost', { xp: stats.xp })}
            </div>
            <button
              onClick={handleXpUpgrade}
              className="w-full py-3 rounded-2xl border border-purple-500/30 bg-transparent text-purple-500 text-[11px] font-black uppercase tracking-widest hover:bg-purple-500/5 transition-all active:scale-[0.98]"
            >
              {tm('xp_upgrade_btn')}
            </button>
          </div>
        )}

        <p className="w-full text-[10px] text-brand-muted text-center leading-relaxed font-bold uppercase tracking-widest px-4 pb-8">
          {tm('legal')}
        </p>
      </div>

      {/* ── Success modal (portaled: fixed overlays must not scope to a
             transformed ancestor — the leaderboard-modal stacking trap) ── */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-brand-overlay)] backdrop-blur-md px-4"
          >
            {showConfetti && typeof window !== 'undefined' && (
              <Confetti
                width={windowDimensions.width} height={windowDimensions.height}
                recycle={false} numberOfPieces={300} gravity={0.2}
                onConfettiComplete={() => setShowConfetti(false)}
              />
            )}
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl flex flex-col items-center space-y-5"
            >
              <div className="w-20 h-20 rounded-[24px] bg-purple-500 text-white flex items-center justify-center shadow-lg border border-purple-500/20">
                <IconCrown />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-brand-primary uppercase tracking-wider">{stripEmojis(tm('success_title'))}</h2>
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">{stripEmojis(tm('success_subtitle'))}</p>
              </div>
              <p className="text-[11px] text-brand-primary opacity-50 px-2 leading-relaxed">{stripEmojis(tm('success_desc'))}</p>
              <button
                onClick={() => { telegramHaptic('light'); setShowSuccess(false); }}
                className="w-full py-4 rounded-2xl bg-purple-500 text-white font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
              >
                {stripEmojis(tm('success_btn'))}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* ── Insufficient balance modal (portaled, same reason) ───── */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {showInsufficient && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-brand-overlay)] backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl flex flex-col items-center space-y-5"
            >
              <div className="w-20 h-20 rounded-[24px] bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center text-purple-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M6 3h12l4 6-10 12L2 9z"/>
                  <path d="M2 9h20M12 3L8 9l4 12 4-12-4-6z"/>
                </svg>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-brand-primary uppercase tracking-wider">{stripEmojis(tm('insufficient_title'))}</h2>
                <p className="text-[11px] text-brand-primary opacity-50 px-2 leading-relaxed">
                  {tm('insufficient_desc', {
                    cost: (cost / 100).toFixed(2),
                    balance: (walletBalance / 100).toFixed(2)
                  })}
                </p>
              </div>
              <div className="w-full flex flex-col space-y-2.5">
                <button
                  onClick={() => { telegramHaptic('light'); setShowInsufficient(false); setShowDepositModal(true); }}
                  className="w-full py-4 rounded-2xl bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_topup_btn')}
                </button>
                <button
                  onClick={() => { telegramHaptic('light'); setShowInsufficient(false); }}
                  className="w-full py-3.5 rounded-2xl bg-brand-surface border border-brand-border-opacity-10 text-brand-primary opacity-60 font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_cancel_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}

      {/* ── Deposit modal (portals itself internally) ────────────── */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            onClose={() => setShowDepositModal(false)}
            onSuccess={async () => { await syncBalance(); syncStats(); setShowDepositModal(false); }}
            walletAddress={walletAddress}
            tgUser={tgUser}
            tw={tw}
            chosenWager={cost}
            walletBalance={walletBalance}
          />
        )}
      </AnimatePresence>
    </LayoutWrapper>
  );
}
