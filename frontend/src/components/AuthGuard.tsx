'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FaChessKnight } from 'react-icons/fa';
import { hasE2ETestIdentity } from '@/lib/e2eTestMode';

const VALID_LOCALES = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'];

// How long to keep waiting for the Telegram SDK before concluding a visitor is NOT a
// Telegram Mini App session. The SDK (telegram-web-app.js) loads asynchronously —
// `beforeInteractive` is only honored in the root layout, and ours lives in the nested
// [locale] layout — so on a cold launch window.Telegram.WebApp may not exist yet when
// this guard first runs. Redirecting to /login during that window bounced real TMA users
// to the login page and (because /login never called tg.ready() for them) left Telegram
// showing its loading placeholder — the "app opens only on the second try" bug. We wait it
// out instead of redirecting eagerly.
const SDK_WAIT_MS = 2500;

/**
 * AuthGuard wraps all protected pages.
 * It shows a fullscreen loading state while checking localStorage/TMA auth,
 * then either:
 *  - renders children (authenticated), or
 *  - hard-redirects to /{locale}/login (unauthenticated)
 *
 * This prevents ANY flash of protected content for unauthenticated users.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // 'checking' → still verifying | 'authed' → show children | 'redirecting' → blocking
    const [authState, setAuthState] = useState<'checking' | 'authed' | 'redirecting'>('checking');
    const redirected = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const w = window as any;

        // Login page itself is always public
        if (pathname?.includes('/login')) {
            setAuthState('authed');
            if (w.Telegram?.WebApp?.initData) {
                w.Telegram.WebApp.ready();
            }
            return;
        }

        let cancelled = false;
        const startedAt = Date.now();

        const localeFromPath = () => {
            const m = pathname?.match(/^\/([a-z]{2})(?:\/|$)/);
            return m && VALID_LOCALES.includes(m[1]) ? m[1] : 'en';
        };

        // Returns true when a terminal decision was reached (stop polling),
        // false when the Telegram SDK might still be loading (keep polling).
        const resolve = (): boolean => {
            if (cancelled || redirected.current) return true;

            const tg = w.Telegram?.WebApp;
            const isTMA = !!tg?.initData;
            // localStorage can throw a SecurityError inside Telegram Web's cross-origin
            // (third-party) iframe when the browser blocks third-party storage. Never let
            // that crash the render — a Telegram session is identified by initData anyway.
            let hasWebAuth = false;
            try { hasWebAuth = !!localStorage.getItem('telegram_web_auth'); } catch { /* storage blocked */ }

            if (isTMA || hasWebAuth || hasE2ETestIdentity()) {
                setAuthState('authed');
                if (isTMA) {
                    // tg.ready() is also called eagerly in TelegramInit; it is idempotent.
                    try { tg.ready(); } catch { /* noop */ }
                }
                return true;
            }

            // Not authenticated yet. Decide whether the Telegram SDK might still be loading —
            // if so, keep waiting rather than bouncing a real TMA session to /login.
            //   - tg present  => the WebApp object has parsed the launch params; initData is
            //                    final, so an empty initData means this is genuinely not a TMA.
            //   - hash hint   => Telegram passes launch data via the URL hash before the SDK
            //                    consumes it; its presence means a TMA launch is still in flight.
            const sdkPresent = !!tg;
            const telegramHash = /tgWebApp(Data|Platform|Version)/.test(w.location.hash || '');
            const timedOut = Date.now() - startedAt >= SDK_WAIT_MS;

            if (!timedOut && (!sdkPresent || telegramHash)) {
                return false; // still possibly a TMA launch — wait for the SDK
            }

            // Genuinely unauthenticated — hard redirect once for an instant, flash-free bounce.
            redirected.current = true;
            setAuthState('redirecting');
            window.location.replace(`/${localeFromPath()}/login`);
            return true;
        };

        if (resolve()) return;

        const interval = setInterval(() => {
            if (resolve()) clearInterval(interval);
        }, 100);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [pathname]);

    if (authState === 'checking' || authState === 'redirecting') {
        return (
            <div
                className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-brand-void"
                style={{ background: 'var(--color-void, #000)' }}
            >
                {/* Animated chess knight */}
                <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute w-20 h-20 rounded-full bg-brand-primary/10 animate-ping" />
                    <FaChessKnight
                        className="text-brand-primary relative z-10 animate-pulse"
                        size={48}
                        style={{ color: 'var(--color-primary, #ffffff)' }}
                    />
                </div>
                <p
                    className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse"
                    style={{ color: 'var(--color-primary, #ffffff)', opacity: 0.6 }}
                >
                    Verifying Auth…
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
