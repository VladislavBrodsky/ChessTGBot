'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaArrowLeft, FaPalette, FaVolumeUp, FaMoon, FaSun } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";
import { useTranslations, useLocale } from 'next-intl';
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function SettingsPage() {
    const t = useTranslations('Settings');
    const locale = useLocale();
    const { theme, toggleTheme, setTheme } = useTheme();
    const [soundEnabled, setSoundEnabled] = useState(true);

    return (
        <LayoutWrapper className="justify-start pt-8 pb-32">
            <div className="w-full max-w-sm flex flex-col items-start px-4 mx-auto">
                {/* Immersive Header */}
                <div className="w-full flex justify-between items-center mb-10">
                    <Link href={`/${locale}/home`}>
                        <motion.button
                            whileHover={{ x: -2 }}
                            className="text-brand-primary/40 hover:text-brand-primary transition-colors flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <FaArrowLeft className="text-[10px]" />
                            <span>{t('return')}</span>
                        </motion.button>
                    </Link>
                    <div className="px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">
                        {t('config_core')}
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-black text-brand-primary italic tracking-tighter uppercase mb-2">{t('title')}</h1>
                    <p className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.3em]">{t('subtitle')}</p>
                </div>

                {/* Section: Appearance */}
                <div className="w-full space-y-4 mb-10">
                    <h3 className="text-[9px] font-black uppercase text-brand-primary/10 tracking-[0.5em] ml-2 mb-4">{t('visual_matrix')}</h3>

                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-5 rounded-2xl border-brand-primary/5 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary/40">
                                    {theme === 'dark' ? <FaMoon /> : <FaSun />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-brand-primary uppercase tracking-tight leading-none mb-1">{t('luminance_mode')}</span>
                                    <span className="text-[9px] font-bold text-brand-primary/20 tracking-widest uppercase">
                                        {theme === 'dark' ? t('deep_void') : theme === 'light' ? t('solar_flare') : t('nebula_protocol')}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${theme === 'dark' ? 'bg-brand-primary shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-brand-primary/10'}`}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-brand-void' : 'bg-brand-primary/40'}`}
                                />
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="w-full glass-panel p-5 rounded-2xl border-brand-primary/5 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary/40 text-lg">
                                    <FaVolumeUp />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-brand-primary uppercase tracking-tight leading-none mb-1">{t('audio_protocol')}</span>
                                    <span className="text-[9px] font-bold text-brand-primary/20 tracking-widest uppercase">{soundEnabled ? t('active_sync') : t('muted')}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${soundEnabled ? 'bg-brand-primary' : 'bg-brand-primary/10'}`}
                            >
                                <motion.div
                                    layout
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className={`w-4 h-4 rounded-full ${soundEnabled ? 'bg-brand-void' : 'bg-brand-primary/40'}`}
                                />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Section: Language */}
                <div className="w-full space-y-4 mb-10">
                    <h3 className="text-[9px] font-black uppercase text-brand-primary/10 tracking-[0.5em] ml-2 mb-4">{t('language_matrix')}</h3>
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <LanguageSwitcher />
                    </motion.div>
                </div>

                {/* Section: Premium Status */}
                <div className="w-full space-y-4">
                    <h3 className="text-[9px] font-black uppercase text-brand-primary/10 tracking-[0.5em] ml-2 mb-4">{t('neural_tier')}</h3>

                    <Link href="/membership" className="w-full block">
                        <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full glass-panel p-5 rounded-2xl border-brand-primary/5 flex items-center justify-between group hover:bg-brand-primary/5 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-primary/5 flex items-center justify-center text-2xl grayscale opacity-30 group-hover:opacity-100 transition-opacity">
                                    ⭐
                                </div>
                                <div className="flex flex-col text-left">
                                    <span className="text-sm font-black text-brand-primary italic tracking-tighter uppercase leading-none mb-1">Premium Status</span>
                                    <span className="text-[9px] font-bold text-brand-primary/20 uppercase tracking-widest">{t('enhanced_access')}</span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full border border-brand-primary/5 flex items-center justify-center opacity-10 group-hover:opacity-100 transition-all">
                                <FaArrowLeft className="rotate-180 text-[10px] text-brand-primary" />
                            </div>
                        </motion.button>
                    </Link>
                </div>

                {/* Legal / versioning */}
                <div className="w-full mt-20 flex flex-col items-center opacity-10 select-none pointer-events-none text-center">
                    <div className="w-12 h-px bg-brand-primary mb-4" />
                    <span className="text-[8px] font-bold tracking-[0.2em] italic uppercase">{t('footer')}</span>
                </div>
            </div>
        </LayoutWrapper>
    );
}
