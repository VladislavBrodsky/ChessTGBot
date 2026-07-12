'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaVolumeUp, FaMoon, FaSun, FaWallet, FaQuestionCircle, FaShieldAlt, FaChevronDown, FaTrophy } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
 const t = useTranslations('Settings');
 const locale = useLocale();
 const { theme, toggleTheme } = useTheme();
 const [soundEnabled, setSoundEnabled] = useState(true);
 // Pull wallet address from global context — no extra API call needed
 const { walletAddress, stats, syncStats } = useUser();
 const [openFaq, setOpenFaq] = useState<number | null>(null);

 // Daily-arena heads-up opt-out. Seed from synced stats; optimistic on toggle.
 const [arenaAlerts, setArenaAlerts] = useState(true);
 useEffect(() => {
   const v = stats?.arena_notifications;
   if (typeof v === 'boolean') setArenaAlerts(v);
 }, [stats?.arena_notifications]);

 const handleArenaAlertsToggle = async () => {
   const next = !arenaAlerts;
   setArenaAlerts(next); // optimistic
   telegramHaptic('light');
   try {
     const res = await apiFetch('/api/v1/gamification/arena-notifications', {
       method: 'PUT',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ enabled: next }),
     });
     if (!res.ok) throw new Error('failed');
     syncStats();
   } catch {
     setArenaAlerts(!next); // revert on failure
   }
 };

 const faqItems = [
   { q: 'faq_q1', a: 'faq_a1' },
   { q: 'faq_q2', a: 'faq_a2' },
   { q: 'faq_q3', a: 'faq_a3' },
   { q: 'faq_q4', a: 'faq_a4' },
 ];

 const tgId = stats?.telegram_id || (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id : null);
 const isAdmin = tgId === 1016749901 || tgId === 716720099;

 const handleThemeToggle = () => {
   toggleTheme();
   telegramHaptic('light');
 };

 const handleSoundToggle = () => {
   setSoundEnabled(prev => !prev);
   telegramHaptic('light');
 };

 return (
 <LayoutWrapper className="justify-start pt-8 pb-32">
 <div className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center px-4 mx-auto">
 {/* Immersive Header */}
 <div className="w-full flex justify-between items-center mb-8">
 <Link href={`/${locale}/home`} className="html-back-button">
 <motion.button
 whileHover={{ x: -2 }}
 className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
 >
 <FaArrowLeft className="text-[10px]" />
 <span>{t('return')}</span>
 </motion.button>
 </Link>
 <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border-opacity-10 text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest">
 {t('config_core')}
 </div>
 </div>

 {/* Page Title & Subtitle Centered in 1 Line */}
 <div className="w-full text-center flex flex-col items-center mb-8">
 <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1.5 whitespace-nowrap leading-none">
 {t('title')}
 </h1>
 <p className="text-[10px] font-bold text-brand-primary opacity-30 uppercase tracking-[0.2em] leading-none mt-1">
 {t('subtitle')}
 </p>
 </div>

 {/* Standalone Glowing Premium Card */}
 <Link href={`/${locale}/membership`} className="w-full block mb-6">
 <div className="w-full glass-panel bg-brand-surface border border-brand-gold/30 rounded-[20px] p-4 flex items-center justify-between cursor-pointer hover:border-brand-gold/60 transition-all duration-300 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-sm shrink-0">
 <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   className="w-5 h-5"
 >
   <path d="M12 2v3M10.5 3.5h3" />
   <path d="M9 8.5c1.2-1.5 2.8-1.5 4 0" />
   <path d="M7 10h10v1.5c0 1.2-1.5 2-3 2H10c-1.5 0-3-.8-3-2V10z" />
   <path d="M9.5 13.5v2.5h5v-2.5" />
   <path d="M8 17.5h8" />
   <path d="M6.5 20.5h11" />
 </svg>
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-black text-brand-primary uppercase tracking-wide leading-none mb-1.5 flex items-center gap-2">
 {t('premium_membership')}
 <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-gold text-brand-void tracking-wide">PRO</span>
 </span>
 <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest leading-none opacity-80">
 {stats?.is_premium ? t('enhanced_access') : t('upgrade_for_access')}
 </span>
 </div>
 </div>
 <div className="w-7 h-7 rounded-full border border-brand-gold/25 bg-brand-gold/10 flex items-center justify-center shrink-0">
 <FaArrowLeft className="rotate-180 text-[10px] text-brand-gold" />
 </div>
 </div>
 </Link>

 {/* Section: General */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
 {t('visual_matrix')}
 </h3>
 <div className="w-full glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface divide-y divide-brand-border-opacity-10 shadow-sm overflow-hidden">
 
 {/* Theme row */}
 <div className="p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60">
 {theme === 'dark' ? <FaMoon /> : <FaSun />}
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
 {t('luminance_mode')}
 </span>
 <span className="text-[10px] font-bold text-brand-primary opacity-30 tracking-widest uppercase">
 {theme === 'dark' ? t('deep_void') : t('solar_flare')}
 </span>
 </div>
 </div>
 <button
 role="switch"
 aria-checked={theme === 'dark'}
 aria-label={t('luminance_mode')}
 onClick={handleThemeToggle}
 className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
 theme === 'dark' ? 'bg-emerald-500 justify-end' : 'bg-brand-bg-opacity-10 justify-start'
 }`}
 >
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className="w-5 h-5 rounded-full bg-white shadow-sm"
 />
 </button>
 </div>

 {/* Sound effects row */}
 <div className="p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60">
 <FaVolumeUp />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
 {t('audio_protocol')}
 </span>
 <span className="text-[10px] font-bold text-brand-primary opacity-30 tracking-widest uppercase">
 {soundEnabled ? t('active_sync') : t('muted')}
 </span>
 </div>
 </div>
 <button
 role="switch"
 aria-checked={soundEnabled}
 aria-label={t('audio_protocol')}
 onClick={handleSoundToggle}
 className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
 soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-brand-bg-opacity-10 justify-start'
 }`}
 >
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className="w-5 h-5 rounded-full bg-white shadow-sm"
 />
 </button>
 </div>

 {/* Arena alerts row */}
 <div className="p-4 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60">
 <FaTrophy />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
 {t('arena_alerts')}
 </span>
 <span className="text-[10px] font-bold text-brand-primary opacity-30 tracking-widest uppercase">
 {arenaAlerts ? t('arena_alerts_on') : t('arena_alerts_off')}
 </span>
 </div>
 </div>
 <button
 role="switch"
 aria-checked={arenaAlerts}
 aria-label={t('arena_alerts')}
 onClick={handleArenaAlertsToggle}
 className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
 arenaAlerts ? 'bg-emerald-500 justify-end' : 'bg-brand-bg-opacity-10 justify-start'
 }`}
 >
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className="w-5 h-5 rounded-full bg-white shadow-sm"
 />
 </button>
 </div>
 </div>
 </div>

 {/* Section: Language */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
 {t('language_matrix')}
 </h3>
 <LanguageSwitcher />
 </div>

  {/* Section: Account & Web3 */}
  <div className="w-full space-y-3 mb-6">
  <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
  {t('account_section')}
  </h3>
  
  {/* TON Wallet Card */}
  <div className="w-full glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface shadow-sm overflow-hidden">
  <Link href={`/${locale}/wallet`} className="w-full block">
  <div className="p-4 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-all cursor-pointer">
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60">
  <FaWallet />
  </div>
  <div className="flex flex-col text-left">
  <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1 flex items-center">
  {t('ton_wallet')}
  </span>
  <span className="text-[10px] font-bold text-brand-primary opacity-30 uppercase tracking-widest">
  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : t('ton_not_connected')}
  </span>
  </div>
  </div>
  <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
  <FaArrowLeft className="rotate-180 text-[10px] text-brand-primary" />
  </div>
  </div>
  </Link>
  </div>

  {/* Admin Command Center Card */}
  {isAdmin && (
    <div className="w-full mt-3 glass-panel rounded-2xl border border-red-500/20 bg-brand-surface shadow-sm overflow-hidden animate-pulse-slow">
      <Link href={`/${locale}/admin`} className="w-full block">
        <div className="p-4 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 opacity-80 shadow-[0_0_15px_rgba(239,68,68,0.25)] shrink-0">
              <FaShieldAlt className="text-sm" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1.5 flex items-center gap-2">
                Command Center
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white tracking-wide">ADMIN</span>
              </span>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider leading-none">
                Manage users, payouts & broadcasts
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
            <FaArrowLeft className="rotate-180 text-[10px] text-brand-primary" />
          </div>
        </div>
      </Link>
    </div>
  )}
  </div>
  
  {/* Section: FAQ */}
  <div className="w-full space-y-3 mb-6">
    <div className="w-full text-center flex flex-col items-center mt-4 mb-1">
      <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em]">
        {t('faq_title')}
      </h3>
    </div>
    
    <div className="w-full glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface divide-y divide-brand-border-opacity-10 shadow-sm overflow-hidden">
      {faqItems.map((item, index) => (
        <div key={index} className="w-full">
          <button
            onClick={() => {
              setOpenFaq(openFaq === index ? null : index);
              telegramHaptic('light');
            }}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-brand-bg-opacity-5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 pr-2">
              <div className="w-6 h-6 rounded-lg bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60 shrink-0">
                <FaQuestionCircle className="text-xs" />
              </div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-tight">
                {t(item.q)}
              </span>
            </div>
            <motion.div
              animate={{ rotate: openFaq === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-brand-primary opacity-30 shrink-0"
            >
              <FaChevronDown className="text-xs" />
            </motion.div>
          </button>
          
          <motion.div
            initial={false}
            animate={{ height: openFaq === index ? "auto" : 0, opacity: openFaq === index ? 1 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pl-[45px] text-[10px] font-medium text-brand-primary opacity-50 leading-relaxed text-left uppercase tracking-wide">
              {t(item.a)}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  </div>

 {/* versioning */}
 <div className="w-full mt-12 flex flex-col items-center opacity-20 select-none pointer-events-none text-center">
 <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t('footer')}</span>
 </div>
 </div>
 </LayoutWrapper>
 );
}
