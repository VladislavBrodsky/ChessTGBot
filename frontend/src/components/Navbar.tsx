'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@/context/UserContext';
import { getFullPhotoUrl } from '@/lib/api';
import { FaChessKing, FaChessKnight, FaChessQueen, FaChessBishop, FaChessRook, FaSignOutAlt } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home',        icon: <FaChessKing />,      href: '/home',        key: 'nav_home' },
    { name: 'Play',        icon: <FaChessKnight />,    href: '/game',        key: 'nav_play' },
    { name: 'Marketplace', icon: <FaChessQueen />,     href: '/marketplace', key: 'nav_marketplace' },
    { name: 'Learn',       icon: <FaChessBishop />,    href: '/academy',     key: 'nav_learn' },
    { name: 'Quests',      icon: <FaChessRook />,      href: '/challenges',  key: 'nav_quests' },
];

let globalIsTelegramWeb: boolean | null = null;
let globalIsDesktopBrowser: boolean | null = null;

export default function Navbar({ hide = false }: { hide?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Index');
    const { stats } = useUser();
    const [isTelegramWeb, setIsTelegramWeb] = React.useState(() => {
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
        // payloads after first paint so a normal navigation has no chunk fetch
        // on the tap path. Delaying avoids competing with initial app startup.
        const timer = window.setTimeout(() => {
            NAV_ITEMS.forEach((item) => router.prefetch(`/${locale}${item.href}`));
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
        if (hide) return null;
        return (
            <motion.nav
                initial={{ x: -72, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="fixed left-0 top-0 z-50 flex h-full w-[72px] flex-col items-center justify-between border-r border-brand-border-opacity-10 bg-brand-void/70 py-6 backdrop-blur-[20px] shadow-[4px_0_24px_rgba(0,0,0,0.15)]"
            >
                {/* Logo */}
                <div className="flex flex-col items-center gap-1">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-gold/30 bg-brand-gold/10 text-brand-gold">
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
                                            isActive ? 'border-brand-gold/30 bg-brand-gold/10' : 'border-transparent'
                                        }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-active"
                                                className="absolute -left-px top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-brand-gold"
                                            />
                                        )}
                                        <span className={`text-lg transition-colors ${isActive ? 'text-brand-gold' : 'text-brand-primary/30 group-hover:text-brand-primary/60'}`}>
                                            {item.icon}
                                        </span>

                                        {/* Tooltip */}
                                        <div className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg border border-brand-gold/20 bg-brand-void px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-gold opacity-0 shadow-md transition-opacity group-hover:opacity-100">
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
                                className="h-10 w-10 cursor-pointer overflow-hidden rounded-xl border-2 border-brand-gold/40"
                            >
                                {stats.photo_url ? (
                                    <img src={getFullPhotoUrl(stats.photo_url)} alt="You" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-brand-gold/10 text-sm font-black text-brand-gold">
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
        );
    }

    // ── MOBILE BOTTOM NAVIGATION ─────────────────────────────────────────
    return (
        <motion.nav
            data-app-navbar
            initial={{ x: "-50%", y: 0, opacity: 1 }}
            animate={{
                x: "-50%",
                y: hide ? 150 : 0,
                opacity: hide ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{
                pointerEvents: hide ? 'none' : 'auto',
                bottom: `calc(${isTelegramWeb ? '66px' : '16px'} + var(--app-safe-bottom))`
            }}
            aria-label="Primary navigation"
            className="fixed left-1/2 w-[calc(100%-40px)] max-w-[380px] z-50 flex items-center bg-[linear-gradient(135deg,rgba(25,25,25,0.98),rgba(3,3,3,0.98))] backdrop-blur-3xl border border-white/[0.09] px-1 py-1 rounded-[20px] shadow-[0_14px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] justify-between"
        >
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.08),transparent_60%)] pointer-events-none rounded-[20px]" />

            <ul className="flex w-full max-w-[340px] mx-auto items-center justify-around gap-px relative z-10">
                {localizedItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <li key={item.href} className="flex-1 min-w-0">
                            <Link
                                href={item.href}
                                aria-label={item.label}
                                aria-current={isActive ? 'page' : undefined}
                                className="block rounded-2xl"
                            >
                                <div className="relative min-h-[50px] px-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 rounded-[18px]">
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobile-nav-active"
                                            className="absolute inset-0 bg-[linear-gradient(145deg,rgba(250,204,21,0.18),rgba(180,83,9,0.07))] rounded-[18px] border border-yellow-300/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_0_18px_rgba(250,204,21,0.1)]"
                                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                        />
                                    )}
                                    <div className={`relative z-20 flex h-5 w-6 items-center justify-center text-[16px] transition-all duration-200 ${
                                        isActive
                                            ? "text-yellow-200 -translate-y-px drop-shadow-[0_0_8px_rgba(250,204,21,0.48)]"
                                            : "text-brand-primary/35"
                                    }`}>
                                        {item.icon}
                                    </div>
                                    <span className={`relative z-20 max-w-full truncate text-[7px] sm:text-[8px] font-extrabold leading-none tracking-wide transition-colors ${
                                        isActive ? 'text-yellow-100' : 'text-brand-primary/40'
                                    }`}>
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <motion.span
                                            layoutId="mobile-nav-active-indicator"
                                            className="absolute bottom-1 w-3.5 h-px rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                                        />
                                    )}
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </motion.nav>
    );
}
