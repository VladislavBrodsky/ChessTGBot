'use client';

import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Onboarding from './Onboarding';
import RegionPrompt from './RegionPrompt';
import NotificationModal from './NotificationModal';
import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useNavbar } from '@/context/NavbarContext';
import { usePathname, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { FiSettings, FiBell } from 'react-icons/fi';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
    bgClass?: string;
    hideHeaderControls?: boolean;
}
let globalActiveGameChecked = false;
let globalActiveGameId: string | null = null;
let globalIsTelegramWeb: boolean | null = null;
let globalIsDesktopBrowser: boolean | null = null;

export default function LayoutWrapper({ children, className = "", bgClass = "bg-brand-void", hideHeaderControls = false }: LayoutWrapperProps) {
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
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
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
            const isWebPlatform = window.Telegram?.WebApp && ['weba', 'webk', 'web', 'desktop', 'unknown'].includes(window.Telegram.WebApp.platform as string);
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
  const checkActiveGame = useCallback(async () => {
        // LayoutWrapper is rendered by individual pages. Once the active-game
        // status is known for this app session, do not repeat this network
        // check on every route transition and compete with the next screen.
        if (globalActiveGameChecked) {
            setActiveGameId(globalActiveGameId);
            setIsCheckingActiveGame(false);
            return;
        }

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
  }, [pathname, locale, urlGameId, router]);

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
  }, [checkActiveGame]);

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
            tg.onEvent?.('backButtonClicked', handleBackClick);
        } else {
            tg.BackButton.hide();
            document.documentElement.classList.remove('tg-back-button-active');
        }

        return () => {
            try {
                tg.offEvent?.('backButtonClicked', handleBackClick);
                document.documentElement.classList.remove('tg-back-button-active');
            } catch (err) {
                console.warn('Telegram BackButton offEvent failed', err);
            }
        };
    }, [pathname, locale, router, activeGameId, urlGameId]);



    const isCorePage = pathname.endsWith('/game') || pathname.endsWith('/home') || pathname === '/' || pathname === `/${locale}`;

    const isMainNavbarPage = 
        pathname.endsWith('/home') || 
        pathname.endsWith('/settings') || 
        pathname.endsWith('/profile') || 
        pathname.endsWith('/wallet') || 
        pathname.endsWith('/challenges') || 
        (pathname.endsWith('/academy') && !pathname.includes('/lesson/') && !pathname.includes('/puzzle'));

    // On main dashboard pages (home, settings, wallet, etc.) the navbar is generally not
    // hidden by game state. However, if a modal/drawer is open (isNavbarHiddenByContext),
    // we MUST hide it so it doesn't bleed through backdrop blurs.
    const shouldHideNavbar = isNavbarHiddenByContext || showOnboarding || (
        !isMainNavbarPage && !!activeGameId
    );

    return (
        <div className={`app-shell relative min-h-[100dvh] w-full overflow-x-hidden ${bgClass} text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void`}>
            {/* Ambient Starfield */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Top-Right Header (Settings & Notifications) — only rendered on /home if not suppressed.
                Home page passes hideHeaderControls and renders them inline instead, so this block
                is effectively a no-op on all pages. Kept here for any future page that opts in. */}
            {isMainNavbarPage && pathname.endsWith('/home') && !hideHeaderControls && !showOnboarding && !isCheckingActiveGame && (
                <div className="absolute top-[calc(24px+var(--app-safe-top))] right-4 md:right-[calc(50%-272px)] lg:right-[calc(50%-368px)] z-50 flex items-center gap-2.5">
                    <button 
                        onClick={() => setShowNotifications(true)}
                        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-brand-surface/60 backdrop-blur-md border border-brand-border-opacity-10 shadow-lg text-brand-primary/80 hover:text-brand-primary transition-colors active:scale-95 cursor-pointer"
                    >
                        <FiBell size={18} />
                        {/* Notification indicator dot */}
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </button>
                    {!pathname.endsWith('/settings') && (
                        <Link href={`/${locale}/settings`}>
                            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-brand-surface/60 backdrop-blur-md border border-brand-border-opacity-10 shadow-lg text-brand-primary/80 hover:text-brand-primary transition-colors active:scale-95 cursor-pointer">
                                <FiSettings size={18} />
                            </button>
                        </Link>
                    )}
                </div>
            )}

            {/* Content Container */}
            <main className={`relative z-10 w-full flex flex-col items-center min-h-[100dvh] ${
                isDesktopBrowser
                    // Desktop: sidebar is 72px wide; top padding only
                    ? 'md:pl-[72px] pt-6 pb-8'
                    : isTelegramWeb
                        ? 'pt-[calc(28px+var(--app-safe-top))] pb-[calc(150px+var(--app-safe-bottom))]'
                        : 'pt-[calc(28px+var(--app-safe-top))] pb-[calc(100px+var(--app-safe-bottom))]'
            } ${className}`}>
                {isCorePage && isCheckingActiveGame && pathname.endsWith('/game') ? (
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

            <NotificationModal isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

            <AnimatePresence>
                {showOnboarding && (
                    <Onboarding onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>

            {/* Region ask for arena-notification timing — never over onboarding */}
            {!showOnboarding && <RegionPrompt />}
        </div>
    );
}
