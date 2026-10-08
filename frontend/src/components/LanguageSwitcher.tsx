'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { FiGlobe, FiCheck, FiChevronRight } from 'react-icons/fi';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';

export default function LanguageSwitcher() {
    const t = useTranslations('Language');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false);
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
            try { localStorage.setItem("preferred_language", nextLocale); } catch { /* restricted WebView */ }
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

    return <>
      <Button variant="secondary" className="w-full justify-between p-4 text-start" disabled={isPending} aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => setIsOpen(true)}>
        <FiGlobe size={20} aria-hidden="true" className="shrink-0 text-brand-muted" />
        <span className="flex-1"><span className="block text-caption text-brand-muted">{t('select')}</span><span className="mt-1 block">{currentLang.name}</span></span>
        <FiChevronRight size={18} aria-hidden="true" className="rtl:rotate-180" />
      </Button>
      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title={t('select')}>
        <div className="space-y-2">
          {languages.map(language => <Button key={language.code} variant="secondary" className="w-full justify-between text-start" aria-pressed={language.code === locale} onClick={() => selectLanguage(language.code)}>
            <span lang={language.code} className="flex-1">{language.name}</span>
            {language.code === locale && <FiCheck size={18} className="text-brand-success" aria-hidden="true" />}
          </Button>)}
        </div>
      </Drawer>
    </>;
}
