'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaVolumeUp, FaMoon, FaSun, FaWallet, FaShieldAlt } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { apiFetch } from "@/lib/api";
import { telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";

export default function SettingsPage() {
 const t = useTranslations('Settings');
 const locale = useLocale();
 const { theme, toggleTheme } = useTheme();
 const [soundEnabled, setSoundEnabled] = useState(true);
 // Pull wallet address from global context — no extra API call needed
 const { walletAddress, stats } = useUser();

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
 <div className="premium-liquid-border">
 <div className="premium-liquid-content p-4 flex items-center justify-between transition-all cursor-pointer">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-sm shadow-[0_0_20px_rgba(168,85,247,0.55)] shrink-0">
 <svg
   viewBox="0 0 24 24"
   fill="none"
   stroke="currentColor"
   strokeWidth="1.8"
   strokeLinecap="round"
   strokeLinejoin="round"
   className="w-5 h-5 text-purple-400 premium-neon-icon-glow animate-pulse"
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
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-black text-brand-primary uppercase tracking-wide leading-none mb-1.5 flex items-center gap-2">
 {t('premium_membership')}
 <span className="text-[7.5px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.6)] tracking-wide">PRO</span>
 </span>
 <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest leading-none premium-neon-text-glow">
 {/* Only claim "Active" when the user actually has premium — this label
     previously showed "Premium Status: Active" to everyone. */}
 {stats?.is_premium ? t('enhanced_access') : t('upgrade_for_access')}
 </span>
 </div>
 </div>
 <div className="w-7 h-7 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center opacity-90 shadow-[0_0_12px_rgba(168,85,247,0.25)] shrink-0">
 <FaArrowLeft className="rotate-180 text-[8px] text-purple-300" />
 </div>
 </div>
 </div>
 </Link>

 {/* Section: General */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
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
 <span className="text-[9px] font-bold text-brand-primary opacity-30 tracking-widest uppercase">
 {theme === 'dark' ? t('deep_void') : t('solar_flare')}
 </span>
 </div>
 </div>
 <button
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
 <span className="text-[9px] font-bold text-brand-primary opacity-30 tracking-widest uppercase">
 {soundEnabled ? t('active_sync') : t('muted')}
 </span>
 </div>
 </div>
 <button
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
 </div>
 </div>

 {/* Section: Language */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
 {t('language_matrix')}
 </h3>
 <LanguageSwitcher />
 </div>

  {/* Section: Account & Web3 */}
  <div className="w-full space-y-3 mb-6">
  <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
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
  <span className="text-[9px] font-bold text-brand-primary opacity-30 uppercase tracking-widest">
  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : t('ton_not_connected')}
  </span>
  </div>
  </div>
  <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
  <FaArrowLeft className="rotate-180 text-[8px] text-brand-primary" />
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
                <span className="text-[7.5px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white tracking-wide">ADMIN</span>
              </span>
              <span className="text-[9.5px] font-bold text-red-400 uppercase tracking-wider leading-none">
                Manage users, payouts & broadcasts
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
            <FaArrowLeft className="rotate-180 text-[8px] text-brand-primary" />
          </div>
        </div>
      </Link>
    </div>
  )}
  </div>

 {/* versioning */}
 <div className="w-full mt-12 flex flex-col items-center opacity-20 select-none pointer-events-none text-center">
 <span className="text-[8px] font-bold tracking-[0.2em] uppercase">{t('footer')}</span>
 </div>
 </div>
 </LayoutWrapper>
 );
}
