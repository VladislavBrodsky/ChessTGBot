'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { FaChessKnight } from 'react-icons/fa';

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

        // Login page itself is always public
        if (pathname?.includes('/login')) {
            setAuthState('authed');
            const isTMA = !!(window as any).Telegram?.WebApp?.initData;
            if (isTMA) {
                (window as any).Telegram?.WebApp?.ready();
            }
            return;
        }

        const isTMA = !!(window as any).Telegram?.WebApp?.initData;
        const hasWebAuth = !!localStorage.getItem('telegram_web_auth');

        if (isTMA || hasWebAuth) {
            setAuthState('authed');
            if (isTMA) {
                // tg.ready() is delayed until AuthGuard completes verification
                (window as any).Telegram?.WebApp?.ready();
            }
            return;
        }

        // Not authenticated — redirect immediately
        if (!redirected.current) {
            redirected.current = true;
            setAuthState('redirecting');

            const localeMatch = pathname?.match(/^\/([a-z]{2})(?:\/|$)/);
            const validLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'];
            const locale = localeMatch && validLocales.includes(localeMatch[1]) ? localeMatch[1] : 'en';

            // Use window.location for an instant, hard redirect — no flash
            window.location.replace(`/${locale}/login`);
        }
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
