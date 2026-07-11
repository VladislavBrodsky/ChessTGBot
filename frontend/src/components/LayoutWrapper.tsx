'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Onboarding from './Onboarding';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { useNavbar } from '@/context/NavbarContext';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}
let globalActiveGameChecked = false;
let globalActiveGameId: string | null = null;
let globalIsTelegramWeb: boolean | null = null;
let globalIsDesktopBrowser: boolean | null = null;

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    // Safely extract game ID from window URL on client without useSearchParams deopt
    let urlGameId: string | null = null;
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        urlGameId = params.get('id');
    }

    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [activeGameId, setActiveGameId] = useState<string | null>(globalActiveGameId);
    const [isCheckingActiveGame, setIsCheckingActiveGame] = useState<boolean>(!globalActiveGameChecked);
    const [isTelegramWeb, setIsTelegramWeb] = useState<boolean>(() => {
        if (globalIsTelegramWeb !== null) return globalIsTelegramWeb;
        return false;
    });
    // true when running in a real desktop browser (not inside Telegram)
    const [isDesktopBrowser, setIsDesktopBrowser] = useState<boolean>(() => {
        if (globalIsDesktopBrowser !== null) return globalIsDesktopBrowser;
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isIframe = window.self !== window.top;
            const isWebPlatform = window.Telegram?.WebApp && ['weba', 'webk', 'web', 'desktop', 'unknown'].includes(window.Telegram.WebApp.platform);
            const isTMA = !!(window as any).Telegram?.WebApp?.initData;
            
            const isTgWeb = !!(isIframe || isWebPlatform);
            const hasWebAuth = !!localStorage.getItem('telegram_web_auth');
            const isDesktop = !isTMA && hasWebAuth && window.innerWidth >= 768;

            globalIsTelegramWeb = isTgWeb;
            globalIsDesktopBrowser = isDesktop;

            setIsTelegramWeb(isTgWeb);
            setIsDesktopBrowser(isDesktop);
        }
    }, []);

    // Use context-driven navbar hide state (reliable, no DOM polling)
    const { isHidden: isNavbarHiddenByContext } = useNavbar();

    // Check active game status and redirect if needed
    const checkActiveGame = async () => {
        try {
            const res = await apiFetch('/api/v1/game/active');
            if (res.ok) {
                const data = await res.json();
                const activeId = data.active_game_id || null;
                setActiveGameId(activeId);
                globalActiveGameId = activeId;
                globalActiveGameChecked = true;
                
                if (activeId) {
                    const isGamePage = pathname === `/${locale}/game` || pathname === '/game';
                    if (!isGamePage || urlGameId !== activeId) {
                        router.replace(`/${locale}/game?id=${activeId}`);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to check active game", err);
        } finally {
            setIsCheckingActiveGame(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const completed = localStorage.getItem("onboarding_completed");
            if (completed !== "true") {
                setShowOnboarding(true);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            checkActiveGame();
        }
    }, [pathname, locale, urlGameId]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) return;
        const tg = window.Telegram.WebApp;
        if (!tg.BackButton) return;

        const isHomePage = pathname === '/' || pathname.endsWith('/home') || pathname === `/${locale}`;
        const hasActiveGame = !!activeGameId || !!urlGameId;
        const shouldShow = !isHomePage && !hasActiveGame;

        const handleBackClick = () => {
            if (pathname.includes('/admin')) {
                window.location.href = `/${locale}/settings`;
            } else if (pathname.includes('/game')) {
                router.push(`/${locale}/home`);
            } else {
                router.back();
            }
        };

        if (shouldShow) {
            tg.BackButton.show();
            document.documentElement.classList.add('tg-back-button-active');
            tg.onEvent('backButtonClicked', handleBackClick);
        } else {
            tg.BackButton.hide();
            document.documentElement.classList.remove('tg-back-button-active');
        }

        return () => {
            try {
                tg.offEvent('backButtonClicked', handleBackClick);
                document.documentElement.classList.remove('tg-back-button-active');
            } catch (err) {
                console.warn('Telegram BackButton offEvent failed', err);
            }
        };
    }, [pathname, locale, router, activeGameId, urlGameId]);

    const { theme, toggleTheme } = useTheme();

    const isCorePage = pathname.endsWith('/game') || pathname.endsWith('/home') || pathname === '/' || pathname === `/${locale}`;

    const isMainNavbarPage = 
        pathname.endsWith('/home') || 
        pathname.endsWith('/settings') || 
        pathname.endsWith('/profile') || 
        pathname.endsWith('/wallet') || 
        pathname.endsWith('/challenges') || 
        (pathname.endsWith('/academy') && !pathname.includes('/lesson/') && !pathname.includes('/puzzle'));

    // On main dashboard pages (home, settings, wallet, etc.) the navbar is NEVER
    // hidden — no exceptions. Every conditional hide here has eventually stranded
    // users with no menu (stale activeGameId, leftover context hides, states stuck
    // during the active-game check on iOS Telegram). Overlays that must cover it
    // (Onboarding, modals) render at z-index >= 100 above the z-50 navbar, so
    // hiding it for them is redundant anyway.
    const shouldHideNavbar = isMainNavbarPage
        ? false
        : (showOnboarding || !!activeGameId || (isCorePage && isCheckingActiveGame) || isNavbarHiddenByContext);

    return (
        <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-brand-void text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void">
            {/* Ambient Starfield */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Content Container */}
            <main className={`relative z-10 w-full overflow-x-hidden flex flex-col items-center min-h-[100dvh] ${
                isDesktopBrowser
                    // Desktop: sidebar is 72px wide; top padding only
                    ? 'md:pl-[72px] pt-6 pb-8'
                    : isTelegramWeb
                        ? 'pt-[calc(24px+var(--tg-content-safe-area-inset-top,var(--tg-safe-area-inset-top,0px)))] pb-[calc(150px+var(--app-safe-bottom))]'
                        : 'pt-[calc(24px+var(--tg-content-safe-area-inset-top,var(--tg-safe-area-inset-top,0px)))] pb-[calc(100px+var(--app-safe-bottom))]'
            } ${className}`}>
                {isCorePage && isCheckingActiveGame ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] mt-3.5 opacity-40 animate-pulse text-brand-primary">
                            INITIALIZING ARENA...
                        </span>
                    </div>
                ) : (
                    children
                )}
            </main>

            <Navbar hide={shouldHideNavbar} />

            <AnimatePresence>
                {showOnboarding && (
                    <Onboarding onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
