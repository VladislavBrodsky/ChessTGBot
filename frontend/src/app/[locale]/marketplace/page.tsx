'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { telegramHaptic, telegramAlert, telegramConfirm } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { FaGem, FaCrown } from 'react-icons/fa';
import { FiBox } from 'react-icons/fi';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import UnboxingModal from '@/components/Marketplace/UnboxingModal';
import UnboxConfirmSheet from '@/components/Marketplace/UnboxConfirmSheet';
import { BOX_CONFIG, BOX_ORDER, type BoxTier } from '@/components/Marketplace/boxConfig';

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

interface WonPrize {
    name: string;
    type: string;
    tier: BoxTier;
    at: number;
}

// Data-driven theme swatches — falls back to a neutral gradient for unknown codes.
const THEME_SWATCHES: Record<string, [string, string]> = {
    default: ['#3f3f46', '#0a0a0a'],
    neon: ['#00F0FF', '#7B2CBF'],
    wood: ['#d9b382', '#7a4a1e'],
    marble: ['#e8e8e8', '#8a8a8a'],
    obsidian: ['#334155', '#0b1120'],
    emerald: ['#34d399', '#065f46'],
    crimson: ['#f87171', '#7f1d1d'],
};

const RECENT_KEY = 'mkt_recent_wins';

