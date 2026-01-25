'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaChessPawn, FaGamepad, FaGraduationCap, FaCog, FaStar } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Home', icon: <FaChessPawn />, href: '/' },
    { name: 'Play', icon: <FaGamepad />, href: '/game' },
    { name: 'Academy', icon: <FaGraduationCap />, href: '/academy' },
    { name: 'Settings', icon: <FaCog />, href: '/settings' },
    { name: 'Premium', icon: <FaStar />, href: '/membership' },
];

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center bg-black/80 backdrop-blur-3xl border border-white/10 px-2 py-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Glossy overlay */}
            <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

            <ul className="flex items-center relative z-10">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <li key={item.href} className="relative">
                            <Link href={item.href}>
                                <div className="relative px-6 py-2 flex flex-col items-center justify-center transition-all duration-300">
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-nav-bg"
                                            className="absolute inset-0 bg-white/10 rounded-xl border border-white/5"
                                            transition={{
                                                type: "spring",
                                                stiffness: 450,
                                                damping: 35
                                            }}
                                        />
                                    )}
                                    <motion.span
                                        animate={{
                                            scale: isActive ? 1.05 : 1,
                                            color: isActive ? "#ffffff" : "#71767B"
                                        }}
                                        className="text-xl relative z-20"
                                    >
                                        {item.icon}
                                    </motion.span>
                                    <motion.span
                                        animate={{
                                            opacity: isActive ? 1 : 0,
                                            y: isActive ? 0 : 4
                                        }}
                                        className="text-[8px] font-bold uppercase tracking-[0.2em] mt-1 text-white absolute -bottom-1 whitespace-nowrap"
                                    >
                                        {item.name}
                                    </motion.span>
                                </div>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
