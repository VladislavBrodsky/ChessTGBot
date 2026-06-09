'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaVolumeUp, FaMoon, FaSun, FaWallet } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
 const t = useTranslations('Settings');
 const locale = useLocale();
 const { theme, toggleTheme } = useTheme();
 const [soundEnabled, setSoundEnabled] = useState(true);
 const [walletAddress, setWalletAddress] = useState<string>("");

 useEffect(() => {
 apiFetch("/api/v1/wallet/balance")
 .then(res => {
 if (res.ok) return res.json();
 throw new Error();
 })
 .then(data => setWalletAddress(data.wallet_address || ""))
 .catch(() => {});
 }, []);

 return (
 <LayoutWrapper className="justify-start pt-8 pb-32">
 <div className="w-full max-w-sm flex flex-col items-center px-4 mx-auto">
 {/* Immersive Header */}
 <div className="w-full flex justify-between items-center mb-8">
 <Link href={`/${locale}/home`}>
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

 {/* Section: General */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] pl-1 text-left w-full">
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
 onClick={toggleTheme}
 className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
 theme === 'dark' ? 'bg-brand-primary justify-end' : 'bg-brand-bg-opacity-10 justify-start'
 }`}
 >
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className={`w-5 h-5 rounded-full ${theme === 'dark' ? 'bg-brand-void' : 'bg-brand-primary'}`}
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
 onClick={() => setSoundEnabled(!soundEnabled)}
 className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 flex items-center cursor-pointer ${
 soundEnabled ? 'bg-brand-primary justify-end' : 'bg-brand-bg-opacity-10 justify-start'
 }`}
 >
 <motion.div
 layout
 transition={{ type: "spring", stiffness: 500, damping: 30 }}
 className={`w-5 h-5 rounded-full ${soundEnabled ? 'bg-brand-void' : 'bg-brand-primary opacity-45'}`}
 />
 </button>
 </div>
 </div>
 </div>

 {/* Section: Language */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] pl-1 text-left w-full">
 {t('language_matrix')}
 </h3>
 <LanguageSwitcher />
 </div>

 {/* Section: Account & Web3 */}
 <div className="w-full space-y-2.5 mb-6">
 <h3 className="text-[9px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] pl-1 text-left w-full">
 Account & Integrations
 </h3>
 <div className="w-full glass-panel rounded-2xl border border-brand-border-opacity-10 bg-brand-surface divide-y divide-brand-border-opacity-10 shadow-sm overflow-hidden">
 
 {/* TON Wallet link */}
 <Link href={`/${locale}/wallet`} className="w-full block">
 <div className="p-4 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-all cursor-pointer">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60">
 <FaWallet />
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
 TON Wallet
 </span>
 <span className="text-[9px] font-bold text-brand-primary opacity-30 uppercase tracking-widest">
 {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not Connected"}
 </span>
 </div>
 </div>
 <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
 <FaArrowLeft className="rotate-180 text-[8px] text-brand-primary" />
 </div>
 </div>
 </Link>

 {/* Premium Status link */}
 <Link href={`/${locale}/membership`} className="w-full block">
 <div className="p-4 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-all cursor-pointer">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary opacity-60 text-sm">
 👑
 </div>
 <div className="flex flex-col text-left">
 <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
 Premium Membership
 </span>
 <span className="text-[9px] font-bold text-brand-primary opacity-30 uppercase tracking-widest">
 {t('enhanced_access')}
 </span>
 </div>
 </div>
 <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
 <FaArrowLeft className="rotate-180 text-[8px] text-brand-primary" />
 </div>
 </div>
 </Link>
 </div>
 </div>

 {/* versioning */}
 <div className="w-full mt-12 flex flex-col items-center opacity-20 select-none pointer-events-none text-center">
 <span className="text-[8px] font-bold tracking-[0.2em] uppercase">{t('footer')}</span>
 </div>
 </div>
 </LayoutWrapper>
 );
}
