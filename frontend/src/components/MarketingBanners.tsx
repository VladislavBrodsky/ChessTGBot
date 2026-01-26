'use client';

import { motion } from 'framer-motion';
import { FaCrown, FaCoins, FaUsers, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import { useLocale } from 'next-intl';

const BANNERS = [
    {
        id: 1,
        title: "Monetize Your Skill",
        subtitle: "Don't just play—profit. Master the game and earn real rewards with every victory.",
        cta: "Claim Premium",
        link: "/membership",
        color: "from-indigo-600 via-purple-600 to-pink-500",
        icon: <FaCoins className="text-4xl text-yellow-400 drop-shadow-xl animate-pulse" />,
        decoration: (
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
        )
    },
    {
        id: 2,
        title: "Unleash the Alpha",
        subtitle: "Unlock Play-to-Earn protocols, priority matchmaking, and the exclusive Neural Matrix kit.",
        cta: "Upgrade Now",
        link: "/membership",
        color: "from-blue-600 via-cyan-500 to-emerald-500",
        icon: <FaCrown className="text-4xl text-brand-primary drop-shadow-xl" />,
        decoration: (
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-brand-primary/20 rounded-full blur-3xl animate-pulse" />
        )
    }
];

export default function MarketingBanners() {
    const locale = useLocale();

    const handleHaptic = () => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp?.HapticFeedback) {
            (window as any).Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }
    };

    return (
        <div className="w-full space-y-4 px-1" style={{ perspective: '1000px' }}>
            {BANNERS.map((banner, idx) => (
                <motion.div
                    key={banner.id}
                    onClick={handleHaptic}
                    initial={{ opacity: 0, rotateX: 20, y: 20 }}
                    animate={{ opacity: 1, rotateX: 0, y: 0 }}
                    whileHover={{ scale: 1.02, rotateY: 2, rotateX: -2 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative overflow-hidden rounded-3xl p-6 bg-linear-to-br ${banner.color} shadow-2xl group cursor-pointer`}
                >
                    {/* Noise Overlay */}
                    <div className="absolute inset-0 opacity-[0.12] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat mix-blend-overlay" />

                    {/* Glassmorphism Shine */}
                    <div className="absolute inset-0 bg-linear-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />

                    {banner.decoration}

                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg"
                                >
                                    {banner.icon}
                                </motion.div>
                                <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase drop-shadow-md">
                                    {banner.title}
                                </h3>
                            </div>
                            <p className="text-[12px] font-bold text-white/90 leading-snug max-w-[220px] drop-shadow-sm">
                                {banner.subtitle}
                            </p>
                            <Link href={`/${locale}${banner.link}`}>
                                <motion.div
                                    whileHover={{ x: 5, scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-white text-brand-void text-[11px] font-black uppercase tracking-widest shadow-xl ring-4 ring-white/10"
                                >
                                    {banner.cta}
                                    <FaArrowRight fontSize={10} />
                                </motion.div>
                            </Link>
                        </div>

                        {/* 3D-like Float Asset Placeholder */}
                        <motion.div
                            animate={{
                                y: [0, -15, 0],
                                rotateZ: [0, 8, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="hidden xs:flex w-24 h-24 items-center justify-center relative"
                        >
                            <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl opacity-50 animate-pulse" />
                            <div className="w-16 h-16 rounded-full bg-linear-to-br from-white/20 to-white/5 backdrop-blur-3xl border border-white/30 flex items-center justify-center shadow-[inset_0_0_15px_rgba(255,255,255,0.4)]">
                                <FaUsers className="text-3xl text-white/40 drop-shadow-glow" />
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
