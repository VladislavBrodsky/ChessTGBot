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
import { useNavbar } from '@/context/NavbarContext';

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
 const { hide, show } = useNavbar();
 
  // Hide bottom menu explicitly on this page
  useEffect(() => {
    hide();
    return () => show();
  }, [hide, show]);
 
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
  <LayoutWrapper className="pb-8 pt-6 min-h-screen relative">
    {/* Atmospheric Background glow (Fixed to viewport so it never cuts off during scroll/rubber-banding) */}
    <div className="fixed inset-0 z-0 pointer-events-none bg-brand-void">
       <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-purple-600/20 blur-[100px] rounded-[100%] opacity-60 mix-blend-screen" />
       <div className="absolute bottom-[-10%] right-[-20%] w-[120%] h-[400px] bg-pink-600/15 blur-[100px] rounded-[100%] opacity-40 mix-blend-screen" />
    </div>

    <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl flex flex-col items-center mx-auto space-y-7 px-4 relative z-10 pb-8">
      {/* Header / Brand */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full flex flex-col items-center justify-center text-center pt-2"
      >
        <div className="flex items-center justify-center gap-2">
            <span className="text-3xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">👑</span>
            <span className="text-2xl sm:text-3xl font-black tracking-tighter uppercase premium-neon-text-glow bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-white to-pink-300">
            {stripEmojis(tm('title'))}
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.8)] tracking-wider">PRO</span>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 mt-3 opacity-90 text-center">
            {tm('subtitle')}
        </p>
      </motion.div>

      {/* Active Subscription Expiry Badge */}
      {stats?.is_premium && stats.premium_expires_at && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-purple-900/30 border border-purple-500/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.2)] backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <path d="M2 18h20M4 18L2 8l5 4 5-6 5 6 5-4-2 10"/>
              </svg>
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Active Membership</span>
              </div>
              <div className="text-xs font-bold text-white/90">
                Expires: {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hero Viral Features Vertical List (The highly requested improvement) */}
      <div className="w-full flex flex-col space-y-3.5 mt-2">
        {PREMIUM_INFO.features.map((feature, idx) => {
            const isViralHighlight = idx === 1 || idx === 2; // Highlight Referral and Wagers
            return (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 25 }}
                    className={`relative rounded-[20px] overflow-hidden group ${
                        isViralHighlight 
                            ? "bg-gradient-to-r from-purple-900/40 to-pink-900/20 border border-purple-400/40 shadow-[0_0_25px_rgba(168,85,247,0.25)]" 
                            : "bg-white/[0.03] border border-white/[0.08]"
                    }`}
                >
                    {/* Animated Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className={`flex items-center gap-4 ${isViralHighlight ? 'p-4 sm:p-5' : 'p-3.5 sm:p-4'}`}>
                        {/* Huge Premium Icon */}
                        <div
                            className={`flex items-center justify-center shrink-0 rounded-2xl relative shadow-inner overflow-hidden ${
                                isViralHighlight ? "w-14 h-14 sm:w-16 sm:h-16" : "w-12 h-12"
                            }`}
                            style={{ 
                                background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))`,
                                boxShadow: `inset 0 1px 1px rgba(255,255,255,0.2), 0 8px 24px ${feature.glow}` 
                            }}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-80`} />
                            <div className="absolute inset-0 bg-black/20" />
                            <div className="relative text-white drop-shadow-md z-10">
                                {feature.icon}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="flex flex-col flex-1 text-left justify-center">
                            <span className={`font-black uppercase tracking-wide text-white leading-tight mb-1 ${
                                isViralHighlight ? "text-[12px] sm:text-sm drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : "text-[11px] sm:text-xs"
                            }`}>
                                {stripEmojis(feature.title)}
                            </span>
                            <span className={`text-brand-primary/65 leading-snug tracking-tight ${
                                isViralHighlight ? "text-[11px] sm:text-xs font-medium" : "text-[10px]"
                            }`}>
                                {stripEmojis(feature.desc)}
                            </span>
                        </div>
                    </div>
                </motion.div>
            );
        })}
      </div>

      {/* Pricing Options */}
      <div className="w-full grid grid-cols-2 gap-4 mt-6">
        {/* Monthly Plan */}
        <button
          onClick={() => {
            telegramHaptic('light');
            setBillingPeriod('monthly');
          }}
          className={`relative p-5 rounded-3xl text-left transition-all flex flex-col justify-between h-36 overflow-hidden cursor-pointer ${
            billingPeriod === 'monthly'
              ? "bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border-2 border-purple-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-[1.03]"
              : "bg-white/[0.03] border-2 border-white/[0.08] text-brand-primary hover:bg-white/[0.06]"
          }`}
        >
          {billingPeriod === 'monthly' && <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />}
          <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${billingPeriod === 'monthly' ? "text-purple-200" : "text-brand-primary opacity-40"}`}>{tm('monthly')}</span>
          <div className="relative z-10">
            <span className={`text-3xl font-black tracking-tighter leading-none ${billingPeriod === 'monthly' ? "text-white" : ""}`}>${(PREMIUM_INFO.monthly / 100).toFixed(2)}</span>
            <span className={`text-[9px] font-bold block mt-1 uppercase ${billingPeriod === 'monthly' ? "text-purple-300" : "text-brand-primary opacity-40"}`}>{tm('per_month')}</span>
          </div>
        </button>

        {/* Annual Plan (Highlighted) */}
        <button
          onClick={() => {
            telegramHaptic('light');
            setBillingPeriod('annual');
          }}
          className={`relative p-5 rounded-3xl text-left transition-all flex flex-col justify-between h-36 overflow-hidden cursor-pointer ${
            billingPeriod === 'annual'
              ? "bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 border-2 border-pink-300 text-white shadow-[0_0_40px_rgba(236,72,153,0.6)] scale-[1.05] z-10"
              : "bg-white/[0.03] border-2 border-white/[0.08] text-brand-primary hover:bg-white/[0.06]"
          }`}
        >
          {/* Animated 15% OFF Badge */}
          <div className="absolute top-0 right-0" style={{ borderRadius: '0 20px 0 16px' }}>
            <div className="relative px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white bg-gradient-to-r from-pink-500 to-rose-500 shadow-md">
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
                className="absolute inset-0 w-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
              />
              <span className="relative z-10 drop-shadow-sm">{tm('discount')}</span>
            </div>
          </div>

          <span className={`text-[10px] font-black uppercase tracking-widest relative z-10 ${billingPeriod === 'annual' ? "text-pink-200" : "text-brand-primary opacity-40"}`}>{tm('annual')}</span>
          <div className="relative z-10">
            <span className={`text-3xl font-black tracking-tighter leading-none ${billingPeriod === 'annual' ? "text-white" : ""}`}>${(PREMIUM_INFO.annual / 100).toFixed(2)}</span>
            <span className={`text-[9px] font-bold block mt-1 uppercase ${billingPeriod === 'annual' ? "text-pink-200" : "text-brand-primary opacity-40"}`}>{tm('per_annum')}</span>
          </div>
        </button>
      </div>

      {/* Confirm Action Button (Sticky for visibility) */}
      <div className="w-full pt-4 sticky bottom-4 z-50">
        <motion.button
            whileHover={submitting ? {} : { scale: 1.02 }}
            whileTap={submitting ? {} : { scale: 0.98 }}
            onClick={handleSubscribe}
            disabled={submitting}
            className={`w-full py-5 rounded-[24px] bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-black uppercase tracking-widest text-[13px] shadow-[0_10px_40px_rgba(168,85,247,0.6)] relative overflow-hidden transition-all flex items-center justify-center ${
            submitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
        >
            {/* Shimmer effect inside button */}
            <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 w-1/2 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }}
            />
            {submitting ? (
            <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-3 relative z-10" />
            ) : null}
            <span className="relative z-10 drop-shadow-md">
            {getButtonText()}
            </span>
        </motion.button>
      </div>

      {/* Collapsible Tier Comparison Accordion Trigger */}
      <div className="w-full flex justify-center pt-2">
        <button
          onClick={() => {
            telegramHaptic('light');
            setShowComparison(!showComparison);
          }}
          className="px-6 py-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-purple-500/30 text-purple-300 font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer flex items-center gap-2"
        >
          <span>
            {showComparison 
              ? (tm('hide_comparison') === 'hide_comparison' ? 'Hide Comparison Details ▴' : tm('hide_comparison'))
              : (tm('compare_tiers') === 'compare_tiers' ? 'Compare Tiers & Features ▾' : tm('compare_tiers'))
            }
          </span>
        </button>
      </div>

      {/* Collapsible Tier Comparison Matrix */}
      <AnimatePresence>
        {showComparison && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full overflow-hidden mt-2"
          >
            <TierComparison />
          </motion.div>
        )}
      </AnimatePresence>


      {/* XP Upgrade Protocol */}
      {stats && !stats.is_premium && (
        <div className="w-full pt-4">
            <div className="w-full bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl relative overflow-hidden text-center space-y-4">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 opacity-80">{tm('xp_upgrade_badge')}</div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{tm('xp_upgrade_title')}</h3>
            <p className="text-[10px] text-white/50 px-4 leading-relaxed">
                {tm('xp_upgrade_desc')}
            </p>
            
            <div className="bg-black/40 rounded-xl py-2.5 border border-white/5 w-fit px-6 mx-auto text-[10px] font-black uppercase text-purple-300 tracking-widest">
                {tm('xp_upgrade_cost', { xp: stats.xp })}
            </div>

            <button
                onClick={handleXpUpgrade}
                className="w-full py-4 rounded-[18px] bg-white/[0.05] hover:bg-white/[0.1] text-white text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all border border-white/10"
            >
                {tm('xp_upgrade_btn')}
            </button>
            </div>
        </div>
      )}

      {/* Footer Legal */}
      <p className="w-full text-[9px] text-brand-primary opacity-30 text-center leading-[1.6] font-bold uppercase tracking-widest px-4 pb-12 pt-4">
        {tm('legal')}
      </p>
    </div>

  {/* Congratulations Modal */}
  <AnimatePresence>
    {showSuccess && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4"
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
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm bg-brand-surface border border-purple-500/30 p-8 rounded-[32px] text-center shadow-[0_0_50px_rgba(168,85,247,0.3)] relative overflow-hidden flex flex-col items-center space-y-6"
        >
          {/* Animated Crown Icon */}
          <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-[0_10px_30px_rgba(236,72,153,0.4)] relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10" />
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-12 h-12 text-white drop-shadow-md"
              >
                <path d="M12 2v3M10.5 3.5h3" />
                <path d="M9 8.5c1.2-1.5 2.8-1.5 4 0" />
                <path d="M7 10h10v1.5c0 1.2-1.5 2-3 2H10c-1.5 0-3-.8-3-2V10z" />
                <path d="M9.5 13.5v2.5h5v-2.5" />
                <path d="M8 17.5h8" />
                <path d="M6.5 20.5h11" />
              </svg>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider leading-none">
              {stripEmojis(tm('success_title'))}
            </h2>
            <p className="text-xs font-bold text-purple-300 uppercase tracking-widest">
              {stripEmojis(tm('success_subtitle'))}
            </p>
          </div>

          <p className="text-[11px] text-brand-primary/60 px-2 leading-relaxed font-medium">
            {stripEmojis(tm('success_desc'))}
          </p>

          <button
            onClick={() => {
              telegramHaptic('light');
              setShowSuccess(false);
            }}
            className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[11px] cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {stripEmojis(tm('success_btn'))}
          </button>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Insufficient Balance Modal */}
  <AnimatePresence>
    {showInsufficient && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm bg-brand-surface border border-brand-border-opacity-10 p-8 rounded-[32px] text-center shadow-2xl relative overflow-hidden flex flex-col items-center space-y-6"
        >
          {/* Coins/Warning Icon */}
            <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg relative border border-white/5">
              <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="text-gray-400"
              >
                <IconDiamond />
              </motion.div>
            </div>

          <div className="space-y-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider leading-none">
              {stripEmojis(tm('insufficient_title'))}
            </h2>
          </div>

          <p className="text-[11px] text-brand-primary/50 px-2 leading-relaxed">
            {tm('insufficient_desc', { 
              cost: ((billingPeriod === 'annual' ? PREMIUM_INFO.annual : PREMIUM_INFO.monthly) / 100).toFixed(2), 
              balance: (walletBalance / 100).toFixed(2) 
            })}
          </p>

          <div className="w-full flex flex-col space-y-3 pt-2">
            <button
              onClick={() => {
                telegramHaptic('light');
                setShowInsufficient(false);
                setShowDepositModal(true);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest cursor-pointer shadow-[0_5px_20px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all"
            >
              {tm('insufficient_topup_btn')}
            </button>
            
            <button
              onClick={() => {
                telegramHaptic('light');
                setShowInsufficient(false);
              }}
              className="w-full py-4 rounded-2xl bg-white/5 text-white/60 font-black uppercase tracking-widest text-[11px] cursor-pointer hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              {tm('insufficient_cancel_btn')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* DepositModal Integration */}
  <AnimatePresence>
    {showDepositModal && (
      <DepositModal
        onClose={() => setShowDepositModal(false)}
        onSuccess={async () => {
          await syncBalance();
          syncStats();
          setShowDepositModal(false);
        }}
        walletAddress={walletAddress}
        tgUser={tgUser}
        tw={tw}
      />
    )}
  </AnimatePresence>
  </LayoutWrapper>
  );
}
