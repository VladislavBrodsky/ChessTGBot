'use client';

import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function WalletConnect() {
    const wallet = useTonWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && wallet?.account?.address) {
            let telegramId = null;
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                telegramId = window.Telegram.WebApp.initDataUnsafe?.user?.id;
            }

            // Fallback for local testing/development
            if (!telegramId) {
                telegramId = 123456789;
            }

            apiFetch('/api/v1/users/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    wallet_address: wallet.account.address
                })
            })
                .then(res => {
                    if (res.ok) {
                        console.log("✅ Wallet successfully synced with platform database.");
                    }
                })
                .catch(err => console.error("❌ Failed to sync wallet with backend", err));
        }
    }, [wallet, mounted]);

    // Function to generate the shortened address safely
    const getShortAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (!mounted) return null;

    return (
        <div className="w-full">
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="glass-panel p-1.5 rounded-2xl border-brand-border-opacity-10 bg-brand-surface flex items-center justify-between overflow-hidden relative shadow-sm"
            >
                {/* Custom styling wrapper for TonConnectButton */}
                <div className="w-full flex items-center justify-between pl-3 pr-1 py-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${wallet ? 'bg-brand-primary text-brand-void' : 'bg-brand-bg-opacity-10 text-brand-primary opacity-60'}`}>
                            <FaWallet size={12} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary opacity-40 truncate">
                                {wallet ? 'Link Active' : 'Neural Link'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary truncate">
                                {wallet ? getShortAddress(wallet.account.address) : 'UNLINKED'}
                            </span>
                        </div>
                    </div>

                    {/* The actual button, styled via CSS override in globals or passed props if supported, 
                        but standard button is robust. We wrap it to control layout */}
                    <div className="ton-connect-wrapper shrink-0">
                        <TonConnectButton />
                    </div>
                </div>

                {wallet && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2 mt-2 pointer-events-none" />
                )}
            </motion.div>
        </div>
    );
}
