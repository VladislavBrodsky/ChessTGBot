'use client';

import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import { motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';
import { useState, useEffect } from 'react';

export default function WalletConnect() {
    const wallet = useTonWallet();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Function to generate the shortened address safely
    const getShortAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    if (!mounted) return null;

    return (
        <div className="w-full">
            <motion.div
                whileHover={{ scale: 1.01 }}
                className="glass-panel p-1 rounded-2xl border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between overflow-hidden relative"
            >
                {/* Custom styling wrapper for TonConnectButton */}
                <div className="w-full flex items-center justify-between pl-4 pr-1 py-1">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${wallet ? 'bg-brand-primary text-brand-void' : 'bg-brand-primary/10 text-brand-primary/40'}`}>
                            <FaWallet size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60">
                                {wallet ? 'Link Established' : 'Neural Link'}
                            </span>
                            <span className="text-[12px] font-black italic text-brand-primary tracking-tighter">
                                {wallet ? getShortAddress(wallet.account.address) : 'CONNECT WALLET'}
                            </span>
                        </div>
                    </div>

                    {/* The actual button, styled via CSS override in globals or passed props if supported, 
                        but standard button is robust. We wrap it to control layout */}
                    <div className="ton-connect-wrapper">
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
