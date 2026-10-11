'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Drawer } from '@/components/ui/Drawer';
import { telegramHaptic, telegramAlert, telegramConfirm } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { FaGem, FaCrown, FaChessBoard, FaEye } from 'react-icons/fa';
import { FiBox } from 'react-icons/fi';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import UnboxingModal from '@/components/Marketplace/UnboxingModal';
import UnboxConfirmSheet from '@/components/Marketplace/UnboxConfirmSheet';
import { BOX_CONFIG, BOX_ORDER, type BoxTier } from '@/components/Marketplace/boxConfig';
import { FiShoppingBag } from 'react-icons/fi';

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

function ThemeBoardPreview({ swatch }: { swatch: [string, string] }) {
    const squares = [];
    const pieces: Record<string, string> = {
        '0,0': '♜', '0,1': '♞', '0,2': '♝', '0,3': '♛', '0,4': '♚', '0,5': '♝', '0,6': '♞', '0,7': '♜',
        '1,0': '♟', '1,1': '♟', '1,2': '♟', '1,3': '♟', '1,4': '♟', '1,5': '♟', '1,6': '♟', '1,7': '♟',
        '6,0': '♙', '6,1': '♙', '6,2': '♙', '6,3': '♙', '6,4': '♙', '6,5': '♙', '6,6': '♙', '6,7': '♙',
        '7,0': '♖', '7,1': '♘', '7,2': '♗', '7,3': '♕', '7,4': '♔', '7,5': '♗', '7,6': '♘', '7,7': '♖',
    };

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const isLight = (r + c) % 2 === 0;
            const piece = pieces[`${r},${c}`];
            squares.push(
                <div
                    key={`${r}-${c}`}
                    className="flex items-center justify-center text-sm sm:text-base font-bold select-none aspect-square"
                    style={{
                        backgroundColor: isLight ? swatch[0] : swatch[1],
                        color: r < 2 ? '#09090b' : '#f4f4f5',
                        textShadow: r < 2 ? '0 0 2px rgba(255,255,255,0.4)' : '0 0 3px rgba(0,0,0,0.8)',
                    }}
                >
                    {piece || ''}
                </div>
            );
        }
    }

    return (
        <div className="w-full max-w-[260px] aspect-square mx-auto rounded-2xl overflow-hidden border border-brand-border shadow-2xl grid grid-cols-8 grid-rows-8">
            {squares}
        </div>
    );
}

type MarketplaceTab = 'all' | 'boxes' | 'premium' | 'themes';

