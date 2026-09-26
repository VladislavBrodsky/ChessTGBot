'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget';
import { FaChessKnight, FaChessQueen, FaChessBishop, FaLock } from 'react-icons/fa';

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
            <div className="fixed inset-0 flex items-center justify-center bg-brand-bg">
                <div className="flex flex-col items-center gap-4">
                    <FaChessKnight className="text-brand-primary animate-pulse drop-shadow-lg" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-brand-muted">
                        Authenticating...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-brand-bg transition-colors duration-500">
            {/* ── Animated Background ── */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Grid */}
                <div className="absolute inset-0 transition-opacity duration-500 opacity-40" 
                     style={{
                         backgroundImage: 'linear-gradient(var(--color-brand-border-opacity-10) 1px, transparent 1px), linear-gradient(90deg, var(--color-brand-border-opacity-10) 1px, transparent 1px)',
                         backgroundSize: '40px 40px',
                     }} 
                />
                
                {/* Glow blobs */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_70%)] pointer-events-none"
                />
                <motion.div
                    animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none"
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
                    className="absolute pointer-events-none text-brand-muted/20"
                    style={{ left: x, top: y }}
                    animate={{ y: [0, -16, 0] }}
                    transition={{ duration: 6 + i, delay, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <Icon size={size} />
                </motion.div>
            ))}

            {/* ── Main Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-[900px] mx-auto px-4"
            >
                <div className="w-full rounded-[28px] overflow-hidden flex flex-col md:flex-row transition-all duration-300 bg-brand-surface border border-brand-border shadow-premium">
                    {/* ── LEFT: Login ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center transition-all duration-500 border-b md:border-b-0 md:border-r border-white/10">
                        <div className="flex flex-col items-center space-y-7 text-center w-full">

                            {/* Logo mark */}
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 rounded-full blur-md opacity-40"
                                    style={{ 
                                        background: 'conic-gradient(from 0deg, rgba(255,255,255,0.4), transparent, rgba(16,185,129,0.5), transparent)' 
                                    }}
                                />
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 bg-neutral-900 border border-white/10 shadow-lg">
                                    <FaChessKnight size={30} className="text-white drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    {t('secure_web_portal')}
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-[0.15em] font-mono leading-none bg-gradient-to-r from-white via-neutral-200 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
                                    {t('web3chess')}
                                </h1>
                            </div>

                            <p className="text-sm max-w-[280px] leading-relaxed transition-colors duration-500 text-neutral-400">
                                {t('premium_desc')}
                            </p>

                            {/* Widget */}
                            <div className="w-full flex flex-col items-center justify-center py-2 min-h-[48px]">
                                <TelegramLoginWidget
                                    botName="chess_matbot"
                                    buttonSize="large"
                                    cornerRadius={12}
                                    onAuthCallback={handleTelegramAuth}
                                />
                            </div>

                            {/* Security badge */}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10">
                                <FaLock size={10} className="text-emerald-400" />
                                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-neutral-400">
                                    {t('secure_auth')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: QR / Mobile ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center transition-colors duration-500 bg-white/[0.02]">
                        <div className="flex flex-col items-center text-center space-y-6 w-full">

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/40" />
                                <p className="text-[10px] font-mono font-semibold uppercase tracking-[0.3em] text-neutral-300">
                                    {t('play_on_mobile')}
                                </p>
                                <div className="w-8 h-px bg-gradient-to-l from-transparent to-emerald-500/40" />
                            </div>

                            <p className="text-sm max-w-[240px] leading-relaxed transition-colors duration-500 text-neutral-400">
                                {t('scan_qr')}
                            </p>

                            {/* QR Code Container (Obsidian contrast frame, pure black QR on crisp white) */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className="relative p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl shadow-black/80"
                            >
                                <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- external QR service image; next/image would require remote-domain config for no benefit */}
                                    <img
                                        src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://t.me/chess_matbot&color=000000&bgcolor=ffffff&margin=2"
                                        alt="Scan to open bot"
                                        className="w-36 h-36 block rounded"
                                    />
                                </div>
                            </motion.div>

                            {/* High-contrast tactile action CTA */}
                            <motion.a
                                href="https://t.me/chess_matbot"
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-98"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                                </svg>
                                <span>{t('open_in_telegram')}</span>
                            </motion.a>

                            {/* Stats row with high-contrast numbers & muted labels */}
                            <div className="flex items-center gap-6 pt-2">
                                {[
                                    { label: 'Players', value: '12K+' },
                                    { label: 'Matches', value: '89K+' },
                                    { label: 'Prize Pool', value: '$4.2K', isAccent: true },
                                ].map(({ label, value, isAccent }) => (
                                    <div key={label} className="flex flex-col items-center">
                                        <span className={`text-base font-black font-mono tracking-tight ${isAccent ? 'text-emerald-400' : 'text-white'}`}>
                                            {value}
                                        </span>
                                        <span className="text-[10px] uppercase tracking-widest font-mono font-medium text-brand-muted">
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-[10px] mt-5 uppercase tracking-widest font-mono font-medium transition-colors duration-500 text-neutral-500">
                    Chess Mat Bot · Powered by Telegram · Web3 Decentralized
                </p>
            </motion.div>
        </div>
    );
}
