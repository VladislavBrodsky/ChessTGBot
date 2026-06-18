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
 
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [tgUser, setTgUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: 400, height: 600 });
 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiFetch("/api/v1/users/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      setTgUser(window.Telegram.WebApp.initDataUnsafe?.user);
    }
    fetchStats();
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
          fetchStats();
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
    if (!tgUser?.id) {
      telegramHaptic('warning');
      telegramAlert("Telegram User not found. Are you in the Mini App?");
      return;
    }

    try {
      const res = await apiFetch("/api/v1/users/subscribe", {
        method: "POST",
        body: JSON.stringify({
          tier: 'premium',
          billing_period: billingPeriod
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        telegramHaptic('success');
        setShowSuccess(true);
        setShowConfetti(true);
        fetchStats();
      } else {
        telegramHaptic('error');
        telegramAlert(data.detail || "Subscription failed");
      }
    } catch (e) {
      console.error("Subscription failed", e);
      telegramHaptic('error');
      telegramAlert("Subscription failed");
    }
  };

 return (
 <LayoutWrapper className="pb-32 pt-6">
 <div className="w-full max-w-sm flex flex-col items-center mx-auto space-y-8 px-4">
 {/* Header / Brand */}
 <div className="flex flex-col items-center w-full relative">
 <div className="absolute left-0 top-1/2 -translate-y-1/2">
 <Link href={`/${locale}/settings`}>
 <motion.button
 whileHover={{ x: -2 }}
 className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-widest cursor-pointer"
 >
 <FaChevronLeft className="text-[8px]" />
 <span>{t('back')}</span>
 </motion.button>
 </Link>
 </div>

 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 className="text-brand-primary text-3xl font-black tracking-tighter select-none uppercase"
 >
 {tm('title')}
 </motion.div>
 </div>
 <div className="h-px w-10 bg-brand-border-opacity-10 -mt-4" />
 <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-brand-primary opacity-30 -mt-2">{tm('subtitle')}</span>

 {/* Feature Container */}
 <div className="w-full glass-panel rounded-3xl p-6 border-brand-border-opacity-10 bg-brand-surface shadow-sm">
 <div className="space-y-6">
 {PREMIUM_INFO.features.map((feature, idx) => (
 <div key={idx} className="flex items-start space-x-4">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 border border-brand-border-opacity-10 flex items-center justify-center text-brand-primary opacity-60 shrink-0">
 <span className="text-base">{feature.icon}</span>
 </div>
 <div className="flex flex-col pt-0.5">
 <span className="text-xs font-black text-brand-primary uppercase tracking-tight leading-none mb-1.5">{feature.title}</span>
 <span className="text-[10px] font-bold text-brand-primary opacity-30 tracking-tight leading-snug">{feature.desc}</span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Pricing Options */}
 <div className="w-full grid grid-cols-2 gap-3">
 <button
 onClick={() => setBillingPeriod('monthly')}
 className={`p-5 rounded-2xl text-left transition-all border flex flex-col justify-between h-32 relative group overflow-hidden cursor-pointer shadow-sm ${billingPeriod === 'monthly'
 ? "bg-brand-primary border-brand-primary text-brand-void"
 : "bg-brand-surface border-brand-border-opacity-10 text-brand-primary hover:bg-brand-bg-opacity-5"
 }`}
 >
 <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'monthly' ? "text-brand-void opacity-60" : "text-brand-primary opacity-30"}`}>{tm('monthly')}</span>
 <div>
  <span className="text-3xl font-black tracking-tighter leading-none">${(PREMIUM_INFO.monthly / 100).toFixed(2)}</span>
 <span className={`text-[9px] font-bold block mt-1 ${billingPeriod === 'monthly' ? "text-brand-void opacity-50" : "text-brand-primary opacity-30"}`}>{tm('per_month')}</span>
 </div>
 </button>

 <button
 onClick={() => setBillingPeriod('annual')}
 className={`p-5 rounded-2xl text-left transition-all border flex flex-col justify-between h-32 relative group overflow-hidden cursor-pointer shadow-sm ${billingPeriod === 'annual'
 ? "bg-brand-primary border-brand-primary text-brand-void"
 : "bg-brand-surface border-brand-border-opacity-10 text-brand-primary hover:bg-brand-bg-opacity-5"
 }`}
 >
 <div className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-tighter ${billingPeriod === 'annual' ? "bg-brand-void text-brand-primary" : "bg-brand-bg-opacity-10 text-brand-primary opacity-60"}`}>
 {tm('discount')}
 </div>
 <span className={`text-[9px] font-black uppercase tracking-widest ${billingPeriod === 'annual' ? "text-brand-void opacity-60" : "text-brand-primary opacity-30"}`}>{tm('annual')}</span>
 <div className="flex flex-col">
 <div>
  <span className="text-3xl font-black tracking-tighter leading-none">${(PREMIUM_INFO.annual / 100).toFixed(2)}</span>
 <span className={`text-[9px] font-bold block mt-1 ${billingPeriod === 'annual' ? "text-brand-void opacity-50" : "text-brand-primary opacity-30"}`}>{tm('per_annum')}</span>
 </div>
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
      className="w-full glass-panel p-5 rounded-3xl border border-brand-border-opacity-15 bg-brand-surface relative overflow-hidden text-center shadow-md space-y-4"
    >
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary opacity-50">{tm('xp_upgrade_badge')}</div>
      <h3 className="text-xl font-black text-brand-primary uppercase">{tm('xp_upgrade_title')}</h3>
      <p className="text-xs text-brand-primary opacity-60 px-2 leading-relaxed">
        {tm('xp_upgrade_desc')}
      </p>
      
      <div className="bg-brand-void rounded-2xl py-3 border border-brand-border-opacity-5 w-fit px-8 mx-auto text-xs font-black uppercase text-brand-primary tracking-widest shadow-inner">
        {tm('xp_upgrade_cost', { xp: stats.xp })}
      </div>

      <button
        onClick={handleXpUpgrade}
        className="w-full py-[18px] rounded-2xl bg-brand-primary text-brand-void font-black uppercase tracking-widest text-xs cursor-pointer shadow-premium hover:brightness-110 active:scale-[0.98] transition-all"
      >
        {tm('xp_upgrade_btn')}
      </button>
    </motion.div>
  )}

  {/* Confirm Action */}
 <motion.button
 whileHover={{ scale: 1.01 }}
 whileTap={{ scale: 0.98 }}
 onClick={handleSubscribe}
 className="w-full py-6 action-button flex items-center justify-center shadow-sm cursor-pointer"
 >
 <span className="text-sm font-black tracking-[0.25em]">{tm('subscribe')}</span>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-brand-void/80 backdrop-blur-xl px-4"
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
          className="w-full max-w-sm glass-panel p-8 rounded-3xl border border-brand-primary/20 bg-brand-surface text-center shadow-2xl relative overflow-hidden flex flex-col items-center space-y-6"
        >
          {/* Decorative Glow */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-brand-primary opacity-10 blur-2xl rounded-full" />
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-brand-primary opacity-10 blur-2xl rounded-full" />

          {/* Animated Crown Icon */}
          <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-lg relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <span className="text-4xl">👑</span>
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
  </LayoutWrapper>
  );
}
