'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PageHeader, SectionHeader } from '@/components/ui/PageHeader';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SkeletonList } from '@/components/ui/Skeleton';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { Drawer } from '@/components/ui/Drawer';
import { telegramHaptic, telegramAlert, telegramConfirm } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { FaGem, FaCrown, FaChessBoard, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiShoppingBag, FiGrid, FiSliders } from 'react-icons/fi';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import LiveDropsTicker from '@/components/Marketplace/LiveDropsTicker';
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
    const [boxViewMode, setBoxViewMode] = useState<'carousel' | 'grid'>('carousel');
    const [activeBoxIndex, setActiveBoxIndex] = useState<number>(0);
    const carouselRef = React.useRef<HTMLDivElement>(null);

    const handleCarouselScroll = () => {
        if (!carouselRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        const maxScroll = scrollWidth - clientWidth;
        if (maxScroll <= 0) return;
        const scrollFraction = scrollLeft / maxScroll;
        const index = Math.min(
            BOX_ORDER.length - 1,
            Math.max(0, Math.round(scrollFraction * (BOX_ORDER.length - 1)))
        );
        setActiveBoxIndex(index);
    };

    const scrollToBox = (index: number) => {
        if (!carouselRef.current) return;
        telegramHaptic('selection');
        const cards = carouselRef.current.children;
        if (cards[index]) {
            (cards[index] as HTMLElement).scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
            setActiveBoxIndex(index);
        }
    };

    const handlePrevBox = () => {
        if (activeBoxIndex > 0) {
            scrollToBox(activeBoxIndex - 1);
        }
    };

    const handleNextBox = () => {
        if (activeBoxIndex < BOX_ORDER.length - 1) {
            scrollToBox(activeBoxIndex + 1);
        }
    };

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
            <main className="app-page pb-[calc(var(--app-safe-bottom)+6.5rem)]">
                    <PageHeader title={t('title')} description={t('subtitle')} icon={<FiShoppingBag />} tone="gold" />

                    {/* Social Proof Live Drops Marquee Ticker */}
                    <section aria-label="Live recent drops" className="w-full">
                        <LiveDropsTicker userDrops={recentWins} />
                    </section>

                    {/* Gamified XP Balance & Goal Progression Card */}
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

                            {/* Goal Progression Bar towards next tier mystery chest */}
                            {nextBox && (
                                <div className="mt-4 pt-3 border-t border-brand-border-opacity-10 relative z-10">
                                    <div className="flex items-center justify-between text-caption font-semibold">
                                        <span className="text-brand-muted">
                                            Target: <span className="text-brand-primary font-bold">{nextBox.name}</span>
                                        </span>
                                        <span className="text-brand-gold font-bold">
                                            {Math.min(100, Math.round((userXP / nextBox.costXP) * 100))}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-brand-elevated h-2.5 rounded-full overflow-hidden mt-1.5 border border-brand-border-opacity-10">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, Math.round((userXP / nextBox.costXP) * 100))}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-caption text-brand-muted">
                                        <span>{userXP.toLocaleString(locale)} / {nextBox.costXP.toLocaleString(locale)} XP</span>
                                        <span className="font-semibold text-amber-400">+{xpToNextBox.toLocaleString(locale)} XP to unlock</span>
                                    </div>
                                </div>
                            )}

                            {/* Viral XP Earn Shortcuts */}
                            <div className="mt-3.5 pt-3 border-t border-brand-border-opacity-10 flex flex-wrap items-center gap-2 relative z-10">
                                <span className="text-caption font-bold text-brand-muted">Earn XP:</span>
                                <Link
                                    href={`/${locale}/game`}
                                    className="ui-tap-target px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-border-opacity-10 text-caption font-semibold text-brand-primary hover:text-brand-gold hover:border-brand-gold transition-colors flex items-center gap-1.5"
                                >
                                    <span>⚡ Play Blitz</span>
                                    <span className="text-emerald-400 font-bold">+50 XP</span>
                                </Link>
                                <Link
                                    href={`/${locale}/academy`}
                                    className="ui-tap-target px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-border-opacity-10 text-caption font-semibold text-brand-primary hover:text-brand-gold hover:border-brand-gold transition-colors flex items-center gap-1.5"
                                >
                                    <span>🧩 Tactics</span>
                                    <span className="text-emerald-400 font-bold">+25 XP</span>
                                </Link>
                                <Link
                                    href={`/${locale}/profile`}
                                    className="ui-tap-target px-2.5 py-1.5 rounded-lg bg-brand-elevated border border-brand-border-opacity-10 text-caption font-semibold text-brand-primary hover:text-brand-gold hover:border-brand-gold transition-colors flex items-center gap-1.5"
                                >
                                    <span>👥 Invite</span>
                                    <span className="text-emerald-400 font-bold">+500 XP</span>
                                </Link>
                            </div>
                        </div>
                    </section>

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
                        <section className="w-full space-y-3.5" aria-labelledby="marketplace-vaults-title">
                            <div className="flex items-center justify-between gap-3 w-full">
                                <SectionHeader id="marketplace-vaults-title" title={t('section_boxes')} />
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* Carousel vs Grid View Switcher */}
                                    <div className="flex items-center p-0.5 rounded-xl bg-brand-surface border border-brand-border">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                telegramHaptic('selection');
                                                setBoxViewMode('carousel');
                                            }}
                                            className={`ui-tap-target px-2.5 py-1.5 rounded-lg text-caption font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                boxViewMode === 'carousel'
                                                    ? 'bg-brand-elevated text-brand-primary shadow-sm'
                                                    : 'text-brand-muted hover:text-brand-primary'
                                            }`}
                                            title="Horizontal Showcase"
                                            aria-label="Horizontal Showcase"
                                        >
                                            <FiSliders size={13} className="rotate-90 text-brand-action" />
                                            <span className="hidden sm:inline">Showcase</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                telegramHaptic('selection');
                                                setBoxViewMode('grid');
                                            }}
                                            className={`ui-tap-target px-2.5 py-1.5 rounded-lg text-caption font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                                                boxViewMode === 'grid'
                                                    ? 'bg-brand-elevated text-brand-primary shadow-sm'
                                                    : 'text-brand-muted hover:text-brand-primary'
                                            }`}
                                            title="Grid View"
                                            aria-label="Grid View"
                                        >
                                            <FiGrid size={13} />
                                            <span className="hidden sm:inline">Grid</span>
                                        </button>
                                    </div>

                                    {/* Desktop Left/Right navigation buttons for carousel */}
                                    {boxViewMode === 'carousel' && (
                                        <div className="hidden sm:flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={handlePrevBox}
                                                disabled={activeBoxIndex === 0}
                                                className="ui-tap-target p-2 rounded-xl bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                                aria-label="Previous vault"
                                            >
                                                <FaChevronLeft size={11} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleNextBox}
                                                disabled={activeBoxIndex === BOX_ORDER.length - 1}
                                                className="ui-tap-target p-2 rounded-xl bg-brand-surface border border-brand-border text-brand-muted hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                                aria-label="Next vault"
                                            >
                                                <FaChevronRight size={11} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {boxViewMode === 'carousel' ? (
                                <div className="w-full space-y-3">
                                    {/* Horizontal Snap Track with Peek */}
                                    <div
                                        ref={carouselRef}
                                        onScroll={handleCarouselScroll}
                                        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth items-stretch"
                                        style={{ WebkitOverflowScrolling: 'touch' }}
                                    >
                                        {BOX_ORDER.map((tier) => (
                                            <div
                                                key={tier}
                                                className="w-[78vw] max-w-[280px] sm:w-[270px] shrink-0 snap-center flex flex-col"
                                            >
                                                <MysteryBoxCard
                                                    tier={tier}
                                                    userXP={userXP}
                                                    onUnbox={() => handleOpenBox(tier)}
                                                    disabled={loadingStats || balanceError}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick-Jump Tier Indicator Strip */}
                                    <div className="flex items-center justify-start sm:justify-center gap-1.5 w-full py-1 overflow-x-auto scrollbar-none">
                                        {BOX_ORDER.map((tier, idx) => {
                                            const cfg = BOX_CONFIG[tier];
                                            const isActive = activeBoxIndex === idx;
                                            const { accent, rgb } = cfg.theme;
                                            return (
                                                <button
                                                    key={tier}
                                                    type="button"
                                                    onClick={() => scrollToBox(idx)}
                                                    className={`ui-tap-target px-2.5 py-1 rounded-full text-caption font-semibold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0 ${
                                                        isActive
                                                            ? 'shadow-sm'
                                                            : 'border-transparent text-brand-muted hover:text-brand-primary'
                                                    }`}
                                                    style={{
                                                        background: isActive ? `rgba(${rgb}, 0.14)` : 'transparent',
                                                        borderColor: isActive ? `rgba(${rgb}, 0.45)` : 'transparent',
                                                        color: isActive ? `color-mix(in srgb, ${accent} 40%, var(--text-primary))` : undefined,
                                                    }}
                                                >
                                                    <span className="text-xs">{cfg.glyph}</span>
                                                    <span>{cfg.metal}</span>
                                                    {cfg.limited && <span className="text-caption text-amber-400">★</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                /* Balanced Responsive Grid View */
                                <div className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 items-start gap-3 md:gap-4">
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
                            )}
                        </section>
                    )}

                    {(activeTab === 'all' || activeTab === 'premium') && (
                        <section className="w-full space-y-4 mt-2" aria-labelledby="marketplace-premium-title">
                            <SectionHeader id="marketplace-premium-title" title={t('section_premium')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                                {directPurchases.map((item) => {
                                    const affordable = userXP >= item.cost;
                                    const isYearly = item.id === 'premium_1y';
                                    return (
                                        <Card
                                            key={item.id}
                                            variant="solid"
                                            className={`p-5 transition-colors relative overflow-hidden flex flex-col justify-between ${affordable ? 'ui-stat--premium' : ''}`}
                                        >
                                            {isYearly && (
                                                <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-purple-500/20 border-b border-l border-purple-500/30 text-caption font-bold text-purple-300">
                                                    Best Value · 33% Off
                                                </div>
                                            )}
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0">
                                                        <h3 className="flex items-center gap-2 text-base font-semibold text-brand-primary">
                                                            <FaCrown style={{ color: "var(--badge-purple-ink)" }} aria-hidden="true" />
                                                            {item.name}
                                                        </h3>
                                                        <p className="mt-1 text-sm leading-5 text-brand-muted">{item.desc}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 mt-0.5">
                                                        {isYearly && (
                                                            <span className="block text-caption text-brand-muted line-through">
                                                                180,000 XP
                                                            </span>
                                                        )}
                                                        <Badge variant="purple">
                                                            {item.cost.toLocaleString(locale)} XP
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 text-caption pt-1 text-brand-muted">
                                                    <span className="px-2 py-0.5 rounded-md bg-brand-elevated border border-brand-border">⚡ Ad-Free Blitz</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-brand-elevated border border-brand-border">📊 Advanced Analytics</span>
                                                    <span className="px-2 py-0.5 rounded-md bg-brand-elevated border border-brand-border">👑 Crown Badge</span>
                                                    {isYearly && (
                                                        <span className="px-2 py-0.5 rounded-md bg-brand-elevated border border-brand-border text-amber-400 font-semibold">💎 2× Login Bonus</span>
                                                    )}
                                                    {isYearly && (
                                                        <span className="px-2 py-0.5 rounded-md bg-brand-elevated border border-brand-border text-emerald-400 font-semibold">Save 60,000 XP</span>
                                                    )}
                                                </div>
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
                        <section className="w-full space-y-4 mt-2" aria-labelledby="marketplace-themes-title">
                            <SectionHeader id="marketplace-themes-title" title={t('section_themes')} />
                            {loadingThemes ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
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