export default function MarketplacePage() {
    const t = useTranslations('Marketplace');
    const ti = useTranslations('Index');
    const locale = useLocale();

    const { stats, loadingStats, balanceError, syncStats } = useUser();
    const userXP = stats?.xp || 0;
    const nextTier = BOX_ORDER.find((tier) => BOX_CONFIG[tier].costXP > userXP);
    const nextBox = nextTier ? BOX_CONFIG[nextTier] : null;
    const xpToNextBox = nextBox ? nextBox.costXP - userXP : 0;

    const [themes, setThemes] = useState<BoardTheme[]>([]);
    const [loadingThemes, setLoadingThemes] = useState(true);
    const [activeThemeCode, setActiveThemeCode] = useState<string>('default');

    const [selectedTier, setSelectedTier] = useState<BoxTier | null>(null);
    const [confirmingTier, setConfirmingTier] = useState<BoxTier | null>(null);
    const [unboxingLoading, setUnboxingLoading] = useState(false);
    const [isUnboxingOpen, setIsUnboxingOpen] = useState(false);
    const [serverPrizeName, setServerPrizeName] = useState<string | null>(null);
    const [serverPrizeType, setServerPrizeType] = useState<string | null>(null);
    const [recentWins, setRecentWins] = useState<WonPrize[]>([]);

    const fetchThemes = async () => {
        try {
            setLoadingThemes(true);
            const res = await apiFetch('/api/v1/gamification/themes');
            if (res.ok) setThemes(await res.json());
        } catch (err) {
            console.error('Failed to fetch themes', err);
        } finally {
            setLoadingThemes(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActiveThemeCode(localStorage.getItem('board_theme') || 'default');
            try {
                setRecentWins(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
            } catch { /* ignore */ }
        }
        fetchThemes();
    }, []);

    const pushRecentWin = (win: WonPrize) => {
        setRecentWins((prev) => {
            const next = [win, ...prev].slice(0, 8);
            if (typeof window !== 'undefined') localStorage.setItem(RECENT_KEY, JSON.stringify(next));
            return next;
        });
    };

    const handleEquipTheme = (themeCode: string) => {
        telegramHaptic('light');
        localStorage.setItem('board_theme', themeCode);
        setActiveThemeCode(themeCode);
    };

    const handleOpenBox = (tier: BoxTier) => {
        telegramHaptic('light');
        const cost = BOX_CONFIG[tier].costXP;
        if (userXP < cost) {
            telegramHaptic('error');
            telegramAlert(t('insufficient_xp'));
            return;
        }
        setConfirmingTier(tier);
    };

    const handleConfirmUnbox = async () => {
        if (!confirmingTier) return;
        const tier = confirmingTier;
        try {
            setUnboxingLoading(true);
            const res = await apiFetch('/api/v1/marketplace/unbox', {
                method: 'POST',
                body: JSON.stringify({ tier, currency: 'xp' }),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                telegramHaptic('error');
                telegramAlert(errData.detail || t('unbox_failed'));
                setConfirmingTier(null);
                return;
            }
            const data = await res.json();
            setServerPrizeName(data.prize_name);
            setServerPrizeType(data.prize_type);
            setSelectedTier(tier);
            setConfirmingTier(null);
            setIsUnboxingOpen(true);
            pushRecentWin({ name: data.prize_name, type: data.prize_type, tier, at: Date.now() });
            syncStats?.();
        } catch {
            telegramHaptic('error');
            telegramAlert(t('network_error'));
            setConfirmingTier(null);
        } finally {
            setUnboxingLoading(false);
        }
    };

    const handleUnboxClose = () => {
        setIsUnboxingOpen(false);
        setSelectedTier(null);
        setServerPrizeName(null);
        setServerPrizeType(null);
    };

    const directPurchases = [
        { id: 'premium_1m', name: t('premium_1m_name'), desc: t('premium_1m_desc'), cost: 15000 },
        { id: 'premium_1y', name: t('premium_1y_name'), desc: t('premium_1y_desc'), cost: 120000 },
    ];

    const handleDirectPurchase = (id: string, name: string, cost: number) => {
        telegramHaptic('light');
        if (userXP < cost) {
            telegramHaptic('error');
            telegramAlert(t('insufficient_xp'));
            return;
        }
        telegramConfirm(t('confirm_purchase', { name, amount: cost.toLocaleString() }), async (ok) => {
            if (!ok) return;
            try {
                const res = await apiFetch('/api/v1/marketplace/purchase', {
                    method: 'POST',
                    body: JSON.stringify({ item_id: id, currency: 'xp' }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    telegramHaptic('error');
                    telegramAlert(errData.detail || t('purchase_failed'));
                    return;
                }
                telegramHaptic('success');
                telegramAlert(t('purchase_success'));
                syncStats?.();
            } catch {
                telegramHaptic('error');
                telegramAlert(t('network_error'));
            }
        });
    };

    const handleBuyTheme = (themeCode: string, name: string, costXP: number) => {
        telegramHaptic('light');
        if (userXP < costXP) {
            telegramHaptic('error');
            telegramAlert(t('insufficient_xp'));
            return;
        }
        telegramConfirm(t('confirm_purchase', { name, amount: costXP.toLocaleString() }), async (ok) => {
            if (!ok) return;
            try {
                const res = await apiFetch('/api/v1/gamification/themes/buy', {
                    method: 'POST',
                    body: JSON.stringify({ theme_code: themeCode }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    telegramHaptic('error');
                    telegramAlert(errData.detail || t('theme_failed'));
                    return;
                }
                telegramHaptic('success');
                telegramAlert(t('theme_unlocked'));
                fetchThemes();
                syncStats?.();
            } catch {
                telegramHaptic('error');
                telegramAlert(t('network_error'));
            }
        });
    };

    return (
        <LayoutWrapper className="w-full px-4 md:px-6 pt-[max(1rem,var(--app-safe-top))] pb-[max(1rem,var(--app-safe-bottom))]">
            {/* Ambient background light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            
            <main className="flex w-full max-w-sm flex-col items-center mx-auto space-y-8 py-2 md:max-w-xl lg:max-w-3xl">
                    <header className="flex w-full flex-col items-center text-center relative pt-[calc(36px+var(--app-safe-top))] md:pt-4">
                        <motion.div animate={{ opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-black uppercase leading-none tracking-tight text-brand-primary">
                            <FaGem className="text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />
                            {t('title')}
                        </h1>
                        <p className="mt-2.5 max-w-xs text-[10px] font-bold uppercase leading-relaxed tracking-[0.16em] text-brand-muted flex flex-col items-center">
                            <span>EXCHANGE XP TO UNLOCK</span>
                            <span>PREMIUM REWARDS & THEMES</span>
                        </p>
                    </header>

                    <section aria-labelledby="xp-balance-heading" className="w-full">
                        <h2 id="xp-balance-heading" className="sr-only">Your XP Balance</h2>
                        <Card variant="solid" className="premium-liquid-content border-brand-border-opacity-20 p-5 shadow-premium overflow-hidden relative">
                            {/* Inner ambient light for XP card */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1 text-left">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-muted">{t('xp_balance')}</span>
                                {loadingStats ? (
                                    <span className="mt-2 block h-8 w-28 animate-pulse rounded-lg bg-brand-elevated" />
                                ) : (
                                    <motion.span key={userXP} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 block text-3xl font-black leading-none tabular-nums text-amber-400 drop-shadow-sm">
                                        {userXP.toLocaleString()} XP
                                    </motion.span>
                                )}
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
                                    <FaGem size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                </div>
                            </div>
                            {nextBox && !loadingStats && (
                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-brand-border-opacity-10 pt-4 relative z-10">
                                    <p className="text-xs leading-5 text-brand-muted">
                                        <span className="font-bold text-brand-primary">{nextBox.name}</span> · {t('need_more_xp', { amount: xpToNextBox.toLocaleString() })}
                                    </p>
                                    <Link href={`/${locale}/academy`} className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-amber-400 hover:text-amber-300 transition-colors drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">
                                        {ti('academy')}
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </section>

                    {/* Recently won */}
                    <AnimatePresence>
                        {recentWins.length > 0 && (
                            <motion.div key="recent-wins" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full">
                                <h3 className="text-[10px] font-black uppercase text-brand-muted tracking-[0.3em] text-center w-full mb-3">{t('recently_won')}</h3>
                                <div className="flex gap-2.5 overflow-x-auto pb-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                    {recentWins.map((w) => {
                                        const c = BOX_CONFIG[w.tier].theme;
                                        return (
                                            <div key={w.at} className="premium-liquid-content shrink-0 px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 shadow-sm transition-all hover:-translate-y-0.5"
                                                style={{ borderColor: `rgba(${c.rgb},0.25)`, background: `rgba(${c.rgb},0.08)` }}>
                                                <FiBox size={13} style={{ color: c.accent }} className="drop-shadow-md" />
                                                <span className="text-[10px] font-black tracking-wide text-brand-primary whitespace-nowrap">{w.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <section className="w-full space-y-5" aria-labelledby="marketplace-vaults-title">
                        <div className="text-center relative">
                            <h2 id="marketplace-vaults-title" className="text-xs font-black uppercase tracking-[0.25em] text-brand-primary drop-shadow-md">{t('section_boxes')}</h2>
                        </div>
                        {/* Ultra-premium 2026: Enforce exactly 2 columns for a robust, chunky layout */}
                        <div className="grid w-full grid-cols-2 items-start gap-3 md:gap-4">
                            {BOX_ORDER.map((tier) => (
                                <MysteryBoxCard
                                    key={tier}
                                    tier={tier}
                                    userXP={userXP}
                                    onUnbox={() => handleOpenBox(tier)}
                                    disabled={loadingStats || balanceError}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="w-full space-y-5 mt-4" aria-labelledby="marketplace-premium-title">
                        <h2 id="marketplace-premium-title" className="text-center text-xs font-black uppercase tracking-[0.25em] text-brand-primary drop-shadow-md">{t('section_premium')}</h2>
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {directPurchases.map((item) => {
                                const affordable = userXP >= item.cost;
                                return (
                                    <Card
                                        key={item.id}
                                        variant="solid"
                                        className={`premium-liquid-content p-5 transition-colors ${affordable ? 'border-brand-border-opacity-20 shadow-premium' : 'opacity-70 border-brand-border-opacity-5'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                            <h3 className="flex items-center gap-2 text-base font-black text-brand-primary">
                                                <FaCrown className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                                {item.name}
                                            </h3>
                                            <p className="mt-2 text-sm leading-5 text-brand-muted">{item.desc}</p>
                                            </div>
                                            <Badge variant="outline" className="shrink-0 border-purple-500/30 bg-purple-500/10 text-[10px] text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                                {item.cost.toLocaleString()} XP
                                            </Badge>
                                        </div>
                                        <Button
                                            variant={affordable ? 'primary' : 'secondary'}
                                            className={affordable ? 'mt-4 w-full bg-purple-500 text-brand-void hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all' : 'mt-4 w-full'}
                                            disabled={!affordable || loadingStats || Boolean(balanceError)}
                                            onClick={() => handleDirectPurchase(item.id, item.name, item.cost)}
                                        >
                                            {affordable ? `${item.cost.toLocaleString()} XP` : t('need_more_xp', { amount: (item.cost - userXP).toLocaleString() })}
                                        </Button>
                                    </Card>
                                );
                            })}
                        </div>
                    </section>

                    <section className="w-full space-y-5 mt-4 pb-10" aria-labelledby="marketplace-themes-title">
                        <h2 id="marketplace-themes-title" className="text-center text-xs font-black uppercase tracking-[0.25em] text-brand-primary drop-shadow-md">{t('section_themes')}</h2>
                        {loadingThemes ? (
                            <div className="grid grid-cols-1 gap-3 w-full">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-brand-surface border border-brand-border">
                                        <div className="flex items-center gap-4">
                                            <Skeleton variant="rectangular" width={44} height={44} className="rounded-xl" />
                                            <div className="space-y-2">
                                                <Skeleton variant="text" width={120} height={14} />
                                                <Skeleton variant="text" width={180} height={10} />
                                            </div>
                                        </div>
                                        <Skeleton variant="rectangular" width={72} height={32} className="rounded-xl" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 w-full">
                                {themes.map((theme) => {
                                    const swatch = THEME_SWATCHES[theme.code] || THEME_SWATCHES.default;
                                    const affordable = userXP >= theme.price_xp;
                                    return (
                                        <Card key={theme.id} variant="solid" className="premium-liquid-content flex items-center justify-between gap-4 p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-4 text-left min-w-0">
                                                <div className="flex h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-brand-border-opacity-20 shadow-inner">
                                                    <div className="flex-1" style={{ background: swatch[0] }} />
                                                    <div className="flex-1" style={{ background: swatch[1] }} />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="truncate text-sm font-bold leading-none text-brand-primary">{theme.name}</h3>
                                                        {theme.owned && (
                                                            <Badge variant="secondary" className="border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0 text-[8px] font-black uppercase text-emerald-500 drop-shadow-sm">{t('owned')}</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-brand-muted leading-tight line-clamp-1 font-medium">{theme.description || t('theme_default_desc')}</p>
                                                </div>
                                            </div>
                                            {theme.owned ? (
                                                activeThemeCode === theme.code ? (
                                                    <Button disabled variant="secondary" size="sm" className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">{t('active')}</Button>
                                                ) : (
                                                    <Button onClick={() => handleEquipTheme(theme.code)} variant="secondary" size="sm" className="shrink-0 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors">{t('equip')}</Button>
                                                )
                                            ) : (
                                                <Button
                                                    onClick={() => handleBuyTheme(theme.code, theme.name, theme.price_xp)}
                                                    variant={affordable ? 'primary' : 'secondary'}
                                                    size="sm"
                                                    disabled={!affordable || loadingStats || Boolean(balanceError)}
                                                    className={`shrink-0 text-[10px] font-black uppercase tracking-widest ${affordable ? 'bg-purple-500 text-brand-void hover:bg-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all' : ''}`}
                                                >
                                                    {affordable ? `${theme.price_xp.toLocaleString()} XP` : t('need_more_xp', { amount: (theme.price_xp - userXP).toLocaleString() })}
                                                </Button>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </section>
            </main>

            <UnboxConfirmSheet
                isOpen={Boolean(confirmingTier)}
                tier={confirmingTier}
                userXP={userXP}
                loading={unboxingLoading}
                onConfirm={handleConfirmUnbox}
                onCancel={() => setConfirmingTier(null)}
            />

            <UnboxingModal
                isOpen={isUnboxingOpen}
                onClose={handleUnboxClose}
                tier={selectedTier}
                prizeName={serverPrizeName}
                prizeType={serverPrizeType}
            />
        </LayoutWrapper>
    );
}
