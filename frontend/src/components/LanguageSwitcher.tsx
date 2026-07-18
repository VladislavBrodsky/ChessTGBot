'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { FaGlobe, FaCheck, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useNavbar } from '@/context/NavbarContext';

export default function LanguageSwitcher() {
    const t = useTranslations('Language');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
    const [canClose, setCanClose] = useState(false);
    const { pushHide, popHide } = useNavbar();

    useEffect(() => {
        if (isOpen) {
            pushHide();
            return () => popHide();
        }
    }, [isOpen, pushHide, popHide]);

    // Cooldown to prevent double-clicks/mouseup race conditions on desktop from closing drawer instantly on mount
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                setCanClose(true);
            }, 250);
            return () => clearTimeout(timer);
        } else {
            setCanClose(false);
        }
    }, [isOpen]);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
        { code: 'ru', name: 'Русский', flag: '🇷🇺' },
        { code: 'pt', name: 'Português', flag: '🇧🇷' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
        { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' },
    ];

    const currentLang = languages.find(l => l.code === locale) || languages[0];

    const selectLanguage = (nextLocale: string) => {
        const segments = pathname.split('/');
        segments[1] = nextLocale;
        const newPath = segments.join('/');

        setIsOpen(false);

        // Save selected language in localStorage for root redirection persistence
        if (typeof window !== "undefined") {
            localStorage.setItem("preferred_language", nextLocale);
        }

        // Synchronize with backend database
        apiFetch("/api/v1/gamification/language", {
            method: "PUT",
            body: JSON.stringify({ language: nextLocale })
        }).catch(err => console.error("Failed to sync language to backend:", err));

        startTransition(() => {
            router.replace(newPath);
        });
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                disabled={isPending}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-brand-surface border border-brand-border-opacity-10 hover:bg-brand-bg-opacity-5 transition-all text-left cursor-pointer shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-bg-opacity-5 flex items-center justify-center text-brand-primary">
                        <FaGlobe size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest leading-none mb-1.5">{t('select') || 'Select Language'}</span>
                        <span className="text-xs font-bold text-brand-primary">
                            {currentLang.flag} {currentLang.name}
                        </span>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-brand-muted uppercase tracking-widest px-2">
                    {isPending ? 'Syncing...' : 'Change'}
                </div>
            </button>

            {/* Bottom Drawer Sheet */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div className="bottom-drawer-backdrop z-[100]">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { if (canClose) setIsOpen(false); }}
                            className="absolute inset-0 bg-[rgba(0,0,0,0.4)]" style={{ touchAction: 'none' }}
                        />

                        {/* Sheet Container */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            className="bottom-drawer-sheet relative z-10 max-h-[75vh]"
                        >
                            {/* Drag Handle */}
                            <div className="bottom-drawer-handle" />

                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-brand-border-opacity-10 pb-3 mb-2">
                                <span className="text-xs font-black uppercase tracking-widest text-brand-primary">
                                    {t('select') || 'Select Language'}
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-brand-muted hover:opacity-100 transition-opacity p-1 cursor-pointer"
                                >
                                    <FaTimes size={12} />
                                </button>
                            </div>

                            {/* Language List */}
                            <div className="flex flex-col space-y-2 overflow-y-auto max-h-[50vh] pr-1">
                                {languages.map((lang) => {
                                    const isSelected = lang.code === locale;
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => selectLanguage(lang.code)}
                                            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${
                                                isSelected
                                                    ? 'border-brand-primary bg-brand-bg-opacity-5 text-brand-primary font-black shadow-sm'
                                                    : 'border-brand-border-opacity-5 bg-brand-surface hover:bg-brand-bg-opacity-5 text-brand-primary'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg leading-none">{lang.flag}</span>
                                                <span className="text-xs font-bold uppercase tracking-wider">{lang.name}</span>
                                            </div>
                                            {isSelected && (
                                                <FaCheck size={10} className="text-brand-primary" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
