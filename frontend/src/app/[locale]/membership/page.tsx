'use client';
 
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaCheck, FaTimes, FaArrowLeft } from "react-icons/fa";
import Confetti from "react-confetti";
import TierComparison from "@/components/TierComparison";
import { apiFetch } from "@/lib/api";
import { useLocale, useTranslations } from 'next-intl';
import { telegramAlert, telegramConfirm, telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import DepositModal from "@/components/Wallet/DepositModal";
import { useNavbarHideWhileMounted } from '@/context/NavbarContext';
import Link from "next/link";

const stripEmojis = (str: string): string => {
  if (!str) return "";
  return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
};

/* ─── SVG Icons ────────────────────────────────────────────────────────────── */
const IconBoost = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconReferral = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="18" cy="7" r="2"/>
    <path d="M3 21v-2a5 5 0 0 1 5-5h3"/>
    <path d="M15 14l2 2 4-4"/>
  </svg>
);
const IconThemes = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a5 5 0 0 1 4.9 6H7.1A5 5 0 0 1 12 2z"/>
    <path d="M7.1 8h9.8l1.4 3.5c.4 1 .1 2.1-.7 2.8A4 4 0 0 1 12 15a4 4 0 0 1-5.6-1.2.8.8 0 0 1-.7-2.3z"/>
  </svg>
);
const IconAcademy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M2 10l10-6 10 6-10 6-10-6z"/>
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>
  </svg>
);
const IconWager = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);
const IconCrown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M2 18h20M4 18L2 8l5 4 5-6 5 6 5-4-2 10H4z"/>
  </svg>
);

