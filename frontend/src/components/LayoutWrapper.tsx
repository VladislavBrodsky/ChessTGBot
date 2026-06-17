'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Onboarding from './Onboarding';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { FaWallet, FaMoon, FaSun, FaStar } from 'react-icons/fa';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useTheme } from '@/context/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const [balance, setBalance] = useState<number>(0);
    const [isMenuHidden, setIsMenuHidden] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const completed = localStorage.getItem("onboarding_completed");
            if (completed !== "true") {
                setShowOnboarding(true);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkModal = () => {
            const hasModal = document.querySelector('.bottom-drawer-backdrop') !== null;
            setIsMenuHidden(hasModal);
        };

        // Initial check
        checkModal();

        // Observe adding/removing of modals
        const observer = new MutationObserver(() => {
            checkModal();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            const isHomePage = pathname === '/' || pathname.endsWith('/home') || pathname === `/${locale}`;
            const isBackButtonSupported = tg.isVersionAtLeast && tg.isVersionAtLeast('6.1') && tg.BackButton;

            if (isBackButtonSupported) {
                try {
                    if (isHomePage) {
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
    }, [pathname, locale, router]);

    useEffect(() => {
        // Sync balance on layout mount
        apiFetch("/api/v1/wallet/balance")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(data => setBalance(data.balance))
            .catch(() => {});
    }, []);

    const { theme, toggleTheme } = useTheme();

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-brand-void text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void">
            {/* Ambient Starfield */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Content Container */}
            <main className={`relative z-10 w-full overflow-x-hidden flex flex-col items-center min-h-screen pt-[calc(24px+var(--tg-content-safe-area-inset-top,var(--tg-safe-area-inset-top,0px)))] pb-[calc(100px+var(--tg-content-safe-area-inset-bottom,var(--tg-safe-area-inset-bottom,0px)))] ${className}`}>

                {children}
            </main>

            <Navbar hide={isMenuHidden || showOnboarding} />

            <AnimatePresence>
                {showOnboarding && (
                    <Onboarding onClose={() => setShowOnboarding(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
