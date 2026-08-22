'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaVolumeUp, FaMoon, FaSun, FaWallet, FaQuestionCircle, FaShieldAlt, FaChevronDown, FaTrophy, FaUniversalAccess, FaGem } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { telegramHaptic } from "@/lib/telegram";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { Switch } from "@/components/ui/Switch";
import { Card } from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";
import { useReducedMotionPreference } from "@/context/ReducedMotionContext";

export default function SettingsPage() {
 const t = useTranslations('Settings');
 const locale = useLocale();
 const { theme, toggleTheme } = useTheme();
 const { reducedMotion, setReducedMotion } = useReducedMotionPreference();
 const toast = useToast();
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
   toast.info(next ? 'Arena alerts enabled' : 'Arena alerts disabled');
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
     toast.error('Failed to update alert settings');
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
   toast.info(`Theme set to ${theme === 'dark' ? 'Light' : 'Dark'}`);
 };

 const handleSoundToggle = () => {
   setSoundEnabled(prev => {
     const next = !prev;
     toast.info(next ? 'Sound FX enabled' : 'Sound FX muted');
     return next;
   });
   telegramHaptic('light');
 };

 const handleReducedMotionToggle = () => {
   const next = !reducedMotion;
   setReducedMotion(next);
   telegramHaptic('light');
   toast.info(next ? 'Reduced motion active' : 'Full animations active');
 };

 return (
  <LayoutWrapper className="w-full pt-[max(0.75rem,var(--app-safe-top))]">
  <main className="w-full max-w-sm md:max-w-xl lg:max-w-3xl flex flex-col items-center px-3.5 mx-auto space-y-4 pt-1 pb-[calc(84px+var(--app-safe-bottom))]">

  {/* Page Title & Subtitle Centered in 1 Line */}
  <header className="w-full text-center flex flex-col items-center mb-1">
  <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1 whitespace-nowrap leading-none header-balanced">
  {t('title')}
  </h1>
  <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] leading-none mt-1">
  {t('subtitle')}
  </p>
  </header>

  {/* Standalone Glowing Premium Card */}
  <Link href={`/${locale}/membership`} className="w-full block">
    <Card variant="premium" interactive className="p-3.5 sm:p-4 flex items-center justify-between border-brand-gold/30 hover:border-brand-gold/60">
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold text-sm shrink-0">
          <FaGem />
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
    </Card>
  </Link>

  {/* Section: Gameplay & Visuals */}
  <section aria-labelledby="gameplay-visuals-heading" className="w-full space-y-2.5">
    <h2 id="gameplay-visuals-heading" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.3em] text-center w-full">
      {t.has('gameplay_visuals') ? t('gameplay_visuals') : 'Gameplay & Visuals'}
    </h2>
    <Card variant="x-panel" className="divide-y divide-brand-border-opacity-10">
      
      {/* Theme row */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border">
            {theme === 'dark' ? <FaMoon /> : <FaSun />}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
              {t('luminance_mode')}
            </span>
            <span className="text-[10px] font-bold text-brand-muted tracking-widest uppercase">
              {theme === 'dark' ? t('deep_void') : t('solar_flare')}
            </span>
          </div>
        </div>
        <Switch
          checked={theme === 'dark'}
          onChange={handleThemeToggle}
          aria-label={t('luminance_mode')}
        />
      </div>

      {/* Reduce motion row */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border">
            <FaUniversalAccess />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
              {t('reduce_motion')}
            </span>
            <span className="text-[10px] font-bold text-brand-muted tracking-widest uppercase">
              {reducedMotion ? t('reduce_motion_on') : t('reduce_motion_off')}
            </span>
          </div>
        </div>
        <Switch
          checked={reducedMotion}
          onChange={handleReducedMotionToggle}
          aria-label={t('reduce_motion')}
        />
      </div>

      {/* Sound effects row */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border">
            <FaVolumeUp />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
              {t('audio_protocol')}
            </span>
            <span className="text-[10px] font-bold text-brand-muted tracking-widest uppercase">
              {soundEnabled ? t('active_sync') : t('muted')}
            </span>
          </div>
        </div>
        <Switch
          checked={soundEnabled}
          onChange={handleSoundToggle}
          aria-label={t('audio_protocol')}
        />
      </div>
    </Card>
  </section>

  {/* Section: Notifications & Wallet */}
  <section aria-labelledby="notifications-wallet-heading" className="w-full space-y-2.5">
    <h2 id="notifications-wallet-heading" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.3em] text-center w-full">
      {t.has('notifications_wallet') ? t('notifications_wallet') : 'Notifications & Wallet'}
    </h2>
    <Card variant="x-panel" className="divide-y divide-brand-border-opacity-10">
      
      {/* Arena alerts row */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border">
            <FaTrophy />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1">
              {t('arena_alerts')}
            </span>
            <span className="text-[10px] font-bold text-brand-muted tracking-widest uppercase">
              {arenaAlerts ? t('arena_alerts_on') : t('arena_alerts_off')}
            </span>
          </div>
        </div>
        <Switch
          checked={arenaAlerts}
          onChange={handleArenaAlertsToggle}
          aria-label={t('arena_alerts')}
        />
      </div>

      {/* TON Wallet Card (Inside group now) */}
      <Link href={`/${locale}/wallet`} className="w-full block">
        <div className="p-4 flex items-center justify-between hover:bg-brand-bg-opacity-5 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border-opacity-10">
              <FaWallet />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-none mb-1 flex items-center">
                {t('ton_wallet')}
              </span>
              <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : t('ton_not_connected')}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 flex items-center justify-center opacity-40">
            <FaArrowLeft className="rotate-180 text-[10px] text-brand-primary" />
          </div>
        </div>
      </Link>
    </Card>
  </section>
  
  {/* Section: Support & Security */}
  <section aria-labelledby="support-security-heading" className="w-full space-y-3">
    <h2 id="support-security-heading" className="text-[10px] font-black uppercase text-brand-muted tracking-[0.3em] text-center w-full">
      {t.has('support_security') ? t('support_security') : 'Support & Security'}
    </h2>
    
    <Card variant="x-panel" className="divide-y divide-brand-border-opacity-10">
      
      {/* Language row */}
      <div className="p-4 flex items-center justify-between">
        <LanguageSwitcher />
      </div>

      {/* FAQ items directly integrated */}
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
              <div className="w-6 h-6 rounded-lg bg-brand-elevated flex items-center justify-center text-brand-muted border border-brand-border-opacity-10 shrink-0">
                <FaQuestionCircle className="text-xs" />
              </div>
              <span className="text-xs font-bold text-brand-primary uppercase tracking-wide leading-tight">
                {t(item.q)}
              </span>
            </div>
            <motion.div
              animate={{ rotate: openFaq === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-brand-muted shrink-0"
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
            <div className="px-4 pb-4 pl-[45px] text-[10px] font-medium text-brand-muted leading-relaxed text-left uppercase tracking-wide">
              {t(item.a)}
            </div>
          </motion.div>
        </div>
      ))}
    </Card>

    {/* Admin Command Center Card - Standalone if present */}
    {isAdmin && (
      <Card variant="solid" interactive className="mt-3 border-brand-danger/20 animate-pulse-slow">
        <Link href={`/${locale}/admin`} className="flex items-center justify-between p-3.5 group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-brand-danger/10 flex items-center justify-center text-brand-danger opacity-80 shadow-neon shrink-0">
                <FaShieldAlt />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-brand-primary tracking-tight leading-tight">{t.has('command_center') ? t('command_center') : 'Command Center'}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-brand-danger text-brand-void tracking-wide">{t.has('admin') ? t('admin') : 'ADMIN'}</span>
              </div>
              <span className="text-[10px] font-bold text-brand-danger uppercase tracking-wider leading-none">
                {t.has('manage_admin') ? t('manage_admin') : 'Manage users, payouts & broadcasts'}
              </span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border border-brand-border-opacity-10 bg-brand-elevated flex items-center justify-center">
            <FaArrowLeft className="rotate-180 text-[10px] text-brand-primary" />
          </div>
        </Link>
      </Card>
    )}
  </section>
 
  {/* versioning */}
  <footer className="w-full mt-8 flex flex-col items-center opacity-20 select-none pointer-events-none text-center">
  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t('footer')}</span>
  </footer>
  </main>
  </LayoutWrapper>
 );
}
