'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FaChessPawn, FaGamepad, FaGraduationCap, FaCog, FaTrophy } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home', icon: <FaChessPawn />, href: '/home' },
    { name: 'Play', icon: <FaGamepad />, href: '/game' },
    { name: 'Learn', icon: <FaGraduationCap />, href: '/academy' },
    { name: 'Quests', icon: <FaTrophy />, href: '/challenges' },
    { name: 'Settings', icon: <FaCog />, href: '/settings' },
];

export default function Navbar({ hide = false }: { hide?: boolean }) {
    const pathname = usePathname();
    const locale = useLocale();

    const localizedItems = NAV_ITEMS.map(item => ({
        ...item,
        href: `/${locale}${item.href}`
    }));

    return (
        <motion.nav 
            initial={{ x: "-50%", y: 0, opacity: 1 }}
            animate={{
                x: "-50%",
                y: hide ? 150 : 0,
                opacity: hide ? 0 : 1
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ pointerEvents: hide ? 'none' : 'auto' }}
            className="fixed bottom-[calc(16px+var(--tg-content-safe-area-inset-bottom,var(--tg-safe-area-inset-bottom,0px)))] left-1/2 w-[92%] max-w-md z-50 flex items-center bg-brand-void backdrop-blur-3xl border border-brand-border-opacity-10 px-6 py-3 rounded-2xl shadow-premium justify-between"
        >
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-brand-border-opacity-5 to-transparent pointer-events-none rounded-2xl" />

            <ul className="flex items-center relative z-10 w-full justify-around space-x-1">
                {localizedItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.href} className="flex-1 max-w-[64px] min-w-[50px]">
                            <Link href={item.href}>
                                <div className="relative h-12 flex items-center justify-center transition-all duration-300">
                                    {isActive && (
                                        <div
                                            className="absolute inset-[2px] bg-brand-bg-opacity-5 rounded-xl border border-brand-border-opacity-5 shadow-inner-glow"
                                        />
                                    )}
                                    <div
                                        className={`text-xl relative z-20 transition-all duration-200 ${
                                            isActive 
                                                ? "text-[var(--text-primary)] scale-110" 
                                                : "text-[var(--text-muted)]"
                                        }`}
                                    >
                                        {item.icon}
                                    </div>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </motion.nav>
    );
}
