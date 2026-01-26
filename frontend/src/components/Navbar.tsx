'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChessPawn, FaGamepad, FaGraduationCap, FaCog } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home', icon: <FaChessPawn />, href: '/home' },
    { name: 'Play', icon: <FaGamepad />, href: '/game' },
    { name: 'Challenges', icon: <FaGraduationCap />, href: '/challenges' },
    { name: 'Settings', icon: <FaCog />, href: '/settings' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center bg-brand-void/80 backdrop-blur-2xl border border-brand-primary/5 px-2 py-2 rounded-2xl shadow-premium min-w-[280px] max-w-[95%] justify-center mx-auto">
            {/* Subtle glow overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-brand-primary/5 to-transparent pointer-events-none rounded-2xl" />

            <ul className="flex items-center relative z-10 w-full justify-around space-x-1">
                {NAV_ITEMS.map((item) => {
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
