'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot, FaStar, FaChessKnight, FaTimes, FaMoon, FaSun, FaVolumeUp, FaVolumeMute, FaShareAlt } from "react-icons/fa";
import { useTranslations, useLocale } from 'next-intl';
import XPProgressBar from "@/components/XPProgressBar";
import DailyTasks from "@/components/DailyTasks";
import { useTheme } from "@/context/ThemeContext";
import { AnimatePresence } from "framer-motion";
import MarketingBanners from "@/components/MarketingBanners";
import NewsSection from "@/components/NewsSection";
import Leaderboard from "@/components/Leaderboard";
import ReferralSection from "@/components/ReferralSection";
import WalletConnect from "@/components/WalletConnect";

export default function Home() {
    const t = useTranslations('Index');
    const locale = useLocale();
    const [tgUser, setTgUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showGameSection, setShowGameSection] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const { theme, toggleTheme } = useTheme();
    const tSettings = useTranslations('Settings');

    useEffect(() => {
        // Init Telegram WebApp Data
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            setTgUser(tg.initDataUnsafe?.user);

            // Check for deep link (Auto-Join)
            const startParam = tg.initDataUnsafe?.start_param;
            if (startParam) {
                console.log("Auto-joining game:", startParam);
                window.location.href = `/game?id=${startParam}`;
            }

            // Fetch User Stats and Sync Profile
            if (tg.initDataUnsafe?.user?.id) {
                fetch(`/api/v1/users/sync`, {
                    method: "POST",
                    headers: {
                        'X-Telegram-Init-Data': (tg as any).initData || ""
                    }
                })
                    .then(res => res.json())
                    .then(data => {
                        setStats(data);
                    })
                    .catch(err => console.error("Failed to fetch Stats", err));
            }
        } else {
            // Dev Mode Mock
            setTgUser({ first_name: "Master", photo_url: null });
            setStats({
                elo: 1250,
                wins: 15,
                losses: 5,
                draws: 2,
                is_premium: true,
                win_rate: 68.2,
                current_streak: { type: 'win', count: 3 },
                best_streak: { wins: 7, date: new Date() },
                recent_games: [
                    { game_id: '1', opponent: { name: 'Player 1', elo: 1230 }, result: 'win', elo_change: 12, played_at: new Date().toISOString(), duration_seconds: 1200 },
                    { game_id: '2', opponent: { name: 'Player 2', elo: 1190 }, result: 'win', elo_change: 10, played_at: new Date().toISOString(), duration_seconds: 1500 },
                    { game_id: '3', opponent: { name: 'Player 3', elo: 1270 }, result: 'loss', elo_change: -15, played_at: new Date().toISOString(), duration_seconds: 900 }
                ]
            });
        }
    }, []);

    const handleShareResult = (game: any) => {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            const resultText = game.result === 'win' ? 'Just secured a VICTORY' : game.result === 'loss' ? 'Fought a tough battle' : 'Reached a stalemate';
            const eloText = game.elo_change > 0 ? `+${game.elo_change}` : `${game.elo_change}`;
            const message = `${resultText} against ${game.opponent.name}! 📈 Neural Ranking: ${eloText} ELO. \n\nJoin the FinChess matrix and start earning: https://t.me/FinChessBot?start=${stats?.referral_code || ''}`;

            tg.switchInlineQuery(message, ["users", "groups", "channels"]);

            if (tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
        }
    };

    const createGame = async (type: 'online' | 'computer' = 'online') => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const initData = typeof window !== "undefined" ? (window.Telegram?.WebApp as any)?.initData : "";
            const res = await fetch(`/api/v1/game/create?type=${type}`, {
                method: "POST",
                headers: {
                    'X-Telegram-Init-Data': initData || ""
                }
            });
            if (!res.ok) throw new Error("Backend error");
            const data = await res.json();

            if (type === 'online' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(data.game_id, ["users", "groups", "channels"]);
            } else {
                window.location.href = `/game?id=${data.game_id}`;
            }
        } catch (e) {
            console.error("Failed to create game", e);
            alert("Error creating game. Is backend running?");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <LayoutWrapper className="pb-32 px-4 md:px-6">
            <div className="flex flex-col items-center w-full max-w-sm md:max-w-md mx-auto space-y-6 py-6">

                {/* HUD / Status Bar */}
                <div className="w-full glass-panel p-4 rounded-2xl border-brand-primary/10 flex items-center justify-between shadow-premium">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-surface border border-brand-primary/10 flex items-center justify-center">
                            <FaChessKnight className="text-brand-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-brand-primary/40 uppercase tracking-widest leading-none mb-1">
                                {tgUser?.first_name} {tgUser?.last_name || ""}
                            </span>
                            <span className="text-sm font-black text-brand-primary italic tracking-tighter">{stats?.elo || 1000} ELO</span>
                        </div>
                    </div>
                    <div className="w-32">
                        <XPProgressBar xp={stats?.xp || 850} level={stats?.level || 5} />
                    </div>
                </div>



                {/* Wallet Connection Protocol */}
                <WalletConnect />

                {/* Minimalist Brand Section */}
                <div className="flex flex-col items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-brand-primary text-4xl md:text-5xl font-black italic tracking-tighter select-none mb-1 shadow-neon"
                    >
                        {t('title')}
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-lg font-bold text-brand-primary/80 mb-2"
                    >
                        {t('welcome', { name: tgUser?.first_name || 'Player' })}
                    </motion.div>
                    <div className="h-px w-16 bg-brand-primary/10 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-brand-primary/20">{t('subtitle')}</span>
                </div>

                {/* Profile Widget Container */}
                <div className="w-full space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-4 flex items-center justify-between shadow-premium relative overflow-hidden group"
                    >
                        {/* Decorative background element */}
                        <div className="absolute -top-4 -right-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform rotate-12">
                            <FaChessPawn size={120} />
                        </div>

                        <div className="flex items-center space-x-3 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-brand-elevated border border-brand-primary/5 p-1 relative shadow-inner-glow">
                                {tgUser?.photo_url ? (
                                    <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-linear-to-br from-white/10 to-transparent flex items-center justify-center text-xl font-black text-brand-primary/30">
                                        {tgUser?.first_name?.[0] || "?"}
                                    </div>
                                )}
                                {stats?.is_premium && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary rounded-full flex items-center justify-center text-[9px] text-brand-void border-2 border-brand-void">
                                        <FaStar />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-base font-extrabold tracking-tight text-brand-primary flex items-center gap-2 leading-none mb-1">
                                    {tgUser?.first_name} {tgUser?.last_name || ""}
                                </h2>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest leading-none mb-0.5">{t('rating')}</span>
                                        <span className="text-[11px] font-black text-brand-primary/90">{stats?.elo || 1000} {t('elo')}</span>
                                    </div>
                                    <div className="w-px h-5 bg-brand-primary/5" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest leading-none mb-0.5">{t('win_rate')}</span>
                                        <span className="text-[11px] font-black text-brand-primary/90">{stats?.win_rate?.toFixed(1) || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center relative z-10">
                            <div className="px-2 py-0.5 rounded-lg border border-brand-primary/10 bg-brand-primary/5 shadow-inner-glow">
                                <span className="text-[9px] font-black text-brand-primary/60 tracking-tighter uppercase whitespace-nowrap">{t('level')} 0{Math.floor((stats?.elo || 1000) / 200)}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Streak & Stats Cards */}
                    <div className="w-full grid grid-cols-2 gap-3">
                        {/* Current Streak */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-panel p-3 relative overflow-hidden"
                        >
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest mb-1.5">{t('current_streak')}</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-brand-primary">{stats?.current_streak?.count || 0}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${stats?.current_streak?.type === 'win' ? 'text-emerald-400' :
                                        stats?.current_streak?.type === 'loss' ? 'text-red-400' : 'text-brand-primary/40'
                                        }`}>
                                        {stats?.current_streak?.type === 'win' ? t('wins') :
                                            stats?.current_streak?.type === 'loss' ? t('losses') : t('none')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Best Streak */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-panel p-3 relative overflow-hidden"
                        >
                            <div className="flex flex-col">
                                <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest mb-1.5">{t('best_streak')}</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-brand-primary">{stats?.best_streak?.wins || 0}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{t('wins')}</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Recent Games Section */}
                    {stats?.recent_games && stats.recent_games.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full space-y-2"
                        >
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-brand-primary/40 px-1">{t('recent_activity')}</h3>
                            <div className="space-y-2">
                                {stats.recent_games.slice(0, 3).map((game: any, idx: number) => (
                                    <motion.div
                                        key={game.game_id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + idx * 0.05 }}
                                        className="glass-panel p-2.5 flex items-center justify-between hover:bg-brand-primary/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            {/* Result Indicator */}
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${game.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                                                game.result === 'loss' ? 'bg-red-500/20 text-red-400' :
                                                    'bg-amber-500/20 text-amber-400'
                                                }`}>
                                                {game.result === 'win' ? 'W' : game.result === 'loss' ? 'L' : 'D'}
                                            </div>

                                            {/* Game Info */}
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-brand-primary/90 leading-none mb-0.5">
                                                    {t('vs')} {game.opponent.name}
                                                </span>
                                                <span className="text-[9px] font-medium text-brand-primary/40">
                                                    {game.opponent.elo} {t('elo')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ELO Change & Share */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[11px] font-black ${game.elo_change > 0 ? 'text-emerald-400' :
                                                    game.elo_change < 0 ? 'text-red-400' : 'text-brand-primary/40'
                                                    }`}>
                                                    {game.elo_change > 0 ? '+' : ''}{game.elo_change}
                                                </span>
                                                <span className="text-[8px] font-medium text-brand-primary/30 uppercase tracking-wider">{t('elo')}</span>
                                            </div>
                                            <button
                                                onClick={() => handleShareResult(game)}
                                                className="w-8 h-8 rounded-lg bg-brand-primary/5 flex items-center justify-center hover:bg-brand-primary/10 hover:text-brand-primary transition-all text-brand-primary/20"
                                            >
                                                <FaShareAlt size={10} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Marketing Banners */}
                <MarketingBanners />

                {/* Referral Protocol */}
                {stats?.referral_code && <ReferralSection referralCode={stats.referral_code} />}

                {/* Daily Tasks Widget */}
                <div className="w-full">
                    <DailyTasks />
                </div>

                {/* News Section */}
                <NewsSection />

                {/* Global Leaderboard */}
                <Leaderboard />

                {/* Primary Action Button */}
                <div className="w-full grid grid-cols-1 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowGameSection(true)}
                        className="w-full h-28 action-button relative overflow-hidden flex flex-col items-center justify-center group shadow-premium"
                        disabled={isCreating}
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-brand-void/20 via-transparent to-brand-primary/5 opacity-50" />
                        <div className="relative z-10 flex flex-col items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-brand-void/5 flex items-center justify-center border border-black/10 group-hover:scale-110 group-hover:bg-brand-void/10 transition-all duration-300">
                                <FaChessPawn size={20} className="text-brand-void/70" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-black tracking-[0.2em]">{t('execute_matchmaking')}</span>
                                <span className="text-[8px] font-bold opacity-30 tracking-[0.4em] mt-0.5 uppercase">{t('protocol_beta')}</span>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Secondary Tactical Actions */}
                <div className="w-full grid grid-cols-2 gap-4">
                    <motion.button
                        whileHover={{ y: -2, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('computer')}
                        className="glass-button w-full py-5 flex flex-col items-center justify-center gap-2.5 group border-brand-primary/5 hover:border-brand-primary/20 transition-all"
                        disabled={isCreating}
                    >
                        <div className="p-2 rounded-lg bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors">
                            <FaRobot className="text-lg text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest">{t('ai_training')}</span>
                    </motion.button>

                    <Link href="/academy" className="w-full">
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel w-full py-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer group border-brand-primary/5 hover:border-brand-primary/20 transition-all shadow-none"
                        >
                            <div className="p-2 rounded-lg bg-brand-primary/5 group-hover:bg-brand-primary/10 transition-colors">
                                <FaGraduationCap className="text-lg text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest">{t('academy')}</span>
                        </motion.div>
                    </Link>
                </div>

                {/* System Control Panel */}
                <div className="w-full pt-3 border-t border-brand-primary/5">
                    <Link href={`/${locale}/settings`} className="flex items-center justify-between p-3 rounded-2xl bg-brand-surface/50 border border-brand-primary/5 hover:bg-brand-primary/5 hover:border-brand-primary/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-brand-primary/5 group-hover:bg-brand-primary/10 group-hover:rotate-45 transition-all duration-500">
                                <FaCog className="text-sm text-brand-primary/40 group-hover:text-brand-primary transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary/30 group-hover:text-brand-primary/60 transition-colors">{t('configuration')}</span>
                                <span className="text-[7px] font-bold text-brand-primary/10 uppercase tracking-tighter">{t('system_parameters')}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            <span className="text-[8px] font-black text-brand-primary/10 group-hover:text-brand-primary/30 transition-colors">{t('active')}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
                        </div>
                    </Link>
                </div>

                {/* Footer Decor */}
                <footer className="flex flex-col items-center py-6 select-none pointer-events-none opacity-10 w-full">
                    <div className="flex items-center gap-4 w-full px-8">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent to-brand-primary/20" />
                        <span className="text-[8px] font-black tracking-[1.5em] uppercase text-brand-primary/40 shrink-0">ANTIGRAVITY</span>
                        <div className="h-px flex-1 bg-linear-to-l from-transparent to-brand-primary/20" />
                    </div>
                </footer>
            </div>

            {/* Game Section Overlay */}
            <AnimatePresence>
                {showGameSection && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-void/90 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-sm glass-panel overflow-hidden flex flex-col shadow-2xl border-brand-primary/20"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-brand-primary/10">
                                <div className="flex flex-col">
                                    <h2 className="text-2xl font-black text-brand-primary italic tracking-tighter uppercase leading-none mb-1">Game Section</h2>
                                    <span className="text-[10px] font-bold text-brand-primary/30 uppercase tracking-[0.3em]">Dashboard & Settings</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowGameSection(false)}
                                    className="w-10 h-10 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary/40 hover:text-brand-primary transition-colors"
                                >
                                    <FaTimes />
                                </motion.button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 max-h-[70vh]">
                                {/* Mini Dashboard */}
                                <section className="space-y-4">
                                    <h3 className="text-[9px] font-black uppercase text-brand-primary/20 tracking-[0.5em] ml-1">Live Dashboard</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/5 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest mb-1">{t('rating')}</span>
                                            <span className="text-xl font-black text-brand-primary leading-none">{stats?.elo || 1000}</span>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/5 flex flex-col items-center">
                                            <span className="text-[8px] font-bold text-brand-primary/30 uppercase tracking-widest mb-1">{t('win_rate')}</span>
                                            <span className="text-xl font-black text-brand-primary leading-none">{stats?.win_rate?.toFixed(1) || 0}%</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Settings Quick Access */}
                                <section className="space-y-4">
                                    <h3 className="text-[9px] font-black uppercase text-brand-primary/20 tracking-[0.5em] ml-1">Neural Parameters</h3>
                                    <div className="space-y-3">
                                        {/* Theme Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-void flex items-center justify-center text-brand-primary/40">
                                                    {theme === 'dark' ? <FaMoon size={14} /> : <FaSun size={14} />}
                                                </div>
                                                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">{tSettings('luminance_mode')}</span>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <button
                                                    onClick={toggleTheme}
                                                    className={`w-10 h-5 rounded-full p-1 transition-all ${theme === 'dark' ? 'bg-brand-primary' : theme === 'light' ? 'bg-brand-primary/40' : 'bg-brand-primary'}`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full transition-all ${theme === 'dark' ? 'ml-auto bg-brand-void' : theme === 'light' ? 'bg-brand-void' : 'mx-auto bg-brand-void'}`} />
                                                </button>
                                                <span className="text-[7px] font-bold text-brand-primary/40 uppercase">
                                                    {theme === 'dark' ? tSettings('deep_void') : theme === 'light' ? tSettings('solar_flare') : tSettings('nebula_protocol')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Audio Toggle */}
                                        <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-void flex items-center justify-center text-brand-primary/40">
                                                    {soundEnabled ? <FaVolumeUp size={14} /> : <FaVolumeMute size={14} />}
                                                </div>
                                                <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">{tSettings('audio_protocol')}</span>
                                            </div>
                                            <button
                                                onClick={() => setSoundEnabled(!soundEnabled)}
                                                className={`w-10 h-5 rounded-full p-1 transition-all ${soundEnabled ? 'bg-brand-primary' : 'bg-brand-primary/10'}`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${soundEnabled ? 'ml-auto bg-brand-void' : 'bg-brand-primary/40'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 bg-brand-primary/5 space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setShowGameSection(false); createGame('online'); }}
                                    className="w-full py-4 bg-brand-primary text-brand-void font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg flex items-center justify-center gap-2"
                                    disabled={isCreating}
                                >
                                    <FaChessPawn />
                                    <span>Matchmaking Online</span>
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => { setShowGameSection(false); createGame('computer'); }}
                                    className="w-full py-4 bg-brand-void border border-brand-primary/20 text-brand-primary font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2"
                                    disabled={isCreating}
                                >
                                    <FaRobot />
                                    <span>Combat AI</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </LayoutWrapper >
    );
}
