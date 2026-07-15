'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { telegramHaptic } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { FaArrowLeft, FaGem, FaCrown, FaWallet, FaPalette } from 'react-icons/fa';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import UnboxingModal from '@/components/Marketplace/UnboxingModal';

interface BoardTheme {
    id: number;
    code: string;
    name: string;
    description: string;
    price_xp: number;
    css_class?: string;
    owned: boolean;
    theme_type: string;
}

export default function MarketplacePage() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const router = useRouter();

    const { stats, walletBalance, loadingStats, balanceError, syncStats } = useUser();

    // Marketplace currency choice state
    const [selectedCurrency, setSelectedCurrency] = useState<'xr' | 'xp'>('xr');

    // Themes states
    const [themes, setThemes] = useState<BoardTheme[]>([]);
    const [loadingThemes, setLoadingThemes] = useState(true);
    const [activeThemeCode, setActiveThemeCode] = useState<string>('default');

    // States for unboxing flow
    const [selectedTier, setSelectedTier] = useState<'common' | 'rare' | 'epic' | 'legendary' | 'seasonal' | null>(null);
    const [isUnboxingOpen, setIsUnboxingOpen] = useState(false);
    const [serverPrizeName, setServerPrizeName] = useState<string | null>(null);
    const [serverPrizeType, setServerPrizeType] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Fetch themes from backend
    const fetchThemes = async () => {
        try {
            setLoadingThemes(true);
            const res = await apiFetch('/api/v1/gamification/themes');
            if (res.ok) {
                const data = await res.json();
                setThemes(data);
            }
        } catch (err) {
            console.error("Failed to fetch themes", err);
        } finally {
            setLoadingThemes(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActiveThemeCode(localStorage.getItem('board_theme') || 'default');
        }
        fetchThemes();
    }, []);

    const handleEquipTheme = (themeCode: string) => {
        telegramHaptic('light');
        localStorage.setItem('board_theme', themeCode);
        setActiveThemeCode(themeCode);
    };

    // Mystery Box configurations
    const BOX_COSTS_XR = { common: 50, rare: 150, epic: 500, legendary: 1500, seasonal: 800 };
    const BOX_COSTS_XP = { common: 5000, rare: 8000, epic: 10000, legendary: 30000, seasonal: 12000 };

    const mysteryBoxes = [
        {
            tier: 'common' as const,
            name: "Bronze Mystery Box",
            description: "Entry-level chest. Contains minor multipliers, profile styles, or partial XR refunds."
        },
        {
            tier: 'rare' as const,
            name: "Silver Mystery Box",
            description: "High-value chest. Drop chances for 1-Week Premium upgrades and exclusive emotes."
        },
        {
            tier: 'epic' as const,
            name: "Gold Mystery Box",
            description: "Epic chest. Frequently drops 1-Month Premium memberships and top-tier styles."
        },
        {
            tier: 'legendary' as const,
            name: "Platinum Mystery Box",
            description: "The ultimate vault. Rare chance to unlock a full 1-Year Premium membership."
        },
        {
            tier: 'seasonal' as const,
            name: "Genesis Mystery Box",
            description: "Limited Edition Drop. Special seasonal collectibles and multipliers."
        }
    ];

    // Direct Purchases
    const DIRECT_COSTS_XR = { premium_1m: 1000, premium_1y: 8000 };
    const DIRECT_COSTS_XP = { premium_1m: 15000, premium_1y: 120000 };

    const directPurchases = [
        {
            id: 'premium_1m',
            name: "1-Month Premium",
            desc: "Full premium access. Ad-free, exclusive match analytics, and distinct profile badge."
        },
        {
            id: 'premium_1y',
            name: "1-Year Premium",
            desc: "Year-long premium access. Maximizes all benefits with a 30% discount compared to monthly rates."
        }
    ];

    const handleOpenBox = async (tier: 'common' | 'rare' | 'epic' | 'legendary' | 'seasonal') => {
        telegramHaptic('light');

        if (selectedCurrency === 'xr') {
            const cost = BOX_COSTS_XR[tier];
            const userXR = walletBalance / 100;
            if (userXR < cost) {
                telegramHaptic('error');
                alert("Insufficient XR balance. Play matches or complete quests to earn more.");
                return;
            }
        } else {
            const cost = BOX_COSTS_XP[tier];
            const userXP = stats?.xp || 0;
            if (userXP < cost) {
                telegramHaptic('error');
                alert("Insufficient XP balance. Complete lessons and puzzles to earn more.");
                return;
            }
        }

        try {
            const res = await apiFetch('/api/v1/marketplace/unbox', {
                method: 'POST',
                body: JSON.stringify({ 
                    tier,
                    currency: selectedCurrency
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                telegramHaptic('error');
                alert(errData.detail || "Unboxing failed.");
                return;
            }

            const data = await res.json();
            
            // Set server results and launch unboxing modal
            setServerPrizeName(data.prize_name);
            setServerPrizeType(data.prize_type);
            setSelectedTier(tier);
            setIsUnboxingOpen(true);

            if (syncStats) {
                syncStats();
            }
        } catch (err) {
            telegramHaptic('error');
            alert("Network error. Failed to unbox.");
        }
    };

    const handleUnboxClose = () => {
        setIsUnboxingOpen(false);
        if (serverPrizeName) {
            telegramHaptic('success');
            setSuccessMessage(`Congratulations! You unlocked: ${serverPrizeName}`);
            setTimeout(() => {
                setSuccessMessage(null);
            }, 4000);
        }
        setSelectedTier(null);
        setServerPrizeName(null);
        setServerPrizeType(null);
    };

    const handleDirectPurchase = async (id: string) => {
        telegramHaptic('light');

        if (selectedCurrency === 'xr') {
            const cost = DIRECT_COSTS_XR[id as keyof typeof DIRECT_COSTS_XR];
            const userXR = walletBalance / 100;
            if (userXR < cost) {
                telegramHaptic('error');
                alert("Insufficient XR balance.");
                return;
            }
        } else {
            const cost = DIRECT_COSTS_XP[id as keyof typeof DIRECT_COSTS_XP];
            const userXP = stats?.xp || 0;
            if (userXP < cost) {
                telegramHaptic('error');
                alert("Insufficient XP balance.");
                return;
            }
        }

        try {
            const res = await apiFetch('/api/v1/marketplace/purchase', {
                method: 'POST',
                body: JSON.stringify({ 
                    item_id: id,
                    currency: selectedCurrency
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                telegramHaptic('error');
                alert(errData.detail || "Purchase failed.");
                return;
            }

            telegramHaptic('success');
            alert("Purchase successful! Your item has been added to your account.");
            
            if (syncStats) {
                syncStats();
            }
        } catch (err) {
            telegramHaptic('error');
            alert("Network error. Purchase failed.");
        }
    };

    const handleBuyTheme = async (themeCode: string, costXP: number) => {
        telegramHaptic('light');
        const userXP = stats?.xp || 0;
        if (userXP < costXP) {
            telegramHaptic('error');
            alert("Insufficient XP balance.");
            return;
        }

        try {
            const res = await apiFetch('/api/v1/gamification/themes/buy', {
                method: 'POST',
                body: JSON.stringify({ theme_code: themeCode })
            });

            if (!res.ok) {
                const errData = await res.json();
                telegramHaptic('error');
                alert(errData.detail || "Failed to purchase theme.");
                return;
            }

            telegramHaptic('success');
            alert("Theme unlocked successfully!");
            
            // Refresh themes and user stats
            fetchThemes();
            if (syncStats) {
                syncStats();
            }
        } catch (err) {
            telegramHaptic('error');
            alert("Network error. Theme purchase failed.");
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
                        Exchange XR or XP to unlock premium rewards & themes
                    </p>
                </div>

                {/* Dual Balance Display Banner */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <Card variant="glass" className="p-4 border-brand-border-opacity-10 shadow-premium flex items-center justify-between relative overflow-hidden bg-brand-surface/40">
                        <div className="absolute inset-0 bg-glass-gradient opacity-30 pointer-events-none" />
                        <div className="space-y-1 relative z-10 text-left">
                            <span className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">XR balance</span>
                            <span className="text-sm font-black text-white leading-none mt-1.5 block">
                                {balanceError ? '—' : `${(walletBalance / 100).toFixed(0)} XR`}
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 relative z-10 shadow-inner-glow">
                            <FaWallet size={13} />
                        </div>
                    </Card>

                    <Card variant="glass" className="p-4 border-brand-border-opacity-10 shadow-premium flex items-center justify-between relative overflow-hidden bg-brand-surface/40">
                        <div className="absolute inset-0 bg-glass-gradient opacity-30 pointer-events-none" />
                        <div className="space-y-1 relative z-10 text-left">
                            <span className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">Scholastic XP</span>
                            <span className="text-sm font-black text-white leading-none mt-1.5 block">
                                {stats?.xp || 0} XP
                            </span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 relative z-10 shadow-inner-glow">
                            <FaGem size={13} />
                        </div>
                    </Card>
                </div>

                {/* Currency Toggler Segment (Sleek pill design) */}
                <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-brand-border-opacity-5 w-full">
                    <button
                        onClick={() => {
                            telegramHaptic('light');
                            setSelectedCurrency('xr');
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            selectedCurrency === 'xr'
                                ? 'bg-white/15 text-white border border-white/10 shadow-sm'
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        <FaWallet size={12} />
                        Unlock with XR
                    </button>
                    <button
                        onClick={() => {
                            telegramHaptic('light');
                            setSelectedCurrency('xp');
                        }}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            selectedCurrency === 'xp'
                                ? 'bg-white/15 text-white border border-white/10 shadow-sm'
                                : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        <FaGem size={12} />
                        Unlock with XP
                    </button>
                </div>

                {/* Section: Mystery Boxes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        Mystery Vault Drops
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {mysteryBoxes.map((box) => {
                            const cost = selectedCurrency === 'xr' 
                                ? BOX_COSTS_XR[box.tier] 
                                : BOX_COSTS_XP[box.tier];
                            return (
                                <MysteryBoxCard
                                    key={box.tier}
                                    tier={box.tier}
                                    name={box.name}
                                    cost={cost}
                                    currency={selectedCurrency}
                                    description={box.description}
                                    onUnbox={() => handleOpenBox(box.tier)}
                                    disabled={loadingStats || balanceError}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Section: Direct Upgrades (Subscriptions) */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        Premium Subscriptions
                    </h3>
                    <div className="grid grid-cols-1 gap-3 w-full">
                        {directPurchases.map((purchase) => {
                            const cost = selectedCurrency === 'xr'
                                ? DIRECT_COSTS_XR[purchase.id as keyof typeof DIRECT_COSTS_XR]
                                : DIRECT_COSTS_XP[purchase.id as keyof typeof DIRECT_COSTS_XP];
                            return (
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
                                        onClick={() => handleDirectPurchase(purchase.id)}
                                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                                    >
                                        {cost} {selectedCurrency.toUpperCase()}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Section: Board Themes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">
                        XP Board Themes Customization
                    </h3>
                    {loadingThemes ? (
                        <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {themes.map((theme) => {
                                // Dynamic preview style helper
                                const themeColors = theme.code === 'neon' 
                                    ? ['bg-zinc-950', 'bg-cyan-950']
                                    : (theme.code === 'wood' ? ['bg-amber-100', 'bg-amber-800'] : ['bg-zinc-800', 'bg-zinc-950']);

                                return (
                                    <div
                                        key={theme.id}
                                        className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-all duration-300 gap-4"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="flex w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                <div className={`flex-1 ${themeColors[0]}`} />
                                                <div className={`flex-1 ${themeColors[1]}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xs font-bold text-white leading-none">{theme.name}</h3>
                                                    {theme.owned && (
                                                        <Badge variant="secondary" className="text-[8px] font-black uppercase border-white/20 text-white/60 bg-white/5 py-0 px-1.5">
                                                            Owned
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-brand-muted leading-tight">{theme.description || "Customize your game board style."}</p>
                                            </div>
                                        </div>
                                        {theme.owned ? (
                                             activeThemeCode === theme.code ? (
                                                 <button
                                                     disabled
                                                     className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 cursor-not-allowed"
                                                 >
                                                     Active
                                                 </button>
                                             ) : (
                                                 <button
                                                     onClick={() => handleEquipTheme(theme.code)}
                                                     className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer transition-all active:scale-95"
                                                 >
                                                     Equip
                                                 </button>
                                             )
                                         ) : (
                                             <button
                                                 onClick={() => handleBuyTheme(theme.code, theme.price_xp)}
                                                 className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white text-black hover:bg-white/90 shadow-md cursor-pointer transition-all active:scale-95 shrink-0"
                                             >
                                                 {theme.price_xp} XP
                                             </button>
                                         )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Unboxing animation overlay */}
            <UnboxingModal
                isOpen={isUnboxingOpen}
                onClose={handleUnboxClose}
                tier={selectedTier}
                prizeName={serverPrizeName}
                prizeType={serverPrizeType}
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
