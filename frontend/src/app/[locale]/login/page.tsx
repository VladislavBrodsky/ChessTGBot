'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const router = useRouter();
    const t = useTranslations('Login'); // Make sure to add this namespace or use a general one
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // If already logged in on web, redirect
        if (typeof window !== 'undefined' && localStorage.getItem('telegram_web_auth')) {
            router.replace('/home');
        }
    }, [router]);

    const handleTelegramAuth = (user: any) => {
        // Serialize user object to query string format matching TMA initData
        // Flat keys: id, first_name, last_name, username, photo_url, auth_date, hash
        const params = new URLSearchParams();
        Object.keys(user).forEach(key => {
            params.append(key, String(user[key]));
        });
        
        const initDataString = params.toString();
        localStorage.setItem('telegram_web_auth', initDataString);
        
        // Redirect to home dashboard
        router.push('/home');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-brand-void/90 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-rose/20 blur-[120px] pointer-events-none" />
            
            <div className="relative z-10 w-full max-w-4xl mx-auto p-4 flex items-center justify-center">
                <div className="w-full max-w-[800px] bg-brand-surface/80 backdrop-blur-xl border border-brand-primary/20 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row">
                    
                    {/* Left Column: Login Widget */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-brand-primary/10">
                        <div className="flex flex-col items-center space-y-6 text-center">
                            <div className="inline-flex items-center space-x-2 bg-brand-primary/10 text-brand-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                                <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                                <span>Secure Web Portal</span>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-brand-rose uppercase tracking-widest font-mono">
                                Web3Chess
                            </h1>
                            
                            <p className="text-sm text-brand-muted max-w-[280px]">
                                Premium decentralized chess. Log in via the official Telegram secure widget to access your account.
                            </p>
                            
                            <div className="pt-4 pb-2">
                                <TelegramLoginWidget 
                                    botName="chess_matbot" // Using the provided bot username
                                    buttonSize="large"
                                    cornerRadius={12}
                                    onAuthCallback={handleTelegramAuth}
                                />
                            </div>
                            
                            <div className="flex items-center space-x-2 text-xs text-brand-muted/70">
                                <svg className="w-4 h-4 text-brand-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>Secure authorization via Telegram</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: QR Info */}
                    <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center bg-black/20">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <h3 className="text-brand-primary font-mono font-semibold tracking-widest uppercase flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span>Play on Mobile</span>
                            </h3>
                            
                            <p className="text-sm text-brand-muted max-w-[240px]">
                                Scan this QR code with your phone camera to instantly open the Telegram Mini App.
                            </p>
                            
                            <div className="bg-white p-4 rounded-2xl shadow-lg mt-4">
                                {/* Placeholder for actual QR code pointing to t.me/chess_matbot */}
                                {/* In a real app we'd use a dynamic QR code component or static image */}
                                <div className="w-40 h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://t.me/chess_matbot`} 
                                        alt="QR Code to Bot"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            
                            <a 
                                href="https://t.me/chess_matbot" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-brand-primary hover:text-brand-rose transition-colors uppercase tracking-widest mt-4"
                            >
                                Open in Telegram →
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
