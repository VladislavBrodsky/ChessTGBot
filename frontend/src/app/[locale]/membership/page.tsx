'use client';
 
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { FaCheck, FaRocket, FaChevronLeft, FaCoins, FaTrophy, FaPalette, FaAd, FaUserFriends, FaCrown, FaBrain } from "react-icons/fa";
import Link from "next/link";
import Confetti from "react-confetti";
import TierComparison from "@/components/TierComparison";
import { apiFetch } from "@/lib/api";
import { useLocale, useTranslations } from 'next-intl';
import { telegramAlert, telegramConfirm, telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import DepositModal from "@/components/Wallet/DepositModal";
 
export default function MembershipPage() {
 const locale = useLocale();
 const tm = useTranslations('Membership');
 const t = useTranslations('Index');
 
  const PREMIUM_INFO = {
    id: 'premium',
    name: tm('premium'),
    features: [
      { icon: <FaRocket />, title: tm('premium_boost'), desc: tm('premium_boost_desc') },
      { icon: <FaUserFriends />, title: tm('priority_match'), desc: tm('priority_match_desc') },
      { icon: <FaCrown />, title: tm('elite_skins'), desc: tm('elite_skins_desc') },
      { icon: <FaBrain />, title: tm('engine_analysis'), desc: tm('engine_analysis_desc') },
    ],
    monthly: 2900,
    annual: 29580,
  };
 
  const { walletBalance, walletAddress, syncBalance, stats, syncStats } = useUser();
  const tw = useTranslations('Wallet');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [tgUser, setTgUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 400, height: 600 });
  const [submitting, setSubmitting] = useState(false);

  const getButtonText = () => {
    if (submitting) return "PROCESSING...";
    if (stats?.is_premium) {
      switch (locale) {
        case 'ru': return "ПРОДЛИТЬ ПОДПИСКУ";
        case 'es': return "EXTENDER SUSCRIPCIÓN";
        case 'fr': return "PROLONGER L'ABONNEMENT";
        case 'de': return "ABONNEMENT VERLÄNGERN";
        case 'zh': return "延长订阅";
        case 'ja': return "サブスクリプションを延長";
        case 'ar': return "تمديد الاشتراك";
        case 'pt': return "ESTENDER ASSINATURA";
        case 'hi': return "सदस्यता बढ़ाएं";
        default: return "EXTEND SUBSCRIPTION";
      }
    }
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
      telegramAlert(`Upgrading to Premium requires 5,000 XP. You currently have ${currentXp} XP.`);
      return;
    }

    telegramConfirm(`Upgrade to Premium by spending 5,000 XP? (You have ${currentXp} XP)`, async (confirmUpgrade) => {
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
          telegramAlert(data.detail || "Failed to upgrade with XP");
        }
      } catch (e) {
        console.error(e);
        telegramHaptic('error');
        telegramAlert("Upgrade failed");
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
          telegramAlert(data.detail || "Subscription failed");
        }
      }
    } catch (e) {
      console.error("Subscription failed", e);
      telegramHaptic('error');
      telegramAlert("Subscription failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <LayoutWrapper className="pb-32 pt-6 premium-liquid-mesh-container min-h-screen">
    {/* Floating Liquid Gradient Blobs for dynamic background */}
    <div className="premium-liquid-mesh-blob1" />
    <div className="premium-liquid-mesh-blob2" />
    <div className="premium-liquid-mesh-blob3" />

    <div className="w-full max-w-sm flex flex-col items-center mx-auto space-y-8 px-4 relative z-10">
      {/* Header / Brand */}
      <div className="w-full flex items-center justify-between relative">
        <div className="w-16 flex-shrink-0 flex items-center justify-start">
          <Link href={`/${locale}/settings`}>
            <motion.button
              whileHover={{ x: -2 }}
              className="text-purple-300 opacity-75 hover:opacity-100 hover:text-white transition-all flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-widest cursor-pointer premium-neon-text-glow"
            >
              <FaChevronLeft className="text-[8px]" />
              <span>{t('back')}</span>
            </motion.button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 text-center px-1 text-xl sm:text-2xl font-black tracking-tighter select-none uppercase premium-neon-text-glow flex items-center justify-center flex-wrap gap-1.5"
        >
          <span>{tm('title')}</span>
          <span className="text-[7.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] tracking-wide self-center normal-case flex-shrink-0">PRO</span>
        </motion.div>

        <div className="w-16 flex-shrink-0" />
      </div>
      <div className="h-px w-12 bg-purple-500/35 -mt-4 shadow-[0_0_8px_#a855f7]" />
      <span className="text-[8px] font-black uppercase tracking-[0.4em] text-purple-300 premium-neon-text-glow -mt-2">{tm('subtitle')}</span>

      {/* Active Subscription Expiry Badge */}
      {stats?.is_premium && stats.premium_expires_at && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full premium-neon-card p-4 rounded-2xl text-center space-y-1 relative overflow-hidden"
        >
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500/15 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500/15 blur-2xl rounded-full" />
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-purple-400 premium-neon-text-glow flex items-center justify-center gap-1.5">
            <FaCrown className="text-[9px]" /> ACTIVE PREMIUM MEMBERSHIP
          </span>
          <div className="text-xs font-black text-brand-primary uppercase tracking-wide">
            Expires: {new Date(stats.premium_expires_at).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>
      )}

      {/* Feature Container */}
      <div className="w-full premium-liquid-border">
        <div className="w-full premium-liquid-content p-6 space-y-6">
          {PREMIUM_INFO.features.map((feature, idx) => (
            <div key={idx} className="flex items-start space-x-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.4)] premium-neon-icon-glow">
                <span className="text-base">{feature.icon}</span>
              </div>
              <div className="flex flex-col pt-0.5 text-left">
                <span className="text-xs font-black text-brand-primary uppercase tracking-wide leading-none mb-1.5">{feature.title}</span>
                <span className="text-[10px] font-bold text-brand-primary/80 tracking-tight leading-snug">{feature.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Options */}
      <div className="w-full grid grid-cols-2 gap-3">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between h-28 relative group overflow-hidden cursor-pointer shadow-sm ${
            billingPeriod === 'monthly'
              ? "bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 border-purple-400/60 text-white shadow-[0_0_25px_rgba(168,85,247,0.55)] scale-[1.02]"
              : "bg-brand-surface border-brand-border-opacity-10 text-brand-primary hover:bg-brand-bg-opacity-5"
          }`}
        >
          <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? "text-white opacity-90 premium-neon-text-glow" : "text-brand-primary opacity-30"}`}>{tm('monthly')}</span>
          <div>
            <span className={`text-2xl font-black tracking-tighter leading-none ${billingPeriod === 'monthly' ? "premium-neon-text-glow text-white" : ""}`}>${(PREMIUM_INFO.monthly / 100).toFixed(2)}</span>
            <span className={`text-[8px] font-bold block mt-0.5 ${billingPeriod === 'monthly' ? "text-white opacity-85" : "text-brand-primary opacity-30"}`}>{tm('per_month')}</span>
          </div>
        </button>

        <button
          onClick={() => setBillingPeriod('annual')}
          className={`p-4 rounded-2xl text-left transition-all border flex flex-col justify-between h-28 relative group overflow-hidden cursor-pointer shadow-sm ${
            billingPeriod === 'annual'
              ? "bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-650 border-purple-400/60 text-white shadow-[0_0_30px_rgba(168,85,247,0.65)] scale-[1.02]"
              : "bg-brand-surface border-brand-border-opacity-10 text-brand-primary hover:bg-brand-bg-opacity-5"
          }`}
        >
          <div className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-xl text-[7px] font-black uppercase tracking-tighter ${billingPeriod === 'annual' ? "bg-white text-purple-600 shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-brand-bg-opacity-10 text-brand-primary opacity-60"}`}>
            {tm('discount')}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'annual' ? "text-white opacity-90 premium-neon-text-glow" : "text-brand-primary opacity-30"}`}>{tm('annual')}</span>
          <div>
            <span className={`text-2xl font-black tracking-tighter leading-none ${billingPeriod === 'annual' ? "premium-neon-text-glow text-white" : ""}`}>${(PREMIUM_INFO.annual / 100).toFixed(2)}</span>
            <span className={`text-[8px] font-bold block mt-0.5 ${billingPeriod === 'annual' ? "text-white opacity-85" : "text-brand-primary opacity-30"}`}>{tm('per_annum')}</span>
          </div>
        </button>
      </div>

      {/* Tier Comparison Matrix */}
      <TierComparison />

      {/* XP Upgrade Protocol */}
      {stats && !stats.is_premium && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full premium-neon-card p-6 rounded-3xl relative overflow-hidden text-center space-y-4 shadow-xl"
        >
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-400 premium-neon-text-glow">{tm('xp_upgrade_badge')}</div>
          <h3 className="text-xl font-black text-brand-primary uppercase tracking-tight">{tm('xp_upgrade_title')}</h3>
          <p className="text-xs text-brand-primary opacity-75 px-2 leading-relaxed">
            {tm('xp_upgrade_desc')}
          </p>
          
          <div className="bg-brand-void/80 rounded-2xl py-3 border border-purple-500/25 w-fit px-8 mx-auto text-xs font-black uppercase text-purple-300 tracking-widest shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
            {tm('xp_upgrade_cost', { xp: stats.xp })}
          </div>

          <button
            onClick={handleXpUpgrade}
            className="w-full py-[18px] rounded-2xl premium-liquid-button text-xs cursor-pointer shadow-premium hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {tm('xp_upgrade_btn')}
          </button>
        </motion.div>
      )}

      {/* Confirm Action */}
      <motion.button
        whileHover={submitting ? {} : { scale: 1.01 }}
        whileTap={submitting ? {} : { scale: 0.98 }}
        onClick={handleSubscribe}
        disabled={submitting}
        className={`w-full py-6 premium-liquid-button flex items-center justify-center cursor-pointer transition-all ${
          submitting ? "opacity-60 cursor-not-allowed" : ""
        }`}
      >
        {submitting ? (
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin mr-3" />
        ) : null}
        <span className="text-sm font-black tracking-[0.25em]">
          {getButtonText()}
        </span>
      </motion.button>

      {/* Footer Legal */}
      <p className="w-full text-[8px] text-brand-primary opacity-20 text-center leading-[1.6] font-bold uppercase tracking-widest px-4">
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-brand-void/80 backdrop-blur-xl px-4 modal-backdrop"
      >
        {showConfetti && typeof window !== 'undefined' && (
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            recycle={false}
            numberOfPieces={300}
            onConfettiComplete={() => setShowConfetti(false)}
          />
        )}
        
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm premium-neon-card p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center space-y-6"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500 opacity-20 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500 opacity-20 blur-2xl rounded-full" />

          {/* Animated Crown Icon */}
          <div className="w-20 h-20 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg relative group overflow-hidden shadow-[0_0_25px_rgba(168,85,247,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1.1, 1.1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                repeatDelay: 5,
                duration: 1.5
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 text-purple-300 premium-neon-icon-glow"
              >
                {/* Cross on top of king */}
                <path d="M12 2v3M10.5 3.5h3" />
                {/* King crown head shape */}
                <path d="M9 8.5c1.2-1.5 2.8-1.5 4 0" />
                <path d="M7 10h10v1.5c0 1.2-1.5 2-3 2H10c-1.5 0-3-.8-3-2V10z" />
                {/* Waist / Body */}
                <path d="M9.5 13.5v2.5h5v-2.5" />
                {/* Base layers */}
                <path d="M8 17.5h8" />
                <path d="M6.5 20.5h11" />
              </svg>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-brand-primary uppercase tracking-wider leading-none">
              {tm('success_title')}
            </h2>
            <p className="text-sm font-bold text-brand-primary opacity-80">
              {tm('success_subtitle')}
            </p>
          </div>

          <p className="text-xs text-brand-primary opacity-45 px-2 leading-relaxed">
            {tm('success_desc')}
          </p>

          {/* Features Quick List */}
          <div className="w-full bg-brand-void/45 border border-brand-border-opacity-5 rounded-2xl p-4 text-left space-y-3 shadow-inner">
            <div className="flex items-center space-x-3 text-xs font-black text-brand-primary/70 uppercase">
              <FaCheck className="text-emerald-500 text-sm" />
              <span>{tm('premium_boost')}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-black text-brand-primary/70 uppercase">
              <FaCheck className="text-emerald-500 text-sm" />
              <span>{tm('priority_match')}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-black text-brand-primary/70 uppercase">
              <FaCheck className="text-emerald-500 text-sm" />
              <span>{tm('engine_analysis')}</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-black text-brand-primary/70 uppercase">
              <FaCheck className="text-emerald-500 text-sm" />
              <span>{tm('elite_skins')}</span>
            </div>
          </div>

          <button
            onClick={() => {
              telegramHaptic('light');
              setShowSuccess(false);
            }}
            className="w-full py-[18px] rounded-2xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs cursor-pointer shadow-premium hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {tm('success_btn')}
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-brand-void/80 backdrop-blur-xl px-4 modal-backdrop"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="w-full max-w-sm premium-neon-card p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden flex flex-col items-center space-y-6"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-purple-500 opacity-20 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-purple-500 opacity-20 blur-2xl rounded-full" />

          {/* Coins/Warning Icon */}
          <div className="w-20 h-20 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg relative group overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.45)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 3,
                ease: "easeInOut"
              }}
            >
              <span className="text-4xl premium-neon-icon-glow">💎</span>
            </motion.div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-purple-300 premium-neon-text-glow uppercase tracking-wider leading-none">
              {tm('insufficient_title')}
            </h2>
          </div>

          <p className="text-xs text-brand-primary opacity-60 px-2 leading-relaxed">
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
              className="w-full py-4 rounded-2xl premium-liquid-button text-xs cursor-pointer shadow-premium hover:brightness-110 active:scale-[0.98] transition-all"
            >
              {tm('insufficient_topup_btn')}
            </button>
            
            <button
              onClick={() => {
                telegramHaptic('light');
                setShowInsufficient(false);
              }}
              className="w-full py-4 rounded-2xl bg-purple-950/25 border border-purple-500/10 text-purple-300 opacity-90 font-black uppercase tracking-widest text-xs cursor-pointer hover:bg-purple-900/15 active:scale-[0.98] transition-all"
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