export default function MembershipPage() {
  const locale = useLocale();
  const tm = useTranslations('Membership');
  const tw = useTranslations('Wallet');

  useNavbarHideWhileMounted();

  const FEATURES = [
    { icon: <IconBoost />,    title: tm('premium_boost'),   desc: tm('premium_boost_desc')   },
    { icon: <IconReferral />, title: tm('priority_match'),  desc: tm('priority_match_desc')  },
    { icon: <IconWager />,    title: "Higher Wagers",        desc: "Unlock premium max-stakes and high-roller tables."        },
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

  const handleSubscribe = async () => {
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
        if (data.detail?.toLowerCase().includes("insufficient balance")) setShowInsufficient(true);
        else telegramAlert(data.detail || tm('upgrade_failed'));
      }
    } catch { telegramHaptic('error'); telegramAlert(tm('upgrade_failed')); }
    finally { setSubmitting(false); }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6 min-h-screen">
      <div className="w-full max-w-md flex flex-col items-center mx-auto space-y-5 px-4">

        {/* ── Back + Hero ─────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between pt-1">
          <Link href={`/${locale}/home`} className="flex items-center gap-1.5 text-brand-primary opacity-40 hover:opacity-80 transition-opacity">
            <FaArrowLeft className="text-[10px]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-brand-primary opacity-30">Membership</span>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center text-center pt-2 pb-1 space-y-3"
        >
          <div className="w-16 h-16 rounded-[22px] bg-brand-primary flex items-center justify-center text-brand-void shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
            <IconCrown />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase text-brand-primary leading-none">
              {stripEmojis(tm('title'))}
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary opacity-40 mt-2">
              {tm('subtitle')}
            </p>
          </div>
        </motion.div>

        {/* ── Active membership badge ──────────────────────────── */}
        {stats?.is_premium && stats.premium_expires_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-brand-surface border border-brand-border-opacity-10 rounded-[20px] p-4 flex items-center gap-3 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-50">Active Membership</span>
              <span className="text-xs font-bold text-brand-primary">
                Expires {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </motion.div>
        )}

        {/* ── Pricing toggle ───────────────────────────────────── */}
        <div className="w-full flex bg-brand-surface border border-brand-border-opacity-10 rounded-[16px] p-1">
          {(['monthly', 'annual'] as const).map((period) => (
            <button
              key={period}
              onClick={() => { telegramHaptic('light'); setBillingPeriod(period); }}
              className={`flex-1 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all ${
                billingPeriod === period
                  ? 'bg-brand-primary text-brand-void shadow-sm'
                  : 'text-brand-primary opacity-40 hover:opacity-70'
              }`}
            >
              {period === 'annual' ? `${tm('annual')} — Save 15%` : tm('monthly')}
            </button>
          ))}
        </div>

        {/* ── Price display ────────────────────────────────────── */}
        <motion.div
          key={billingPeriod}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-brand-surface border border-brand-border-opacity-10 rounded-[24px] p-6 flex flex-col items-center text-center shadow-sm"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-primary opacity-30 mb-3">
            {billingPeriod === 'annual' ? 'Annual Plan' : 'Monthly Plan'}
          </span>
          <div className="flex items-end gap-1.5 leading-none">
            <span className="text-5xl font-black tracking-tighter text-brand-primary">
              ${(cost / 100).toFixed(0)}
            </span>
            <span className="text-lg font-black text-brand-primary opacity-30 mb-1">
              .{String(cost % 100).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary opacity-40 mt-2">
            {billingPeriod === 'annual' ? tm('per_annum') : tm('per_month')}
          </span>
          {billingPeriod === 'annual' && (
            <div className="mt-3 px-3 py-1 rounded-full bg-brand-primary/10 text-[9px] font-black uppercase tracking-widest text-brand-primary">
              {tm('discount')}
            </div>
          )}
        </motion.div>

        {/* ── Features list ────────────────────────────────────── */}
        <div className="w-full flex flex-col space-y-2.5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-4 py-3.5 bg-brand-surface border border-brand-border-opacity-10 rounded-[18px]"
            >
              <div className="w-9 h-9 rounded-[12px] bg-brand-primary/8 flex items-center justify-center text-brand-primary shrink-0">
                {f.icon}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary leading-none mb-0.5">
                  {stripEmojis(f.title)}
                </span>
                <span className="text-[10px] text-brand-primary opacity-45 font-medium leading-snug truncate">
                  {stripEmojis(f.desc)}
                </span>
              </div>
              <FaCheck className="text-brand-primary opacity-60 shrink-0" fontSize={10} />
            </motion.div>
          ))}
        </div>

        {/* ── Subscribe CTA ────────────────────────────────────── */}
        <motion.button
          whileHover={submitting ? {} : { scale: 1.015 }}
          whileTap={submitting ? {} : { scale: 0.985 }}
          onClick={handleSubscribe}
          disabled={submitting}
          className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[13px] transition-all flex items-center justify-center shadow-md ${
            submitting ? 'opacity-60 cursor-not-allowed bg-brand-primary text-brand-void' : 'bg-brand-primary text-brand-void active:opacity-90'
          }`}
        >
          {submitting && <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2.5" />}
          {submitting ? tm('processing') : stats?.is_premium ? tm('extend_subscription') : tm('subscribe')}
        </motion.button>

        {/* ── Compare tiers toggle ─────────────────────────────── */}
        <button
          onClick={() => { telegramHaptic('light'); setShowComparison(v => !v); }}
          className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-40 hover:opacity-70 transition-opacity py-1"
        >
          {showComparison ? '▴ Hide Comparison' : '▾ Compare Free vs Pro'}
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

        {/* ── XP Upgrade (non-premium users only) ─────────────── */}
        {stats && !stats.is_premium && (
          <div className="w-full bg-brand-surface border border-brand-border-opacity-10 p-5 rounded-[24px] space-y-3 text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-40 block">
              {tm('xp_upgrade_badge')}
            </span>
            <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight">
              {tm('xp_upgrade_title')}
            </h3>
            <p className="text-[10px] text-brand-primary opacity-50 leading-relaxed">
              {tm('xp_upgrade_desc')}
            </p>
            <div className="bg-brand-primary/5 rounded-xl py-2 border border-brand-border-opacity-5 text-[10px] font-black uppercase text-brand-primary tracking-widest">
              {tm('xp_upgrade_cost', { xp: stats.xp })}
            </div>
            <button
              onClick={handleXpUpgrade}
              className="w-full py-3 rounded-2xl border border-brand-border-opacity-10 bg-transparent text-brand-primary text-[11px] font-black uppercase tracking-widest hover:bg-brand-primary/5 transition-all active:scale-[0.98]"
            >
              {tm('xp_upgrade_btn')}
            </button>
          </div>
        )}

        <p className="w-full text-[9px] text-brand-primary opacity-25 text-center leading-relaxed font-bold uppercase tracking-widest px-4 pb-8">
          {tm('legal')}
        </p>
      </div>

      {/* ── Success modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
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
              <div className="w-20 h-20 rounded-[24px] bg-brand-primary flex items-center justify-center text-brand-void shadow-lg">
                <IconCrown />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-brand-primary uppercase tracking-wider">{stripEmojis(tm('success_title'))}</h2>
                <p className="text-[10px] font-bold text-brand-primary opacity-50 uppercase tracking-widest">{stripEmojis(tm('success_subtitle'))}</p>
              </div>
              <p className="text-[11px] text-brand-primary opacity-50 px-2 leading-relaxed">{stripEmojis(tm('success_desc'))}</p>
              <button
                onClick={() => { telegramHaptic('light'); setShowSuccess(false); }}
                className="w-full py-4 rounded-2xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
              >
                {stripEmojis(tm('success_btn'))}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Insufficient balance modal ───────────────────────────── */}
      <AnimatePresence>
        {showInsufficient && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl flex flex-col items-center space-y-5"
            >
              <div className="w-20 h-20 rounded-[24px] bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center text-brand-primary">
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
                  className="w-full py-4 rounded-2xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_topup_btn')}
                </button>
                <button
                  onClick={() => { telegramHaptic('light'); setShowInsufficient(false); }}
                  className="w-full py-3.5 rounded-2xl bg-brand-primary/5 text-brand-primary opacity-60 font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_cancel_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deposit modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showDepositModal && (
          <DepositModal
            onClose={() => setShowDepositModal(false)}
            onSuccess={async () => { await syncBalance(); syncStats(); setShowDepositModal(false); }}
            walletAddress={walletAddress}
            tgUser={tgUser}
            tw={tw}
          />
        )}
      </AnimatePresence>
    </LayoutWrapper>
  );
}
