'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { FaChessPawn, FaGamepad, FaGraduationCap, FaCog } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home', icon: <FaChessPawn />, href: '/home' },
    { name: 'Play', icon: <FaGamepad />, href: '/game' },
    { name: 'Challenges', icon: <FaGraduationCap />, href: '/challenges' },
    { name: 'Settings', icon: <FaCog />, href: '/settings' },
];

export default function Navbar() {
    const pathname = usePathname();
    const locale = useLocale();

    const localizedItems = NAV_ITEMS.map(item => ({
        ...item,
        href: `/${locale}${item.href}`
    }));

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center bg-brand-void/90 backdrop-blur-3xl border-t border-brand-primary/10 px-6 py-3 rounded-t-2xl shadow-premium justify-between">
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none rounded-t-2xl" />

            <ul className="flex items-center relative z-10 w-full justify-around space-x-1">
                {localizedItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.href} className="flex-1 max-w-[64px] min-w-[50px]">
                            <Link href={item.href}>
                                <div className="relative h-12 flex items-center justify-center transition-all duration-300">
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-active-indicator"
                                            className="absolute inset-[2px] bg-brand-primary/5 rounded-xl border border-brand-primary/5 shadow-inner-glow"
                                            initial={false}
                                            transition={{
                                                type: "spring",
                                                stiffness: 500,
                                                damping: 38
                                            }}
                                        />
                                    )}
                                    <motion.div
                                        animate={{
                                            scale: isActive ? 1.25 : 1,
                                            color: isActive ? "var(--text-primary)" : "var(--text-muted)"
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className="text-xl relative z-20"
                                    >
                                        {item.icon}
                                    </motion.div>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
