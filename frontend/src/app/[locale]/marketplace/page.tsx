'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LayoutWrapper from '@/components/LayoutWrapper';
import { useUser } from '@/context/UserContext';
import { useTranslations, useLocale } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { telegramHaptic, telegramAlert, telegramConfirm } from '@/lib/telegram';
import { apiFetch } from '@/lib/api';
import { FaArrowLeft, FaGem, FaCrown } from 'react-icons/fa';
import { FiBox } from 'react-icons/fi';
import MysteryBoxCard from '@/components/Marketplace/MysteryBoxCard';
import UnboxingModal from '@/components/Marketplace/UnboxingModal';
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
    const locale = useLocale();
    const router = useRouter();

    const { stats, loadingStats, balanceError, syncStats } = useUser();
    const userXP = stats?.xp || 0;

    const [themes, setThemes] = useState<BoardTheme[]>([]);
    const [loadingThemes, setLoadingThemes] = useState(true);
    const [activeThemeCode, setActiveThemeCode] = useState<string>('default');

    const [selectedTier, setSelectedTier] = useState<BoxTier | null>(null);
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

    const handleOpenBox = async (tier: BoxTier) => {
        telegramHaptic('light');
        const cost = BOX_CONFIG[tier].costXP;
        if (userXP < cost) {
            telegramHaptic('error');
            telegramAlert(t('insufficient_xp'));
            return;
        }

        telegramConfirm(t('confirm_unbox', { name: BOX_CONFIG[tier].name, amount: cost.toLocaleString() }), async (ok) => {
            if (!ok) return;
            try {
                const res = await apiFetch('/api/v1/marketplace/unbox', {
                    method: 'POST',
                    body: JSON.stringify({ tier, currency: 'xp' }),
                });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    telegramHaptic('error');
                    telegramAlert(errData.detail || t('unbox_failed'));
                    return;
                }
                const data = await res.json();
                setServerPrizeName(data.prize_name);
                setServerPrizeType(data.prize_type);
                setSelectedTier(tier);
                setIsUnboxingOpen(true);
                pushRecentWin({ name: data.prize_name, type: data.prize_type, tier, at: Date.now() });
                syncStats?.();
            } catch {
                telegramHaptic('error');
                telegramAlert(t('network_error'));
            }
        });
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
        <LayoutWrapper className="pb-32 px-4 md:px-6">
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-xl lg:max-w-3xl mx-auto space-y-6 py-4">

                {/* Top nav */}
                <div className="w-full flex justify-between items-center">
                    <button
                        onClick={() => { telegramHaptic('light'); router.push(`/${locale}/home`); }}
                        className="text-brand-primary opacity-45 hover:opacity-100 transition-opacity flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                    >
                        <FaArrowLeft className="text-[10px]" />
                        <span>{t('back')}</span>
                    </button>
                    <div className="px-3 py-1 rounded-full bg-brand-surface border border-brand-border-opacity-10 text-[10px] font-black text-brand-primary opacity-40 uppercase tracking-widest flex items-center gap-1.5">
                        <FaGem className="text-white/60" />
                        <span>{t('title')}</span>
                    </div>
                </div>

                {/* Title */}
                <div className="w-full text-center flex flex-col items-center">
                    <h1 className="text-2xl font-black text-brand-primary tracking-tighter uppercase mb-1.5 whitespace-nowrap leading-none flex items-center gap-2">
                        <FaGem className="text-white/60 text-lg" />
                        {t('title')}
                    </h1>
                    <p className="text-[10px] font-bold text-brand-primary opacity-30 uppercase tracking-[0.2em] leading-none mt-1">
                        {t('subtitle')}
                    </p>
                </div>

                {/* Balance banner */}
                <div className="w-full">
                    <Card variant="glass" className="p-4 border-brand-border-opacity-10 shadow-premium flex items-center justify-between relative overflow-hidden bg-brand-surface/40">
                        <motion.div
                            className="absolute inset-0 pointer-events-none opacity-40"
                            style={{ background: 'linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.06) 50%, transparent 80%)' }}
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="space-y-1 relative z-10 text-left">
                            <span className="text-[9px] font-black text-brand-primary opacity-40 uppercase tracking-widest leading-none">{t('xp_balance')}</span>
                            {loadingStats ? (
                                <span className="block h-6 w-24 mt-1.5 rounded-md bg-white/10 animate-pulse" />
                            ) : (
                                <motion.span key={userXP} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                    className="text-xl font-black text-white leading-none mt-1.5 block tabular-nums">
                                    {userXP.toLocaleString()} XP
                                </motion.span>
                            )}
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 relative z-10 shadow-inner-glow">
                            <FaGem size={20} />
                        </div>
                    </Card>
                </div>

                {/* Recently won */}
                <AnimatePresence>
                    {recentWins.length > 0 && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="w-full">
                            <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full mb-2">{t('recently_won')}</h3>
                            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {recentWins.map((w) => {
                                    const c = BOX_CONFIG[w.tier].theme;
                                    return (
                                        <div key={w.at} className="shrink-0 px-3 py-2 rounded-xl border flex items-center gap-2"
                                            style={{ borderColor: `rgba(${c.rgb},0.25)`, background: `rgba(${c.rgb},0.06)` }}>
                                            <FiBox size={12} style={{ color: c.accent }} />
                                            <span className="text-[10px] font-bold text-white/70 whitespace-nowrap">{w.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mystery Boxes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">{t('section_boxes')}</h3>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {BOX_ORDER.map((tier, idx) => (
                            <MysteryBoxCard
                                key={tier}
                                tier={tier}
                                userXP={userXP}
                                onUnbox={() => handleOpenBox(tier)}
                                disabled={loadingStats || balanceError}
                                /* seasonal is the 5th box — let it span the full row */
                                className={idx === BOX_ORDER.length - 1 && BOX_ORDER.length % 2 !== 0 ? 'col-span-2' : ''}
                            />
                        ))}
                    </div>
                </div>

                {/* Premium Subscriptions */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">{t('section_premium')}</h3>
                    <div className="grid grid-cols-1 gap-3 w-full">
                        {directPurchases.map((item) => {
                            const affordable = userXP >= item.cost;
                            return (
                                <Card
                                    key={item.id}
                                    variant="glass"
                                    className={`p-5 flex flex-col justify-between border-brand-border-opacity-10 transition-all group shadow-premium ${affordable ? 'hover:border-brand-primary/30 cursor-pointer' : 'opacity-70'}`}
                                    onClick={() => handleDirectPurchase(item.id, item.name, item.cost)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-sm font-black text-white group-hover:text-brand-primary transition-colors flex items-center gap-2">
                                            <FaCrown className="text-brand-primary opacity-60" />
                                            {item.name}
                                        </h4>
                                        <Badge variant="outline" className={`text-[9px] border-brand-primary/20 bg-brand-primary/5 shadow-inner-glow ${affordable ? 'text-brand-primary' : 'text-white/40'}`}>
                                            {item.cost.toLocaleString()} XP
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-brand-muted leading-tight">{item.desc}</p>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Board Themes */}
                <div className="w-full space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-brand-primary opacity-30 tracking-[0.3em] text-center w-full">{t('section_themes')}</h3>
                    {loadingThemes ? (
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {[0, 1, 2].map((i) => <div key={i} className="h-[72px] rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 w-full">
                            {themes.map((theme) => {
                                const swatch = THEME_SWATCHES[theme.code] || THEME_SWATCHES.default;
                                const affordable = userXP >= theme.price_xp;
                                return (
                                    <div key={theme.id} className="p-4 rounded-2xl border border-white/10 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-all duration-300 gap-4">
                                        <div className="flex items-center gap-4 text-left min-w-0">
                                            <div className="flex w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                <div className="flex-1" style={{ background: swatch[0] }} />
                                                <div className="flex-1" style={{ background: swatch[1] }} />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xs font-bold text-white leading-none truncate">{theme.name}</h3>
                                                    {theme.owned && (
                                                        <Badge variant="secondary" className="text-[8px] font-black uppercase border-white/20 text-white/60 bg-white/5 py-0 px-1.5">{t('owned')}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-brand-muted leading-tight line-clamp-1">{theme.description || t('theme_default_desc')}</p>
                                            </div>
                                        </div>
                                        {theme.owned ? (
                                            activeThemeCode === theme.code ? (
                                                <button disabled className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 cursor-not-allowed">{t('active')}</button>
                                            ) : (
                                                <button onClick={() => handleEquipTheme(theme.code)} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer transition-all active:scale-95">{t('equip')}</button>
                                            )
                                        ) : (
                                            <button
                                                onClick={() => handleBuyTheme(theme.code, theme.name, theme.price_xp)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md cursor-pointer transition-all active:scale-95 shrink-0 ${affordable ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/50'}`}
                                            >
                                                {theme.price_xp.toLocaleString()} XP
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

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
