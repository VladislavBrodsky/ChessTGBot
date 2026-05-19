import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { FaWallet } from 'react-icons/fa';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface LayoutWrapperProps {
    children: React.ReactNode;
    className?: string;
}

export default function LayoutWrapper({ children, className = "" }: LayoutWrapperProps) {
    const locale = useLocale();
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        // Sync balance on layout mount
        apiFetch("/api/v1/wallet/balance")
            .then(res => {
                if (res.ok) return res.json();
                throw new Error();
            })
            .then(data => setBalance(data.balance))
            .catch(() => {});
    }, []);

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-brand-void text-brand-primary font-sans selection:bg-brand-primary selection:text-brand-void">
            {/* Ambient Starfield */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                    backgroundSize: '48px 48px'
                }} />
                <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,.25)_50%),linear-gradient(90deg,rgba(255,255,255,.06),rgba(255,255,255,.02),rgba(255,255,255,.06))] bg-size-[100%_2px,3px_100%]" />
            </div>

            {/* Content Container */}
            <main className={`relative z-10 w-full flex flex-col items-center min-h-screen pt-4 pb-32 ${className}`}>
                {/* Unified Cyber-Top Bar */}
                <div className="w-full max-w-sm flex justify-between items-center px-4 py-2 mb-4 relative z-20">
                    <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest italic">NEURAL CHESS</span>
                    
                    <Link href={`/${locale}/wallet`}>
                        <motion.div 
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center space-x-1.5 px-3 py-1 rounded-full border border-brand-primary/10 bg-brand-surface/40 hover:bg-brand-primary/5 transition-all cursor-pointer shadow-premium"
                        >
                            <FaWallet className="text-[10px] text-brand-primary/60" />
                            <span className="text-[10px] font-black uppercase tracking-wide text-brand-primary">
                                ${(balance / 100).toFixed(2)}
                            </span>
                        </motion.div>
                    </Link>
                </div>

                {children}
            </main>

            <Navbar />
        </div>
    );
}
