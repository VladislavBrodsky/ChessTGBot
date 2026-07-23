'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function TelegramInit() {
    const { theme } = useTheme();
    // Read the latest theme from inside the SDK-init effect without re-running it.
    const themeRef = useRef(theme);
    themeRef.current = theme;

    // Initialize the Telegram WebApp as soon as its SDK is available.
    //
    // The SDK (telegram-web-app.js) actually loads ASYNCHRONOUSLY: `strategy="beforeInteractive"`
    // is only honored in the ROOT app/layout.tsx, and ours lives in the nested [locale]
    // layout, so window.Telegram.WebApp may not exist yet when this effect first runs on a
    // cold launch. We poll briefly and, the moment it appears, call ready() FIRST — that is
    // what tells Telegram to hide its own loading placeholder and reveal our UI. This is
    // deliberately decoupled from auth resolution and route redirects; if we wait for those
    // (as before), a slow/racing SDK leaves Telegram stuck on its placeholder and the app
    // appears to "open only on the second try".
    //
    // Auth gating lives solely in AuthGuard now — TelegramInit no longer redirects, to avoid
    // a second racy redirect fighting AuthGuard.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        let cancelled = false;
        const startedAt = Date.now();
        const MAX_WAIT_MS = 3000;

        const init = (): boolean => {
            const tg = (window as any).Telegram?.WebApp;
            if (!tg) return false;

            // Signal readiness immediately — this clears Telegram's loading placeholder.
            try { tg.ready(); } catch { /* noop */ }

            // Expand the Mini App to the maximum available height.
            try { tg.expand(); } catch { /* noop */ }

            // Sync header/background colors right away so there is no color flash while the
            // theme effect below settles (that effect may run before the SDK has loaded).
            try {
                const color = themeRef.current === 'light' ? '#F3F4F6' : '#000000';
                tg.setHeaderColor?.(color);
                tg.setBackgroundColor?.(color);
            } catch { /* noop */ }

            // Request fullscreen mode if supported (Telegram Bot API 8.0+).
            try {
                if (tg.isVersionAtLeast && tg.isVersionAtLeast('8.0') && tg.requestFullscreen) {
                    tg.requestFullscreen();
                }
            } catch (e) {
                console.warn('Failed to request fullscreen', e);
            }

            // This is a mobile-only gesture. Telegram Web applies the host setting to
            // the embedded page too, which prevents normal mouse-wheel scrolling.
            const isMobileTelegram = tg.platform === 'ios' || tg.platform === 'android';
            try {
                if (isMobileTelegram) tg.disableVerticalSwipes?.();
            } catch (e) {
                console.warn('Failed to disable vertical swipes', e);
            }

            // Enable closing confirmation to prevent accidental exits (good for games).
            try {
                tg.enableClosingConfirmation();
            } catch (e) {
                console.warn('Failed to enable closing confirmation', e);
            }

            console.log('Telegram WebApp initialized: ready & expanded');
            return true;
        };

        // Fast path: SDK already present on mount.
        if (init()) return;

        // Otherwise poll until the async SDK script has executed (or we give up).
        const interval = setInterval(() => {
            if (cancelled) return;
            if (init() || Date.now() - startedAt >= MAX_WAIT_MS) {
                clearInterval(interval);
            }
        }, 100);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    // Keep Telegram header/background colors in sync with later theme changes.
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
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
