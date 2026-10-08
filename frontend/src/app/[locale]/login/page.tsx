'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget';
import { FaChessKnight, FaLock } from 'react-icons/fa';

export default function LoginPage() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations('Login');
    const [mounted, setMounted] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            const isTMA = !!(window as any).Telegram?.WebApp?.initData;
            let hasWebAuth = false;
            try { hasWebAuth = !!localStorage.getItem('telegram_web_auth'); } catch { /* storage blocked */ }
            if (isTMA) {
                try {
                    (window as any).Telegram?.WebApp?.ready();
                    (window as any).Telegram?.WebApp?.expand();
                } catch { /* noop */ }
            }
            if (isTMA || hasWebAuth) {
                setIsRedirecting(true);
                router.replace(`/${locale}/home`);
            }
        }
    }, [router, locale]);

    const handleTelegramAuth = useCallback((user: Record<string, unknown>) => {
        const params = new URLSearchParams();
        Object.keys(user).forEach(key => params.append(key, String(user[key])));
        try { localStorage.setItem('telegram_web_auth', params.toString()); } catch { /* storage blocked */ }
        setIsRedirecting(true);
        router.replace(`/${locale}/home`);
    }, [router, locale]);

    const botUsername = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');

    if (!mounted || isRedirecting) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-brand-void">
                <div className="flex flex-col items-center gap-4">
                    <FaChessKnight className="text-emerald-500 animate-pulse drop-shadow-lg" size={48} />
                    <p className="text-caption font-semibold normal-case tracking-normal animate-pulse text-brand-muted">
                        Authenticating...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-brand-void transition-colors duration-500">
            {/* ── Main Card ── */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-[900px] mx-auto px-4"
            >
                <div className="w-full rounded-[28px] overflow-hidden flex flex-col md:flex-row transition-all duration-300 bg-brand-surface border border-brand-border shadow-premium">
                    {/* ── LEFT: Login ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center transition-all duration-500 border-b md:border-b-0 md:border-r border-brand-border">
                        <div className="flex flex-col items-center space-y-7 text-center w-full">

                            {/* Logo mark */}
                            <div className="relative">
                                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-500 bg-brand-elevated border border-brand-border shadow-lg">
                                    <FaChessKnight size={30} className="text-brand-action" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-caption font-mono font-semibold normal-case tracking-normal mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    {t('secure_web_portal')}
                                </div>
                                <h1 className="text-page-title font-semibold text-brand-primary">
                                    {t('web3chess')}
                                </h1>
                            </div>

                            <p className="text-sm max-w-[280px] leading-relaxed transition-colors duration-500 text-brand-muted">
                                {t('premium_desc')}
                            </p>

                            {/* Widget */}
                            <div className="w-full flex flex-col items-center justify-center py-2 min-h-[48px]">
                                <TelegramLoginWidget
                                    botName={botUsername}
                                    buttonSize="large"
                                    cornerRadius={12}
                                    onAuthCallback={handleTelegramAuth}
                                />
                            </div>

                            {/* Security badge */}
                            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-elevated border border-brand-border">
                                <FaLock size={10} className="text-emerald-500" />
                                <span className="text-caption font-mono font-medium normal-case tracking-normal text-brand-muted">
                                    {t('secure_auth')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: QR / Mobile ── */}
                    <div className="w-full md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center transition-colors duration-500 bg-brand-elevated/30">
                        <div className="flex flex-col items-center text-center space-y-6 w-full">

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500/40" />
                                <p className="text-caption font-mono font-semibold normal-case tracking-normal text-brand-muted">
                                    {t('play_on_mobile')}
                                </p>
                                <div className="w-8 h-px bg-gradient-to-l from-transparent to-emerald-500/40" />
                            </div>

                            <p className="text-sm max-w-[240px] leading-relaxed transition-colors duration-500 text-brand-muted">
                                {t('scan_qr')}
                            </p>

                            {/* QR Code Container (Obsidian contrast frame, pure black QR on crisp white) */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className="relative p-2 rounded-2xl bg-brand-surface border border-brand-border shadow-xl"
                            >
                                <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-inner">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- external QR service image */}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://t.me/${botUsername}`)}&color=000000&bgcolor=ffffff&margin=2`}
                                        alt="Scan to open bot"
                                        className="w-36 h-36 block rounded"
                                    />
                                </div>
                            </motion.div>

                            {/* High-contrast tactile action CTA */}
                            <motion.a
                                href={`https://t.me/${botUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm normal-case tracking-normal transition-all duration-200 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 active:scale-98"
                            >
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                                </svg>
                                <span>{t('open_in_telegram')}</span>
                            </motion.a>

                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <p className="text-center text-caption mt-5 normal-case tracking-normal font-mono font-medium transition-colors duration-500 text-brand-muted">
                    Chess Mat Bot · Powered by Telegram
                </p>
            </motion.div>
        </div>
    );
}
