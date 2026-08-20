'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { getFullPhotoUrl } from '@/lib/api';
import { telegramHaptic } from '@/lib/telegram';
import { FaChessKing, FaChessQueen, FaChessKnight, FaChessPawn, FaChessRook, FaSignOutAlt } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home',        icon: <FaChessKing />,      href: '/home',        key: 'nav_home' },
    { name: 'Marketplace', icon: <FaChessQueen />,     href: '/marketplace', key: 'nav_marketplace' },
    { name: 'Play',        icon: <FaChessKnight />,    href: '/game',        key: 'nav_play', primary: true },
    { name: 'Learn',       icon: <FaChessPawn />,      href: '/academy',     key: 'nav_learn' },
    { name: 'Quests',      icon: <FaChessRook />,      href: '/challenges',  key: 'nav_quests' },
];

let globalIsTelegramWeb: boolean | null = null;
let globalIsDesktopBrowser: boolean | null = null;
const prefetchedLocales = new Set<string>();

export default function Navbar({ hide = false }: { hide?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Index');
    const { stats } = useUser();
    // Value is not read anywhere; only the setter runs (below) to cache the
    // detection globally. Destructure the value out to satisfy no-unused-vars.
    const [, setIsTelegramWeb] = React.useState(() => {
        if (globalIsTelegramWeb !== null) return globalIsTelegramWeb;
        return false;
    });
    const [isDesktopBrowser, setIsDesktopBrowser] = React.useState(() => {
        if (globalIsDesktopBrowser !== null) return globalIsDesktopBrowser;
        return false;
    });

    React.useEffect(() => {
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

    React.useEffect(() => {
        // The five primary destinations are always visible. Warm their route
        // payloads once per locale so a normal navigation has no chunk fetch
        // on the tap path. Without this guard, every page remount scheduled
        // another five prefetches and could compete with the next transition.
        if (prefetchedLocales.has(locale)) return;

        const timer = window.setTimeout(() => {
            NAV_ITEMS.forEach((item) => router.prefetch(`/${locale}${item.href}`));
            prefetchedLocales.add(locale);
        }, 800);

        return () => window.clearTimeout(timer);
    }, [locale, router]);

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('telegram_web_auth');
            window.location.href = `/${locale}/login`;
        }
    };

    const localizedItems = NAV_ITEMS.map(item => ({
        ...item,
        href: `/${locale}${item.href}`,
        label: t(item.key)
    }));

    // ── DESKTOP SIDEBAR ──────────────────────────────────────────────────
    if (isDesktopBrowser) {
        return (
            <AnimatePresence>
                {!hide && (
                    <motion.nav
                        key="desktop-sidebar"
                        initial={{ x: -72, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -72, opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="fixed left-0 top-0 z-50 flex h-full w-[72px] flex-col items-center justify-between border-r border-brand-border-opacity-10 bg-brand-void/70 py-6 backdrop-blur-[20px] shadow-[4px_0_24px_rgba(0,0,0,0.15)]"
            >
                {/* Logo */}
                <div className="flex flex-col items-center gap-1">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                        <FaChessKnight size={18} />
                    </div>
                </div>

                {/* Nav links */}
                <ul className="flex flex-col items-center gap-2 flex-1 justify-center">
                    {localizedItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <li key={item.href}>
                                <Link href={item.href} title={item.label} aria-label={item.label}>
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200 group ${
                                            isActive ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-transparent'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute -left-px top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-emerald-500"
                                            />
                                        )}
                                        <span className={`text-lg transition-colors ${isActive ? 'text-emerald-500' : 'text-brand-muted group-hover:text-brand-muted'}`}>
                                            {item.icon}
                                        </span>

                                        {/* Tooltip */}
                                        <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-emerald-500/20 bg-brand-void px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                                            {item.label}
                                        </div>
                                    </motion.div>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                {/* Bottom: Avatar + Logout */}
                <div className="flex flex-col items-center gap-3">
                    {stats && (
                        <Link href={`/${locale}/profile`} title={t('nav_profile')} aria-label={t('nav_profile')}>
                            <motion.div
                                whileHover={{ scale: 1.08 }}
                                className="h-10 w-10 cursor-pointer overflow-hidden rounded-xl border-2 border-emerald-500/40"
                            >
                                {stats.photo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- remote avatar; static export runs with images.unoptimized so next/image adds no benefit
                                    <img src={getFullPhotoUrl(stats.photo_url)} alt="You" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-emerald-500/10 text-sm font-black text-emerald-500">
                                        {stats.first_name?.[0] || '?'}
                                    </div>
                                )}
                            </motion.div>
                        </Link>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        title={t('nav_logout')}
                        aria-label={t('nav_logout')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group"
                        style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.15)' }}
                    >
                        <FaSignOutAlt size={14} className="text-red-400/50 group-hover:text-red-400 transition-colors" />
                    </motion.button>
                </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        );
    }

    // ── MOBILE BOTTOM NAVIGATION ─────────────────────────────────────────
    return (
        <motion.nav
            data-app-navbar
            // The navbar is recreated by page layouts. Skipping its initial
            // animation avoids a visible slide/fade on every route change.
            initial={false}
            animate={{
                y: hide ? 112 : 0,
                opacity: hide ? 0 : 1
            }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
                pointerEvents: hide ? 'none' : 'auto',
                bottom: `calc(16px + var(--app-safe-bottom))`
            }}
            aria-label="Primary navigation"
            className="app-bottom-nav fixed left-4 right-4 z-50 w-auto max-w-[420px] mx-auto rounded-[28px] border border-brand-border-opacity-10 px-1.5 py-1.5 backdrop-blur-[24px] shadow-premium flex justify-center"
        >
            <ul className="grid w-full grid-cols-5 gap-1">
                {localizedItems.map((item) => {
                    const currentPath = (pathname || '').split('?')[0].replace(/\/$/, '');
                    const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                    const isPrimary = item.primary === true;
                    return (
                        <li key={item.href} className="min-w-0">
                            <Link
                                href={item.href}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                onClick={() => {
                                    if (!isActive) telegramHaptic('selection');
                                }}
                                className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                            >
                                <div className={`app-bottom-nav__button relative flex flex-col items-center justify-center min-h-[50px] w-full rounded-[20px] transition-all duration-300 ${
                                    isActive ? 'app-bottom-nav__item--active' : ''
                                }`}>
                                    <div className={`app-bottom-nav__icon flex items-center justify-center transition-all duration-300 relative z-10 ${
                                        isActive 
                                            ? 'text-emerald-500 -translate-y-0.5 scale-110 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]' 
                                            : isPrimary 
                                                ? 'text-emerald-500/80 scale-105' 
                                                : 'text-brand-muted hover:text-brand-primary'
                                    } text-[20px]`}>
                                        {item.icon}
                                    </div>
                                    <span className={`app-bottom-nav__label max-w-full truncate text-[10px] font-bold tracking-[0.02em] transition-all duration-300 relative z-10 mt-0.5 px-0.5 ${
                                        isActive 
                                            ? 'text-emerald-500' 
                                            : isPrimary 
                                                ? 'text-emerald-500/80' 
                                                : 'text-brand-muted'
                                    }`}>
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </motion.nav>
    );
}
