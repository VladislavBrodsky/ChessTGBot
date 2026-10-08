'use client';

import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import dynamic from 'next/dynamic';

const Onboarding = dynamic(() => import('./Onboarding'), { ssr: false });
const NotificationModal = dynamic(() => import('./NotificationModal'), { ssr: false });
import AnimatedBackground from './AnimatedBackground';
import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useDesktopNavigation } from '@/hooks/useDesktopNavigation';
import { Button } from './ui/Button';
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


export default function LayoutWrapper({ children, className = "", bgClass = "bg-brand-void", hideHeaderControls = false }: LayoutWrapperProps) {
    const locale = useLocale();
    const t = useTranslations('Index');
    const isDesktopBrowser = useDesktopNavigation();
    const pathname = usePathname();
    const { isHidden: isNavbarHiddenByContext } = useNavbar();
    const { activeGameId, isCheckingActiveGame, urlGameId } = useActiveGame();
    
    useTelegramBackButton(activeGameId, urlGameId);

    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    
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
        (cleanPathname.endsWith('/game') && !activeGameId && !urlGameId) ||
        (cleanPathname.endsWith('/academy') && !cleanPathname.includes('/lesson/') && !cleanPathname.includes('/puzzle'));

    const shouldHideNavbar = showOnboarding || (!isMainNavbarPage && isNavbarHiddenByContext) || (
        !isMainNavbarPage && !!activeGameId
    );

    return (
        <div className={`app-shell relative min-h-[100dvh] w-full overflow-x-clip ${bgClass} text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void`}>
            {!pathname.includes('/admin') && <AnimatedBackground />}

            {isMainNavbarPage && pathname.endsWith('/home') && !hideHeaderControls && !showOnboarding && !isCheckingActiveGame && (
                <div className="absolute top-[calc(23.5px+var(--app-safe-top))] right-4 md:right-[calc(50%-272px)] lg:right-[calc(50%-368px)] z-50 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        aria-label="Notifications"
                        onClick={() => setShowNotifications(true)}
                        className="relative w-11 h-11 p-0 flex items-center justify-center rounded-xl bg-brand-surface border border-brand-border-opacity-10 shadow-lg text-brand-muted hover:text-brand-primary transition-colors active:scale-95 cursor-pointer"
                    >
                        <FiBell size={15} />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </Button>
                    {!pathname.endsWith('/settings') && (
                        <Link href={`/${locale}/settings`} aria-label={t('nav_settings')} className="ui-icon-button">
                            <FiSettings size={20} aria-hidden="true" />
                        </Link>
                    )}
                </div>
            )}

            <div className={`app-content relative z-10 w-full flex flex-col items-center min-h-[100dvh] ${
                isDesktopBrowser
                    ? 'app-content--desktop'
                    : 'app-content--mobile'
            } ${className}`}>
                {isCorePage && isCheckingActiveGame && pathname.endsWith('/game') ? (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
                        <span className="text-caption font-semibold normal-case tracking-normal mt-3.5 opacity-40 animate-pulse text-brand-primary">
                            INITIALIZING ARENA...
                        </span>
                    </div>
                ) : (
                    children
                )}
            </div>

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
