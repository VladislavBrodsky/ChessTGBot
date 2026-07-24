'use client';

import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Onboarding from './Onboarding';
import NotificationModal from './NotificationModal';
import AnimatedBackground from './AnimatedBackground';
import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useNavbar } from '@/context/NavbarContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiSettings, FiBell } from 'react-icons/fi';
import { useActiveGame } from '@/hooks/useActiveGame';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
    bgClass?: string;
    hideHeaderControls?: boolean;
}

let globalIsTelegramWeb: boolean | null = null;
let globalIsDesktopBrowser: boolean | null = null;

export default function LayoutWrapper({ children, className = "", bgClass = "bg-brand-void", hideHeaderControls = false }: LayoutWrapperProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const { isHidden: isNavbarHiddenByContext } = useNavbar();
    const { activeGameId, isCheckingActiveGame, urlGameId } = useActiveGame();
    
    useTelegramBackButton(activeGameId, urlGameId);

    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    
    const [isTelegramWeb, setIsTelegramWeb] = useState<boolean>(() => {
        if (globalIsTelegramWeb !== null) return globalIsTelegramWeb;
        return false;
    });

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

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const completed = localStorage.getItem("onboarding_completed");
            if (completed !== "true") {
                setShowOnboarding(true);
            }
        }
    }, []);

    const cleanPathname = (pathname || '').split('?')[0].replace(/\/$/, '');
    const isCorePage = cleanPathname.endsWith('/game') || cleanPathname.endsWith('/home') || cleanPathname === '' || cleanPathname === `/${locale}`;

    const isMainNavbarPage = 
        cleanPathname.endsWith('/home') || 
        cleanPathname.endsWith('/settings') || 
        cleanPathname.endsWith('/profile') || 
        cleanPathname.endsWith('/wallet') || 
        cleanPathname.endsWith('/challenges') || 
        cleanPathname.endsWith('/marketplace') || 
        (cleanPathname.endsWith('/academy') && !cleanPathname.includes('/lesson/') && !cleanPathname.includes('/puzzle'));

    const shouldHideNavbar = isNavbarHiddenByContext || showOnboarding || (
        !isMainNavbarPage && !!activeGameId
    );

    return (
        <div className={`app-shell relative min-h-[100dvh] w-full overflow-x-clip ${bgClass} text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void`}>
            {!pathname.includes('/admin') && <AnimatedBackground />}

            {isMainNavbarPage && pathname.endsWith('/home') && !hideHeaderControls && !showOnboarding && !isCheckingActiveGame && (
                <div className="absolute top-[calc(23.5px+var(--app-safe-top))] right-4 md:right-[calc(50%-272px)] lg:right-[calc(50%-368px)] z-50 flex items-center gap-2">
                    <button 
                        onClick={() => setShowNotifications(true)}
                        className="relative w-8 h-8 pb-[0.5px] flex items-center justify-center rounded-xl bg-brand-surface/60 backdrop-blur-md border border-brand-border-opacity-10 shadow-lg text-brand-muted hover:text-brand-primary transition-colors active:scale-95 cursor-pointer"
                    >
                        <FiBell size={15} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </button>
                    {!pathname.endsWith('/settings') && (
                        <Link href={`/${locale}/settings`}>
                            <button className="w-8 h-8 pb-[0.5px] flex items-center justify-center rounded-xl bg-brand-surface/60 backdrop-blur-md border border-brand-border-opacity-10 shadow-lg text-brand-muted hover:text-brand-primary transition-colors active:scale-95 cursor-pointer">
                                <FiSettings size={15} />
                            </button>
                        </Link>
                    )}
                </div>
            )}

            <main className={`relative z-10 w-full flex flex-col items-center min-h-[100dvh] ${
                isDesktopBrowser
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
                    <Onboarding key="onboarding" onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