export default function MarketplacePage() {
    const t = useTranslations('Marketplace');
    const ti = useTranslations('Index');
  const tc = useTranslations('Common');
    const locale = useLocale();

    const { stats, loadingStats, balanceError, syncStats } = useUser();
    const userXP = stats?.xp || 0;
    const nextTier = BOX_ORDER.find((tier) => BOX_CONFIG[tier].costXP > userXP);
    const nextBox = nextTier ? BOX_CONFIG[nextTier] : null;
    const xpToNextBox = nextBox ? nextBox.costXP - userXP : 0;

    const { data: themesData, error: themesError, isLoading: loadingThemes, mutate: fetchThemes } = useSWRFetch<BoardTheme[]>('/api/v1/gamification/themes', { revalidateOnFocus: false });
    const themes = Array.isArray(themesData) ? themesData : [];
    const [activeThemeCode, setActiveThemeCode] = useState<string>('default');

    const [selectedTier, setSelectedTier] = useState<BoxTier | null>(null);
    const [confirmingTier, setConfirmingTier] = useState<BoxTier | null>(null);
    const [unboxingLoading, setUnboxingLoading] = useState(false);
    const [isUnboxingOpen, setIsUnboxingOpen] = useState(false);
    const [serverPrizeName, setServerPrizeName] = useState<string | null>(null);
    const [serverPrizeType, setServerPrizeType] = useState<string | null>(null);
    const [recentWins, setRecentWins] = useState<WonPrize[]>([]);
    const [activeTab, setActiveTab] = useState<MarketplaceTab>('all');
    const [previewTheme, setPreviewTheme] = useState<BoardTheme | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setActiveThemeCode(localStorage.getItem('board_theme') || 'default');
            try {
                setRecentWins(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'));
            } catch { /* ignore */ }
        }
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
        telegramConfirm(t('confirm_purchase', { name, amount: cost.toLocaleString(locale) }), async (ok) => {
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
        telegramConfirm(t('confirm_purchase', { name, amount: costXP.toLocaleString(locale) }), async (ok) => {
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
        <LayoutWrapper className="w-full">
            <main className="app-page">
                    <PageHeader title={t('title')} description={t('subtitle')} icon={<FiShoppingBag />} tone="gold" />

                    <section aria-labelledby="xp-balance-heading" className="w-full">
                        <h2 id="xp-balance-heading" className="sr-only">{t('xp_balance_label')}</h2>
                        <div className="ui-hero-card ui-hero-card--gold p-4 sm:p-5">
                            <div className="flex items-center justify-between gap-4 relative z-10">
                                <div className="space-y-1 text-start">
                                <span className="ui-eyebrow">{t('xp_balance')}</span>
                                {loadingStats ? (
                                    <span className="mt-2 block h-8 w-28 animate-pulse rounded-lg bg-brand-elevated" />
                                ) : (
                                    <motion.span key={userXP} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 block text-3xl font-semibold leading-none tabular-nums text-brand-primary">
                                        {userXP.toLocaleString(locale)} <span className="text-lg text-brand-gold">XP</span>
                                    </motion.span>
                                )}
                                </div>
                                <span className="ui-icon-tile ui-icon-tile--gold h-12 w-12 rounded-2xl">
                                    <FaGem size={20} aria-hidden="true" />
                                </span>
                            </div>
                            {(loadingStats || nextBox) && (
                                <div className="mt-4 flex min-h-[var(--size-control-sm)] items-center justify-between gap-3 border-t border-brand-border-opacity-10 pt-4 relative z-10">
                                    {loadingStats || !nextBox ? <Skeleton width="60%" textRole="body" /> : <>
                                    <p className="text-sm leading-5 text-brand-muted">
                                        <span className="font-bold text-brand-primary">{nextBox.name}</span> · {t('need_more_xp', { amount: xpToNextBox.toLocaleString(locale) })}
                                    </p>
                                    <Link href={`/${locale}/academy`} className="inline-flex min-h-11 shrink-0 items-center rounded-xl px-3 text-sm font-semibold text-brand-success transition-colors hover:bg-brand-elevated">
                                        {ti('academy')}
                                    </Link>
                                    </>}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Recently won */}
                    <AnimatePresence>
                        {recentWins.length > 0 && (
                            <motion.div key="recent-wins" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full">
                                <SectionHeader title={t('recently_won')} />
                                <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1 px-1 scrollbar-none">
                                    {recentWins.map((w) => {
                                        const c = BOX_CONFIG[w.tier].theme;
                                        return (
                                            <div key={w.at} className="shrink-0 px-3.5 py-2.5 rounded-xl border bg-brand-surface flex items-center gap-2.5"
                                                style={{ borderColor: `rgba(${c.rgb},0.25)`, background: `rgba(${c.rgb},0.08)` }}>
                                                <FiBox size={13} style={{ color: c.accent }} className="drop-shadow-md" />
                                                <span className="text-caption font-semibold tracking-normal text-brand-primary whitespace-nowrap">{w.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Category Tabs / Filter */}
                    <nav aria-label={tc('marketplace_categories')} className="w-full pt-1">
                        <SegmentedControl
                            options={[
                                { value: 'all', label: 'All' },
                                { value: 'boxes', label: 'Vaults' },
                                { value: 'premium', label: 'VIP' },
                                { value: 'themes', label: 'Themes' },
                            ]}
                            value={activeTab}
                            onChange={(val) => {
                                telegramHaptic('selection');
                                setActiveTab(val);
                            }}
                            size="sm"
                        />
                    </nav>

                    {(activeTab === 'all' || activeTab === 'boxes') && (
                        <section className="w-full space-y-4" aria-labelledby="marketplace-vaults-title">
                            <SectionHeader id="marketplace-vaults-title" title={t('section_boxes')} />
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
                    )}

                    {(activeTab === 'all' || activeTab === 'premium') && (
                        <section className="w-full space-y-4 mt-2" aria-labelledby="marketplace-premium-title">
                            <SectionHeader id="marketplace-premium-title" title={t('section_premium')} />
                            <div className="grid grid-cols-1 gap-3 w-full">
                                {directPurchases.map((item) => {
                                    const affordable = userXP >= item.cost;
                                    return (
                                        <Card
                                            key={item.id}
                                            variant="solid"
                                            className={`p-5 transition-colors ${affordable ? 'ui-stat--premium' : ''}`}
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                <h3 className="flex items-center gap-2 text-base font-semibold text-brand-primary">
                                                    <FaCrown style={{ color: "var(--badge-purple-ink)" }} aria-hidden="true" />
                                                    {item.name}
                                                </h3>
                                                <p className="mt-2 text-sm leading-5 text-brand-muted">{item.desc}</p>
                                                </div>
                                                <Badge variant="purple">
                                                    {item.cost.toLocaleString(locale)} XP
                                                </Badge>
                                            </div>
                                            <Button
                                                variant={affordable ? 'premium' : 'secondary'}
                                                className="mt-4 w-full"
                                                disabled={!affordable || loadingStats || Boolean(balanceError)}
                                                onClick={() => handleDirectPurchase(item.id, item.name, item.cost)}
                                            >
                                                {affordable ? `${item.cost.toLocaleString(locale)} XP` : t('need_more_xp', { amount: (item.cost - userXP).toLocaleString(locale) })}
                                            </Button>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'themes') && (
                        <section className="w-full space-y-4 mt-2 pb-10" aria-labelledby="marketplace-themes-title">
                            <SectionHeader id="marketplace-themes-title" title={t('section_themes')} />
                            {loadingThemes ? (
                                <div className="grid grid-cols-1 gap-3 w-full">
                                    <SkeletonList count={3} label={t('section_themes')} />
                                </div>
                            ) : themesError && !themesData ? (
                                <ErrorState title={ti('load_failed')} message={ti('retry')} onRetry={() => { void fetchThemes(); }} retryLabel={ti('retry')} />
                            ) : themes.length === 0 ? (
                                <EmptyState
                                    icon={<FaChessBoard className="w-8 h-8 text-amber-500" />}
                                    title={t('section_themes')}
                                    actionLabel={ti('retry')}
                                    onAction={() => { void fetchThemes(); }}
                                />
                            ) : (
                                <div className="grid grid-cols-1 gap-3 w-full">
                                    {themes.map((theme) => {
                                        const swatch = THEME_SWATCHES[theme.code] || THEME_SWATCHES.default;
                                        const affordable = userXP >= theme.price_xp;
                                        return (
                                            <Card
                                                key={theme.id}
                                                variant="solid"
                                                className="flex items-center justify-between gap-3 p-4 transition-colors cursor-pointer group hover:border-brand-border-opacity-30"
                                                onClick={() => {
                                                    telegramHaptic('light');
                                                    setPreviewTheme(theme);
                                                }}
                                            >
                                                <div className="flex items-center gap-3.5 text-left min-w-0">
                                                    <div className="flex h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-brand-border-opacity-20 shadow-inner group-hover:scale-105 transition-transform">
                                                        <div className="flex-1" style={{ background: swatch[0] }} />
                                                        <div className="flex-1" style={{ background: swatch[1] }} />
                                                    </div>
                                                    <div className="space-y-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-sm font-semibold leading-none text-brand-primary">{theme.name}</h3>
                                                            {theme.owned && (
                                                                <Badge variant="emerald">{t('owned')}</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-caption text-brand-muted leading-tight line-clamp-1 font-medium">{theme.description || t('theme_default_desc')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            telegramHaptic('light');
                                                            setPreviewTheme(theme);
                                                        }}
                                                        className="ui-tap-target hidden sm:inline-flex items-center justify-center p-2 rounded-xl bg-brand-elevated hover:bg-brand-border-opacity-20 text-brand-muted hover:text-brand-primary transition-colors text-sm cursor-pointer"
                                                        title="Preview theme"
                                                        aria-label={tc('preview_theme')}
                                                    >
                                                        <FaEye />
                                                    </button>
                                                    {theme.owned ? (
                                                        activeThemeCode === theme.code ? (
                                                            <Button disabled variant="secondary" size="sm" className="shrink-0 border-emerald-500/20 bg-emerald-500/10 text-caption font-semibold normal-case tracking-normal text-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]">{t('active')}</Button>
                                                        ) : (
                                                            <Button onClick={() => handleEquipTheme(theme.code)} variant="secondary" size="sm" className="shrink-0 text-caption font-semibold normal-case tracking-normal hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-colors">{t('equip')}</Button>
                                                        )
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleBuyTheme(theme.code, theme.name, theme.price_xp)}
                                                            variant={affordable ? 'premium' : 'secondary'}
                                                            size="sm"
                                                            disabled={!affordable || loadingStats || Boolean(balanceError)}
                                                            className="shrink-0"
                                                        >
                                                            {affordable ? `${theme.price_xp.toLocaleString(locale)} XP` : t('need_more_xp', { amount: (theme.price_xp - userXP).toLocaleString(locale) })}
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}
            </main>

            <Drawer
                isOpen={Boolean(previewTheme)}
                onClose={() => setPreviewTheme(null)}
                title={previewTheme?.name || 'Theme Preview'}
                description={previewTheme?.description || t('theme_default_desc')}
            >
                {previewTheme && (() => {
                    const swatch = THEME_SWATCHES[previewTheme.code] || THEME_SWATCHES.default;
                    const affordable = userXP >= previewTheme.price_xp;
                    const isCurrent = activeThemeCode === previewTheme.code;
                    return (
                        <div className="flex flex-col items-center space-y-4 pt-1 pb-6 w-full max-w-sm mx-auto">
                            <ThemeBoardPreview swatch={swatch} />
                            <div className="flex items-center gap-2">
                                <Badge variant={previewTheme.owned ? 'emerald' : 'secondary'}>
                                    {previewTheme.owned ? t('owned') : `${previewTheme.price_xp.toLocaleString(locale)} XP`}
                                </Badge>
                                {isCurrent && (
                                    <Badge variant="emerald">
                                        {t('active')}
                                    </Badge>
                                )}
                            </div>
                            <div className="w-full pt-2">
                                {previewTheme.owned ? (
                                    isCurrent ? (
                                        <Button disabled variant="secondary" className="w-full border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                                            {t('active')}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={() => {
                                                handleEquipTheme(previewTheme.code);
                                                setPreviewTheme(null);
                                            }}
                                        >
                                            {t('equip')}
                                        </Button>
                                    )
                                ) : (
                                    <Button
                                        variant={affordable ? 'premium' : 'secondary'}
                                        disabled={!affordable || loadingStats || Boolean(balanceError)}
                                        className="w-full"
                                        onClick={() => {
                                            const targetTheme = previewTheme;
                                            setPreviewTheme(null);
                                            handleBuyTheme(targetTheme.code, targetTheme.name, targetTheme.price_xp);
                                        }}
                                    >
                                        {affordable ? t('confirm_unlock', { cost: previewTheme.price_xp.toLocaleString(locale) }) : t('need_more_xp', { amount: (previewTheme.price_xp - userXP).toLocaleString(locale) })}
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </Drawer>

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
