'use client';

import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';

export default function TelegramInit() {
    const { theme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isTMA = window.Telegram?.WebApp && (window.Telegram.WebApp as any).initData;
            const hasWebAuth = localStorage.getItem('telegram_web_auth');
            
            // Allow admin or public routes if any, otherwise redirect to login
            if (!isTMA && !hasWebAuth && pathname && !pathname.includes('/login')) {
                const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
                const locale = localeMatch ? localeMatch[1] : 'en';
                const validLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'];
                const targetLocale = validLocales.includes(locale) ? locale : 'en';
                router.replace(`/${targetLocale}/login`);
                return;
            }

            if (isTMA) {
                const tg = window.Telegram!.WebApp as any;

                // tg.ready() is intentionally omitted here; it is called by AuthGuard 
                // once the application logic and auth states are fully resolved.

                // Expand the Mini App to the maximum available height
                tg.expand();

            // Request fullscreen mode if supported (Telegram Bot API 8.0+)
            try {
                if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
                    tg.requestFullscreen();
                    console.log('Telegram WebApp Fullscreen requested');
                }
            } catch (e) {
                console.warn('Failed to request fullscreen', e);
            }

            // Disable vertical swipes to prevent accidental closing on swipe down (Telegram Bot API 7.7+)
            try {
                if (tg.disableVerticalSwipes) {
                    tg.disableVerticalSwipes();
                    console.log('Telegram WebApp vertical swipes disabled');
                }
            } catch (e) {
                console.warn('Failed to disable vertical swipes', e);
            }

            // Enable closing confirmation to prevent accidental exits (optional but good for games)
            try {
                tg.enableClosingConfirmation();
            } catch (e) {
                console.warn('Failed to enable closing confirmation', e);
            }

            console.log('Telegram WebApp Initialized: Expanded & Ready');
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp as any;
            try {
                const color = theme === 'light' ? '#F3F4F6' : '#000000';
                tg.setHeaderColor(color);
                tg.setBackgroundColor(color);
            } catch (e) {
                console.warn('Failed to set Telegram theme colors', e);
            }
        }
    }, [theme]);

    return null;
}
