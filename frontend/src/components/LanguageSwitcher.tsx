'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChangeEvent, useState, useTransition } from 'react';
import { FaGlobe } from 'react-icons/fa';

export default function LanguageSwitcher() {
    const t = useTranslations('Language');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

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

    const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;

        // Redirect to the new locale path
        // Since we are using next-intl middleware, we just need to replace the locale segment
        // However, simplest way with standard router is just to construct the path
        // Or use next-intl's Link/useRouter if configured, but here standard works if we manually build it
        // The middleware handles /locale/path

        // A robust way:
        const segments = pathname.split('/');
        // segments[0] is empty, segments[1] is locale
        segments[1] = nextLocale;
        const newPath = segments.join('/');

        startTransition(() => {
            router.replace(newPath);
        });
    };

    return (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-brand-surface border border-brand-primary/10">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/5 flex items-center justify-center text-brand-primary">
                <FaGlobe size={20} />
            </div>
            <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest leading-none mb-1">{t('select')}</span>
                <select
                    defaultValue={locale}
                    onChange={onSelectChange}
                    disabled={isPending}
                    className="bg-transparent text-brand-primary font-bold text-sm focus:outline-none cursor-pointer"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code} className="bg-brand-surface text-brand-primary">
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
