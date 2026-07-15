'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { telegramHaptic } from '@/lib/telegram';
import { FaArrowLeft, FaGem, FaCrown, FaPalette, FaWallet } from 'react-icons/fa';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import UnboxingModal from '@/components/Marketplace/UnboxingModal';

export default function MarketplacePage() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const router = useRouter();

    const { stats, walletBalance, loadingStats, balanceError, syncStats } = useUser();

    // States for unboxing flow
    const [selectedTier, setSelectedTier] = useState<'common' | 'rare' | 'epic' | 'legendary' | 'seasonal' | null>(null);
    const [isUnboxingOpen, setIsUnboxingOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Mystery Box configuration (5 Mystery Boxes using XR)
    const MYSTERY_BOXES = [
        {
            tier: 'common' as const,
            name: "Bronze Mystery Box",
            cost: 50,
            description: "Entry-level chest. Contains minor multipliers, profile styles, or partial XR refunds."
        },
        {
            tier: 'rare' as const,
            name: "Silver Mystery Box",
            cost: 150,
            description: "High-value chest. Drop chances for 1-Week Premium upgrades and exclusive emotes."
        },
        {
            tier: 'epic' as const,
            name: "Gold Mystery Box",
            cost: 500,
            description: "Epic chest. Frequently drops 1-Month Premium memberships and top-tier styles."
        },
        {
            tier: 'legendary' as const,
            name: "Platinum Mystery Box",
            cost: 1500,
            description: "The ultimate vault. Rare chance to unlock a full 1-Year Premium membership."
        },
        {
            tier: 'seasonal' as const,
            name: "Genesis Mystery Box",
            cost: 800,
            description: "Limited Edition Drop. Special seasonal collectibles and multipliers."
        }
    ];

    // Premium Subscriptions
    const DIRECT_PURCHASES = [
        {
            id: 'premium_1m',
            name: "1-Month Premium",
            cost: 1000,
            desc: "Full premium access. Ad-free, exclusive match analytics, and distinct profile badge."
        },
        {
            id: 'premium_1y',
            name: "1-Year Premium",
            cost: 8000,
            desc: "Year-long premium access. Maximizes all benefits with a 30% discount compared to monthly rates."
        }
    ];

    // Board Themes
    const CUSTOM_THEMES = [
        {
            id: 'theme-emerald',
            name: 'Emerald Matrix',
            cost: 200,
            previewColors: ['bg-zinc-800', 'bg-emerald-950'],
            desc: 'A gorgeous dark green matrix aesthetic for your matches.'
        },
        {
            id: 'theme-cyber',
            name: 'Cyberpunk Grid',
            cost: 350,
            previewColors: ['bg-zinc-950', 'bg-slate-900'],
            desc: 'High-contrast board theme built for speed.'
        },
        {
            id: 'theme-gold',
            name: 'Royal Gold',
            cost: 600,
            previewColors: ['bg-amber-200', 'bg-amber-950'],
            desc: 'Luxury royal theme with polished gold accents.'
        }
    ];

    const handleOpenBox = (tier: 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal', cost: number) => {
        telegramHaptic('light');
        const userXR = walletBalance / 100;

        if (userXR < cost) {
            telegramHaptic('error');
            alert("Insufficient XR balance. Play matches or complete quests to earn more.");
            return;
        }

        setSelectedTier(tier);
        setIsUnboxingOpen(true);
    };

    const handleUnboxSuccess = (prizeName: string) => {
        telegramHaptic('success');
        setSuccessMessage(`Congratulations! You unlocked: ${prizeName}`);

        setTimeout(() => {
            setSuccessMessage(null);
        }, 4000);

        if (syncStats) {
            syncStats();
        }
    };

    const handleDirectPurchase = (id: string, cost: number) => {
        telegramHaptic('light');
        const userXR = walletBalance / 100;
        if (userXR < cost) {
            telegramHaptic('error');
            alert("Insufficient XR balance.");
            return;
        }

        telegramHaptic('success');
        alert("Purchase successful! Your item has been added to your account.");
        if (syncStats) {
            syncStats();
        }
    };

    return (
        <LayoutWrapper className="pb-32 px-4 md:px-6">
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-6 py-4">

                {/* Top Nav Row */}
                <div className="w-full flex justify-between items-center">
                    <button
                        onClick={() => {
                            telegramHaptic('light');
                            router.push(`/${locale}/home`);
                        }}
                        className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                    >
                        <FaArrowLeft className="text-[10px]" />
                        <span>Back</span>
                    </button>
                    <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border-opacity-10 text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                        <FaGem className="text-white/60" />
                        <span>Marketplace</span>
                    </div>
                </div>

                {/* Page Title */}
                <div className="w-full text-center flex flex-col items-center">
                    <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1.5 whitespace-nowrap leading-none flex items-center gap-2">
                        <FaGem className="text-white/60 text-lg" />
                        Marketplace
                    </h1>
                    <p className="text-[10px] font-bold text-brand-primary opacity-30 uppercase tracking-[0.2em] leading-none mt-1">
                        Exchange XR to unlock premium rewards & themes
                    </p>
                </div>

                {/* User Balance Banner */}
                <Card variant="glass" className="w-full p-4 border-brand-border-opacity-10 shadow-premium flex items-center justify-between relative overflow-hidden bg-brand-surface/40">
                    <div className="absolute inset-0 bg-glass-gradient opacity-30 pointer-events-none" />
                    <div className="space-y-1 relative z-10 text-left">
                        <span className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">Available Balance</span>
                        <span className="text-lg font-black text-white leading-none mt-1.5 block">
                            {balanceError ? '—' : `${(walletBalance / 100).toFixed(0)} XR`}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 relative z-10 shadow-inner-glow">
                        <FaWallet size={16} />
                    </div>
                </Card>

                {/* Section: Mystery Boxes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        Mystery Vault Drops
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {MYSTERY_BOXES.map((box) => (
                            <MysteryBoxCard
                                key={box.tier}
                                tier={box.tier}
                                name={box.name}
                                cost={box.cost}
                                description={box.description}
                                onUnbox={() => handleOpenBox(box.tier, box.cost)}
                                disabled={loadingStats || balanceError}
                            />
                        ))}
                    </div>
                </div>

                {/* Section: Direct Upgrades (Subscriptions) */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        Premium Subscriptions
                    </h3>
                    <div className="grid grid-cols-1 gap-3 w-full">
                        {DIRECT_PURCHASES.map((purchase) => (
                            <div
                                key={purchase.id}
                                className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-all duration-300 gap-4"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white shadow-inner-glow shrink-0">
                                        <FaCrown className="text-white/60" size={16} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold text-white leading-none">{purchase.name}</h3>
                                        <p className="text-[10px] text-brand-muted leading-tight">{purchase.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDirectPurchase(purchase.id, purchase.cost)}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                                >
                                    {purchase.cost} XR
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Board Themes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        Custom Board Themes
                    </h3>
                    <div className="grid grid-cols-1 gap-3 w-full">
                        {CUSTOM_THEMES.map((theme) => (
                            <div
                                key={theme.id}
                                className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-all duration-300 gap-4"
                            >
                                <div className="flex items-center gap-4 text-left">
                                    <div className="flex w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <div className={`flex-1 ${theme.previewColors[0]}`} />
                                        <div className={`flex-1 ${theme.previewColors[1]}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold text-white leading-none">{theme.name}</h3>
                                        <p className="text-[10px] text-brand-muted leading-tight">{theme.desc}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDirectPurchase(theme.id, theme.cost)}
                                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                                >
                                    {theme.cost} XR
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Unboxing animation overlay */}
            <UnboxingModal
                isOpen={isUnboxingOpen}
                onClose={() => setIsUnboxingOpen(false)}
                tier={selectedTier}
                onSuccess={handleUnboxSuccess}
            />

            {/* Success Toast Notification */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm p-4 rounded-2xl bg-white border border-white text-black shadow-premium flex items-center justify-center text-xs font-black uppercase tracking-wider text-center"
                    >
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </LayoutWrapper>
    );
}
