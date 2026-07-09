'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget';
import { FaChessKnight, FaChessQueen, FaChessBishop, FaShieldAlt, FaLock } from 'react-icons/fa';

export default function LoginPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Login');
    const [mounted, setMounted] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && localStorage.getItem('telegram_web_auth')) {
            setIsRedirecting(true);
            router.replace(`/${locale}/home`);
        }
    }, [router, locale]);

    const handleTelegramAuth = (user: any) => {
        const params = new URLSearchParams();
        Object.keys(user).forEach(key => params.append(key, String(user[key])));
        localStorage.setItem('telegram_web_auth', params.toString());
        setIsRedirecting(true);
        router.replace(`/${locale}/home`);
    };

    if (!mounted || isRedirecting) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <FaChessKnight className="text-purple-400 animate-pulse" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-purple-400/60 animate-pulse">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
             style={{ background: 'var(--color-void, #000)' }}>

            {/* ── Animated Background ── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(168,85,247,1) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
                {/* Glow blobs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)' }}
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(244,63,94,0.2) 0%, transparent 70%)' }}
                />
            </div>

            {/* ── Floating Chess Pieces (decorative) ── */}
            {[
                { Icon: FaChessQueen, delay: 0, x: '10%', y: '15%', size: 28 },
                { Icon: FaChessBishop, delay: 1.5, x: '85%', y: '20%', size: 20 },
                { Icon: FaChessKnight, delay: 3, x: '8%', y: '75%', size: 24 },
                { Icon: FaChessQueen, delay: 2, x: '88%', y: '70%', size: 18 },
            ].map(({ Icon, delay, x, y, size }, i) => (
                <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    style={{ left: x, top: y }}
                    animate={{ y: [0, -16, 0], opacity: [0.05, 0.12, 0.05] }}
                    transition={{ duration: 6 + i, delay, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Icon size={size} style={{ color: 'rgba(168,85,247,1)' }} />
                </motion.div>
            ))}

            {/* ── Main Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-[900px] mx-auto px-4"
            >
                <div className="w-full rounded-[28px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] flex flex-col md:flex-row"
                     style={{ background: 'rgba(12,12,20,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(168,85,247,0.15)' }}>

                    {/* ── LEFT: Login ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center"
                         style={{ borderBottom: '1px solid rgba(168,85,247,0.08)' }}
                         // switch to right border on md
                    >
                        <div className="flex flex-col items-center space-y-7 text-center w-full">

                            {/* Logo mark */}
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 rounded-full"
                                    style={{ background: 'conic-gradient(from 0deg, rgba(168,85,247,0.4), transparent, rgba(244,63,94,0.4), transparent)', filter: 'blur(8px)' }}
                                />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                                     style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)' }}>
                                    <FaChessKnight size={30} style={{ color: 'rgba(168,85,247,1)' }} />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.5em] mb-2"
                                   style={{ color: 'rgba(168,85,247,0.6)' }}>
                                    {t('secure_web_portal')}
                                </p>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[0.15em] font-mono leading-none"
                                    style={{ background: 'linear-gradient(135deg, rgba(168,85,247,1) 0%, rgba(244,63,94,0.8) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {t('web3chess')}
                                </h1>
                            </div>

                            <p className="text-sm max-w-[260px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {t('premium_desc')}
                            </p>

                            {/* Widget */}
                            <div className="w-full flex justify-center py-2">
                                <TelegramLoginWidget
                                    botName="chess_matbot"
                                    buttonSize="large"
                                    cornerRadius={12}
                                    onAuthCallback={handleTelegramAuth}
                                />
                            </div>

                            {/* Security badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                                 style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
                                <FaLock size={10} style={{ color: 'rgba(168,85,247,0.6)' }} />
                                <span className="text-[10px] font-semibold uppercase tracking-widest"
                                      style={{ color: 'rgba(168,85,247,0.6)' }}>
                                    {t('secure_auth')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: QR / Mobile ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center"
                         style={{ background: 'rgba(0,0,0,0.25)', borderLeft: '1px solid rgba(168,85,247,0.08)' }}>
                        <div className="flex flex-col items-center text-center space-y-6 w-full">

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(168,85,247,0.4))' }} />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em]"
                                   style={{ color: 'rgba(168,85,247,0.5)' }}>
                                    {t('play_on_mobile')}
                                </p>
                                <div className="w-8 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(168,85,247,0.4))' }} />
                            </div>

                            <p className="text-sm max-w-[220px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                {t('scan_qr')}
                            </p>

                            {/* QR Code with glow border */}
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                className="relative p-1 rounded-2xl"
                                style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(244,63,94,0.3))', boxShadow: '0 0 40px rgba(168,85,247,0.2)' }}
                            >
                                <div className="bg-white p-4 rounded-xl">
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://t.me/chess_matbot&color=6b21a8&bgcolor=ffffff&margin=2"
                                        alt="Scan to open bot"
                                        className="w-40 h-40 block rounded"
                                    />
                                </div>
                            </motion.div>

                            <motion.a
                                href="https://t.me/chess_matbot"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                                style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: 'rgba(168,85,247,1)' }}
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                                {t('open_in_telegram')}
                            </motion.a>

                            {/* Stats row */}
                            <div className="flex items-center gap-6 pt-2">
                                {[
                                    { label: 'Players', value: '12K+' },
                                    { label: 'Matches', value: '89K+' },
                                    { label: 'Prize Pool', value: '$4.2K' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex flex-col items-center">
                                        <span className="text-sm font-black" style={{ color: 'rgba(168,85,247,0.9)' }}>{value}</span>
                                        <span className="text-[8px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-[9px] mt-5 uppercase tracking-widest font-semibold"
                   style={{ color: 'rgba(255,255,255,0.15)' }}>
                    Chess Mat Bot · Powered by Telegram · Web3 Decentralized
                </p>
            </motion.div>
        </div>
    );
}
