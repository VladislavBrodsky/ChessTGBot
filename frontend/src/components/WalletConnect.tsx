'use client';

import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { FaWallet, FaTimes } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { apiFetch } from '@/lib/api';

interface WalletConnectProps {
    minimal?: boolean;
    onTopUp?: () => void;
}

export default function WalletConnect({ minimal = false, onTopUp }: WalletConnectProps) {
    const tw = useTranslations('Wallet');
    const wallet = useTonWallet();
    const [tonConnectUI] = useTonConnectUI();
    const [mounted, setMounted] = useState(false);

    const handleTopUpClick = async () => {
        if (!wallet) {
            await tonConnectUI.openModal();
        } else {
            if (onTopUp) {
                onTopUp();
            }
        }
    };

    const handleDisconnect = async () => {
        await tonConnectUI.disconnect();
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

    if (minimal) {
        return (
            <div className="w-full min-w-0">
                {wallet ? (
                    <button
                        onClick={handleTopUpClick}
                        className="arena-topup-button w-full min-h-[44px] px-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none"
                        title={`Connected: ${getShortAddress(wallet.account.address)}`}
                    >
                        <FaWallet size={10} className="shrink-0" />
                        <span className="truncate">{tw('top_up')}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                    </button>
                ) : (
                    <button
                        onClick={handleTopUpClick}
                        className="arena-topup-button w-full min-h-[44px] px-3 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none"
                    >
                        <FaWallet size={10} />
                        <span>{tw('top_up')}</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full">
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="glass-panel p-1 h-full rounded-2xl border-brand-border-opacity-10 bg-brand-surface flex items-center justify-between overflow-hidden relative shadow-sm"
            >
                {/* Custom styling wrapper for TonConnectButton */}
                <div className="w-full flex items-center justify-between pl-2 pr-1 py-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${wallet ? 'bg-brand-primary text-brand-void' : 'bg-brand-bg-opacity-10 text-brand-primary opacity-60'}`}>
                            <FaWallet size={10} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary opacity-45 truncate">
                                {wallet ? tw('active') : tw('wallet')}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wide text-brand-primary/80 truncate">
                                {wallet ? getShortAddress(wallet.account.address) : tw('unlinked')}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={wallet ? handleDisconnect : handleTopUpClick}
                        className={wallet 
                          ? "w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500/20 active:scale-95 transition-all shrink-0 cursor-pointer shadow-sm"
                          : "py-1 px-2 rounded-lg bg-brand-primary text-brand-void text-[10px] font-black uppercase tracking-wider hover:bg-brand-primary-hover active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
                        }
                    >
                        {wallet ? <FaTimes size={9} /> : tw('top_up')}
                    </button>
                </div>

                {wallet && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2 mt-2 pointer-events-none" />
                )}
            </motion.div>
        </div>
    );
}
