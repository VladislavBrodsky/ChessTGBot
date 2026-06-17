'use client';

import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { FaWallet, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function WalletConnect() {
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const [mounted, setMounted] = useState(false);

    const handleWalletAction = async () => {
        if (wallet) {
            await tonConnectUI.disconnect();
        } else {
            await tonConnectUI.openModal();
        }
    };

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
                                {wallet ? 'Active' : 'Wallet'}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary truncate">
                                {wallet ? getShortAddress(wallet.account.address) : 'Unlinked'}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleWalletAction}
                        className={wallet 
                          ? "w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                          : "py-1 px-2.5 rounded-xl bg-brand-primary text-brand-void text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary-hover active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                        }
                    >
                        {wallet ? <FaTimes size={10} /> : 'Connect'}
                    </button>
                </div>

                {wallet && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2 mt-2 pointer-events-none" />
                )}
            </motion.div>
        </div>
    );
}
