'use client';
 
import { useState, useEffect } from "react";
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

/* ── Ultra-premium SVG icon set ─────────────────────────────────────── */
const IconBoost = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
const IconReferral = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="18" cy="7" r="2"/>
    <path d="M3 21v-2a5 5 0 0 1 5-5h3"/>
    <path d="M15 14l2 2 4-4"/>
  </svg>
);
const IconThemes = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12 2a5 5 0 0 1 5 5c0 5-5 9-5 9S7 12 7 7a5 5 0 0 1 5-5z"/>
    <circle cx="12" cy="7" r="2"/>
    <path d="M8 21h8M10 17h4"/>
  </svg>
);
const IconAcademy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M2 10l10-6 10 6-10 6-10-6z"/>
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>
    <path d="M22 10v6"/>
    <circle cx="22" cy="17" r="1.5"/>
  </svg>
);
const IconWager = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/>
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
    <path d="M12 18V6"/>
  </svg>
);
const IconDiamond = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
    <path d="M6 3h12l4 6-10 12L2 9z"/>
    <path d="M2 9h20M12 3L8 9l4 12 4-12-4-6z"/>
  </svg>
);

const stripEmojis = (str: string): string => {
  if (!str) return "";
  return str.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
};

export default function MembershipPage() {
 const locale = useLocale();
 const tm = useTranslations('Membership');
 const t = useTranslations('Index');
 
  // Hide bottom menu explicitly on this page
  useNavbarHideWhileMounted();
 
  const PREMIUM_INFO = {
    id: 'premium',
    name: tm('premium'),
    features: [
      { icon: <IconBoost />, title: tm('premium_boost'), desc: tm('premium_boost_desc'), gradient: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.45)' },
      { icon: <IconReferral />, title: tm('priority_match'), desc: tm('priority_match_desc'), gradient: 'from-emerald-500 to-teal-600', glow: 'rgba(16,185,129,0.45)' },
      { icon: <IconWager />, title: "💸 Higher Wagers", desc: "Unlock premium max-stakes and high-roller tables for massive payouts.", gradient: 'from-rose-500 to-red-600', glow: 'rgba(244,63,94,0.45)' },
      { icon: <IconThemes />, title: tm('elite_skins'), desc: tm('elite_skins_desc'), gradient: 'from-sky-500 to-blue-600', glow: 'rgba(14,165,233,0.45)' },
      { icon: <IconAcademy />, title: tm('engine_analysis'), desc: tm('engine_analysis_desc'), gradient: 'from-purple-500 to-violet-600', glow: 'rgba(139,92,246,0.45)' },
    ],
    monthly: 2900,
    annual: 29580,
  };

 
  const { walletBalance, walletAddress, syncBalance, stats, syncStats } = useUser();
  const tw = useTranslations('Wallet');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual'); // Default to annual for better conversion
  const [tgUser, setTgUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 400, height: 600 });
  const [submitting, setSubmitting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const getButtonText = () => {
    if (submitting) return tm('processing');
    if (stats?.is_premium) return tm('extend_subscription');
    return tm('subscribe');
  };
 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
    }
  }, []);

  const handleXpUpgrade = async () => {
    const currentXp = stats?.xp || 0;
    if (currentXp < 5000) {
      telegramHaptic('error');
      telegramAlert(tm('xp_upgrade_alert', { xp: currentXp }));
      return;
    }

    telegramConfirm(tm('xp_upgrade_confirm', { xp: currentXp }), async (confirmUpgrade) => {
      if (!confirmUpgrade) return;

      try {
        const res = await apiFetch("/api/v1/gamification/premium/upgrade-with-xp", {
          method: "POST"
        });
        const data = await res.json();
        if (res.ok && data.status === "success") {
          telegramHaptic('success');
          setShowSuccess(true);
          setShowConfetti(true);
          syncStats();
        } else {
          telegramHaptic('error');
          telegramAlert(data.detail || tm('failed_xp_upgrade'));
        }
      } catch (e) {
        console.error(e);
        telegramHaptic('error');
        telegramAlert(tm('upgrade_failed'));
      }
    });
  };

  const handleSubscribe = async () => {
    if (submitting) return;

    const cost = billingPeriod === 'annual' ? PREMIUM_INFO.annual : PREMIUM_INFO.monthly;
    if (walletBalance < cost) {
      telegramHaptic('warning');
      setShowInsufficient(true);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/v1/users/subscribe", {
        method: "POST",
        body: JSON.stringify({
          tier: 'premium',
          billing_period: billingPeriod
        })
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
        if (data.detail && data.detail.toLowerCase().includes("insufficient balance")) {
          setShowInsufficient(true);
        } else {
          telegramAlert(data.detail || tm('subscription_failed'));
        }
      }
    } catch (e) {
      console.error("Subscription failed", e);
      telegramHaptic('error');
      telegramAlert(tm('subscription_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutWrapper className="pb-32 pt-6 min-h-screen relative">
      <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl flex flex-col items-center mx-auto space-y-6 px-4 relative z-10">
        
        {/* Header / Brand */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full flex flex-col items-center justify-center text-center pt-2 mb-2"
        >
          <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">👑</span>
              <span className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
                {stripEmojis(tm('title'))}
              </span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-brand-primary text-brand-void tracking-widest">PRO</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary opacity-50 mt-3 text-center">
              {tm('subtitle')}
          </p>
        </motion.div>

        {/* Active Subscription Badge */}
        {stats?.is_premium && stats.premium_expires_at && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full glass-panel bg-brand-surface border border-brand-border-opacity-10 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-brand-void">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                  <path d="M2 18h20M4 18L2 8l5 4 5-6 5 6 5-4-2 10"/>
                </svg>
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary opacity-60">Active Membership</span>
                </div>
                <div className="text-xs font-bold text-brand-primary">
                  Expires: {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Minimalist Feature Cards */}
        <div className="w-full flex flex-col space-y-3 mt-2">
          {PREMIUM_INFO.features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="w-full glass-panel bg-brand-surface border border-brand-border-opacity-10 rounded-[24px] p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                {feature.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary mb-0.5">
                  {stripEmojis(feature.title)}
                </span>
                <span className="text-[10px] text-brand-primary opacity-50 font-medium leading-snug">
                  {stripEmojis(feature.desc)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing Options */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => {
              telegramHaptic('light');
              setBillingPeriod('monthly');
            }}
            className={`p-5 rounded-3xl text-left transition-all flex flex-col justify-between h-36 ${
              billingPeriod === 'monthly'
                ? "bg-brand-surface border-2 border-brand-primary text-brand-primary"
                : "bg-brand-surface/50 border border-brand-border-opacity-10 text-brand-primary opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{tm('monthly')}</span>
            <div>
              <span className="text-3xl font-black tracking-tighter leading-none">${(PREMIUM_INFO.monthly / 100).toFixed(2)}</span>
              <span className="text-[9px] font-bold block mt-1 uppercase opacity-50">{tm('per_month')}</span>
            </div>
          </button>

          <button
            onClick={() => {
              telegramHaptic('light');
              setBillingPeriod('annual');
            }}
            className={`relative p-5 rounded-3xl text-left transition-all flex flex-col justify-between h-36 ${
              billingPeriod === 'annual'
                ? "bg-brand-primary border-2 border-brand-primary text-brand-void shadow-md"
                : "bg-brand-surface/50 border border-brand-border-opacity-10 text-brand-primary opacity-70 hover:opacity-100"
            }`}
          >
            <div className="absolute top-0 right-0">
              <div className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-bl-2xl rounded-tr-[22px] ${billingPeriod === 'annual' ? 'bg-brand-void text-brand-primary' : 'bg-brand-primary text-brand-void'}`}>
                {tm('discount')}
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{tm('annual')}</span>
            <div>
              <span className="text-3xl font-black tracking-tighter leading-none">${(PREMIUM_INFO.annual / 100).toFixed(2)}</span>
              <span className="text-[9px] font-bold block mt-1 uppercase opacity-70">{tm('per_annum')}</span>
            </div>
          </button>
        </div>

        {/* Subscribe Action */}
        <div className="w-full pt-4 sticky bottom-4 z-50">
          <motion.button
            whileHover={submitting ? {} : { scale: 1.02 }}
            whileTap={submitting ? {} : { scale: 0.98 }}
            onClick={handleSubscribe}
            disabled={submitting}
            className={`w-full py-4 rounded-[20px] font-black uppercase tracking-widest text-[12px] transition-all flex items-center justify-center shadow-md ${
              billingPeriod === 'annual' ? "bg-brand-primary text-brand-void" : "bg-brand-surface border border-brand-primary text-brand-primary"
            } ${submitting ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {submitting ? (
              <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-2" />
            ) : null}
            {getButtonText()}
          </motion.button>
        </div>

        {/* Comparison Trigger */}
        <div className="w-full flex justify-center pt-2">
          <button
            onClick={() => {
              telegramHaptic('light');
              setShowComparison(!showComparison);
            }}
            className="px-6 py-3 rounded-2xl glass-panel bg-brand-surface border border-brand-border-opacity-10 text-brand-primary opacity-60 hover:opacity-100 font-black uppercase text-[9px] tracking-widest transition-all"
          >
            {showComparison 
              ? (tm('hide_comparison') === 'hide_comparison' ? 'Hide Comparison Details ▴' : tm('hide_comparison'))
              : (tm('compare_tiers') === 'compare_tiers' ? 'Compare Tiers & Features ▾' : tm('compare_tiers'))
            }
          </button>
        </div>

        {/* Tier Comparison Matrix */}
        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden mt-2"
            >
              <TierComparison />
            </motion.div>
          )}
        </AnimatePresence>

        {/* XP Upgrade */}
        {stats && !stats.is_premium && (
          <div className="w-full pt-4">
            <div className="w-full glass-panel bg-brand-surface border border-brand-border-opacity-10 p-6 rounded-[32px] text-center space-y-4 shadow-sm">
              <div className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary opacity-50">{tm('xp_upgrade_badge')}</div>
              <h3 className="text-sm font-black text-brand-primary uppercase tracking-tight">{tm('xp_upgrade_title')}</h3>
              <p className="text-[10px] text-brand-primary opacity-60 px-2 leading-relaxed">
                  {tm('xp_upgrade_desc')}
              </p>
              <div className="bg-brand-primary/5 rounded-xl py-2.5 border border-brand-border-opacity-5 w-fit px-6 mx-auto text-[10px] font-black uppercase text-brand-primary tracking-widest">
                  {tm('xp_upgrade_cost', { xp: stats.xp })}
              </div>
              <button
                  onClick={handleXpUpgrade}
                  className="w-full py-3.5 rounded-2xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary text-[11px] font-black uppercase tracking-widest transition-all border border-brand-border-opacity-10"
              >
                  {tm('xp_upgrade_btn')}
              </button>
            </div>
          </div>
        )}

        <p className="w-full text-[9px] text-brand-primary opacity-30 text-center leading-[1.6] font-bold uppercase tracking-widest px-4 pb-12 pt-4">
          {tm('legal')}
        </p>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            {showConfetti && typeof window !== 'undefined' && (
              <Confetti
                width={windowDimensions.width}
                height={windowDimensions.height}
                recycle={false}
                numberOfPieces={400}
                gravity={0.15}
                onConfettiComplete={() => setShowConfetti(false)}
              />
            )}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl flex flex-col items-center space-y-6"
            >
              <div className="w-20 h-20 rounded-[24px] bg-brand-primary flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-brand-void">
                  <path d="M12 2v3M10.5 3.5h3" />
                  <path d="M9 8.5c1.2-1.5 2.8-1.5 4 0" />
                  <path d="M7 10h10v1.5c0 1.2-1.5 2-3 2H10c-1.5 0-3-.8-3-2V10z" />
                  <path d="M9.5 13.5v2.5h5v-2.5" />
                  <path d="M8 17.5h8" />
                  <path d="M6.5 20.5h11" />
                </svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-brand-primary uppercase tracking-wider">{stripEmojis(tm('success_title'))}</h2>
                <p className="text-xs font-bold text-brand-primary opacity-60 uppercase tracking-widest">{stripEmojis(tm('success_subtitle'))}</p>
              </div>
              <p className="text-[11px] text-brand-primary/60 px-2 leading-relaxed">{stripEmojis(tm('success_desc'))}</p>
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

      <AnimatePresence>
        {showInsufficient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl flex flex-col items-center space-y-6"
            >
              <div className="w-20 h-20 rounded-[20px] bg-brand-surface border border-brand-border-opacity-10 flex items-center justify-center">
                <IconDiamond />
              </div>
              <h2 className="text-lg font-black text-brand-primary uppercase tracking-wider">{stripEmojis(tm('insufficient_title'))}</h2>
              <p className="text-[11px] text-brand-primary/50 px-2 leading-relaxed">
                {tm('insufficient_desc', { 
                  cost: ((billingPeriod === 'annual' ? PREMIUM_INFO.annual : PREMIUM_INFO.monthly) / 100).toFixed(2), 
                  balance: (walletBalance / 100).toFixed(2) 
                })}
              </p>
              <div className="w-full flex flex-col space-y-3 pt-2">
                <button
                  onClick={() => { telegramHaptic('light'); setShowInsufficient(false); setShowDepositModal(true); }}
                  className="w-full py-4 rounded-2xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_topup_btn')}
                </button>
                <button
                  onClick={() => { telegramHaptic('light'); setShowInsufficient(false); }}
                  className="w-full py-4 rounded-2xl bg-brand-primary/5 text-brand-primary/60 font-black uppercase tracking-widest text-[11px] active:scale-[0.98] transition-all"
                >
                  {tm('insufficient_cancel_btn')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
