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
        <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <nav className="pointer-events-auto flex items-center bg-white/5 backdrop-blur-2xl border border-white/10 px-2 py-2 rounded-4xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />

                <ul className="flex items-center relative z-10">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href} className="relative">
                                <Link href={item.href}>
                                    <div className="relative px-6 py-3 flex flex-col items-center justify-center transition-colors duration-300">
                                        {isActive && (
                                            <motion.div
                                                layoutId="liquid-bg"
                                                className="absolute inset-0 bg-white/10 rounded-2xl border border-white/5 shadow-inner"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 400,
                                                    damping: 30
                                                }}
                                            />
                                        )}
                                        <motion.span
                                            animate={{
                                                scale: isActive ? 1.2 : 1,
                                                color: isActive ? "#ffffff" : "rgba(255, 255, 255, 0.4)"
                                            }}
                                            className="text-xl relative z-20 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                        >
                                            {item.icon}
                                        </motion.span>
                                        <motion.span
                                            animate={{
                                                opacity: isActive ? 1 : 0,
                                                y: isActive ? 0 : 5
                                            }}
                                            className="text-[10px] font-black uppercase tracking-tighter mt-1 text-white/80 absolute -bottom-1"
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
        </div>
    );
}
