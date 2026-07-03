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

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
    const [activeGameId, setActiveGameId] = useState<string | null>(null);

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
                
                if (activeId) {
                    const searchParams = new URLSearchParams(window.location.search);
                    const urlGameId = searchParams.get('id');
                    
                    const isGamePage = pathname === `/${locale}/game` || pathname === '/game';
                    if (!isGamePage || urlGameId !== activeId) {
                        router.replace(`/${locale}/game?id=${activeId}`);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to check active game", err);
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
    }, [pathname, locale]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            const isHomePage = pathname === '/' || pathname.endsWith('/home') || pathname === `/${locale}`;
            const isBackButtonSupported = tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.BackButton;

            if (isBackButtonSupported) {
                try {
                    if (isHomePage || activeGameId) {
                        tg.BackButton.hide();
                    } else {
                        tg.BackButton.show();
                        const handleBackClick = () => {
                            router.back();
                        };
                        tg.BackButton.onClick(handleBackClick);
                        return () => {
                            try {
                                tg.BackButton.offClick(handleBackClick);
                            } catch (err) {
                                console.warn('Telegram BackButton offClick failed', err);
                            }
                        };
                    }
                } catch (err) {
                    console.warn('Telegram BackButton operation failed', err);
                }
            }
        }
    }, [pathname, locale, router, activeGameId]);

    const { theme, toggleTheme } = useTheme();

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
            <main className={`relative z-10 w-full overflow-x-hidden flex flex-col items-center min-h-[100dvh] pt-[calc(24px+var(--tg-content-safe-area-inset-top,var(--tg-safe-area-inset-top,0px)))] pb-[calc(100px+var(--tg-content-safe-area-inset-bottom,var(--tg-safe-area-inset-bottom,0px)))] ${className}`}>

                {children}
            </main>

            <Navbar hide={isNavbarHiddenByContext || showOnboarding || !!activeGameId} />

            <AnimatePresence>
                {showOnboarding && (
                    <Onboarding onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
