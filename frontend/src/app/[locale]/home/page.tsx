'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot, FaStar, FaChessKnight, FaTimes, FaMoon, FaSun, FaVolumeUp, FaVolumeMute, FaShareAlt, FaCoins, FaSearch, FaExclamationTriangle, FaWallet } from "react-icons/fa";
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
import { getSocket } from "@/lib/socket";

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

    // Web3 Wager Autosearch Matchmaking
    const [selectedWager, setSelectedWager] = useState<number>(100); // default $1.00 (in cents)
    const [customWagerInput, setCustomWagerInput] = useState<string>("1.00");
    const [isCustomWager, setIsCustomWager] = useState<boolean>(false);
    const [matchmakingState, setMatchmakingState] = useState<'idle' | 'searching'>('idle');
    const [searchTimer, setSearchTimer] = useState<number>(0);
    const [matchmakingError, setMatchmakingError] = useState<string>("");
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [showReferralPopup, setShowReferralPopup] = useState<boolean>(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (Math.random() > 0.3) {
                setShowReferralPopup(true);
                setTimeout(() => setShowReferralPopup(false), 5000);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

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
                apiFetch(`/api/v1/users/sync`, {
                    method: "POST"
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

    // Sync balance on opening Game modal
    const syncBalance = async () => {
        try {
            const res = await apiFetch("/api/v1/wallet/balance");
            if (res.ok) {
                const data = await res.json();
                setWalletBalance(data.balance);
            }
        } catch (err) {
            console.error("Failed to sync wallet balance", err);
        }
    };

    useEffect(() => {
        if (showGameSection) {
            syncBalance();
        }
    }, [showGameSection]);

    // Matchmaking Timer
    useEffect(() => {
        let interval: any;
        if (matchmakingState === 'searching') {
            interval = setInterval(() => {
                setSearchTimer(prev => prev + 1);
            }, 1000);
        } else {
            setSearchTimer(0);
        }
        return () => clearInterval(interval);
    }, [matchmakingState]);

    // Socket.IO Listeners for Matchmaking Online
    useEffect(() => {
        const socket = getSocket();

        const onMatchFound = (data: any) => {
            console.log("Match matched!", data);
            setMatchmakingState('idle');
            setShowGameSection(false);
            window.location.href = `/${locale}/game?id=${data.game_id}`;
        };

        const onMatchmakingError = (data: any) => {
            console.error("Matchmaking error:", data.message);
            setMatchmakingError(data.message);
            setMatchmakingState('idle');
        };

        socket.on('match_found', onMatchFound);
        socket.on('matchmaking_error', onMatchmakingError);

        return () => {
            socket.off('match_found', onMatchFound);
            socket.off('matchmaking_error', onMatchmakingError);
        };
    }, [locale]);

    const startMatchmaking = () => {
        setMatchmakingError("");
        const socket = getSocket();
        const wagerInCents = isCustomWager
            ? Math.round(parseFloat(customWagerInput) * 100)
            : selectedWager;

        if (isNaN(wagerInCents) || wagerInCents < 0) {
            setMatchmakingError("Please specify a valid wager amount.");
            return;
        }

        if (wagerInCents > walletBalance) {
            setMatchmakingError("Insufficient balance in your Cyber-Wallet.");
            return;
        }

        setMatchmakingState('searching');
        socket.emit('join_matchmaking', { bid_amount: wagerInCents });
    };

    const cancelMatchmaking = () => {
        const socket = getSocket();
        socket.emit('leave_matchmaking', {});
        setMatchmakingState('idle');
    };

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
            const res = await apiFetch(`/api/v1/game/create?type=${type}`, {
                method: "POST"
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
                            className="w-full max-w-sm glass-panel overflow-hidden flex flex-col shadow-2xl border-brand-primary/20 bg-brand-surface/95"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-brand-primary/10 bg-brand-void/30">
                                <div className="flex flex-col">
                                    <h2 className="text-xl font-black text-brand-primary italic tracking-tighter uppercase leading-none mb-1">
                                        {matchmakingState === 'searching' ? 'Cyber Search Active' : 'Play Online'}
                                    </h2>
                                    <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-[0.3em]">
                                        {matchmakingState === 'searching' ? 'Locating Neural Host' : 'Matchmaking Protocol'}
                                    </span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        if (matchmakingState === 'searching') {
                                            cancelMatchmaking();
                                        }
                                        setShowGameSection(false);
                                    }}
                                    className="w-8 h-8 rounded-full bg-brand-primary/5 flex items-center justify-center text-brand-primary/40 hover:text-brand-primary transition-colors"
                                >
                                    <FaTimes className="text-xs" />
                                </motion.button>
                            </div>

                            {/* 1. ACTIVE SEARCH RADAR SECTION */}
                            {matchmakingState === 'searching' ? (
                                <div className="p-6 flex flex-col items-center justify-center space-y-6 text-center">
                                    {/* Sweeping Sonar Radar Widget */}
                                    <div className="relative w-40 h-40 flex items-center justify-center rounded-full border border-brand-primary/10 overflow-hidden bg-brand-void">
                                        {/* Radial sweeping line overlay */}
                                        <div className="absolute inset-0 bg-conic-radar animate-spin pointer-events-none" />
                                        
                                        {/* Concentric expanding circles */}
                                        <div className="absolute w-32 h-32 rounded-full border border-brand-primary/10 animate-ping opacity-60" />
                                        <div className="absolute w-24 h-24 rounded-full border border-brand-primary/5" />
                                        <div className="absolute w-12 h-12 rounded-full border border-brand-primary/20 animate-pulse bg-brand-primary/5" />

                                        {/* Centered user token */}
                                        <div className="z-10 w-12 h-12 rounded-full bg-brand-surface border-2 border-brand-primary flex items-center justify-center">
                                            <FaChessKnight className="text-lg text-brand-primary animate-bounce" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-1">
                                        <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest leading-none mb-1">Grid Queue Active</span>
                                        <span className="text-xs font-black text-brand-primary tracking-wide uppercase">Searching for Opponent...</span>
                                        <span className="text-2xl font-black text-brand-primary/80 italic tracking-tighter">
                                            {Math.floor(searchTimer / 60)}:{(searchTimer % 60).toString().padStart(2, '0')}
                                        </span>
                                    </div>

                                    <div className="w-full p-3 rounded-xl border border-brand-primary/15 bg-brand-primary/5 text-center">
                                        <span className="text-[9px] font-bold text-brand-primary/40 uppercase tracking-widest block mb-0.5">Wager Tier</span>
                                        <span className="text-sm font-black text-emerald-400">
                                            ${( (isCustomWager ? parseFloat(customWagerInput) * 100 : selectedWager) / 100 ).toFixed(2)} USDT
                                        </span>
                                        <span className="text-[8px] font-medium text-brand-primary/30 block mt-1 uppercase">Draw is fully refunded. 3% rake on wins.</span>
                                    </div>

                                    <button
                                        onClick={cancelMatchmaking}
                                        className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest transition-all"
                                    >
                                        Disconnect Search
                                    </button>
                                </div>
                            ) : (
                                /* 2. IDLE WAGER CONFIG SECTION */
                                <div className="flex-1 overflow-y-auto p-5 space-y-6 max-h-[70vh]">
                                    
                                    {/* Balance hud */}
                                    <div className="flex justify-between items-center p-3 rounded-xl border border-brand-primary/10 bg-brand-void/30">
                                        <div className="flex items-center space-x-2">
                                            <FaWallet className="text-xs text-brand-primary/60" />
                                            <span className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-wider">Cyber-Wallet Balance</span>
                                        </div>
                                        <span className="text-sm font-black text-brand-primary">
                                            ${(walletBalance / 100).toFixed(2)}
                                        </span>
                                    </div>

                                    {/* Bid Preset selector */}
                                    <div className="space-y-2.5">
                                        <div className="flex justify-between items-center px-0.5">
                                            <span className="text-[9px] font-black uppercase text-brand-primary/30 tracking-widest">Select Bid Wager</span>
                                            <span className="text-[8px] font-bold text-emerald-400/80 uppercase">5% deposit / 3% prize rake</span>
                                        </div>

                                        <div className="grid grid-cols-4 gap-1.5">
                                            {[
                                                { label: "$1", val: 100 },
                                                { label: "$5", val: 500 },
                                                { label: "$10", val: 1000 },
                                                { label: "$50", val: 5000 },
                                                { label: "$100", val: 10000 },
                                                { label: "$500", val: 50000 },
                                                { label: "$1000", val: 100000 }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.val}
                                                    onClick={() => {
                                                        setSelectedWager(opt.val);
                                                        setIsCustomWager(false);
                                                    }}
                                                    className={`py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                                        (!isCustomWager && selectedWager === opt.val)
                                                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-inner-glow'
                                                            : 'border-brand-primary/10 bg-brand-surface/40 hover:bg-brand-primary/5 text-brand-primary/60'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setIsCustomWager(true)}
                                                className={`py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                                                    isCustomWager
                                                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-inner-glow'
                                                        : 'border-brand-primary/10 bg-brand-surface/40 hover:bg-brand-primary/5 text-brand-primary/60'
                                                }`}
                                            >
                                                Other
                                            </button>
                                        </div>

                                        {/* Custom input */}
                                        {isCustomWager && (
                                            <div className="flex flex-col space-y-1 pt-1.5">
                                                <label className="text-[8px] font-black text-brand-primary/40 uppercase tracking-widest">Custom Wager (USD)</label>
                                                <input
                                                    type="number"
                                                    value={customWagerInput}
                                                    onChange={(e) => setCustomWagerInput(e.target.value)}
                                                    className="cyber-input w-full p-2 rounded-lg border border-brand-primary/20 bg-brand-void/50 text-brand-primary text-xs font-bold focus:outline-none"
                                                    placeholder="Enter bid amount..."
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Real-time wagers verification warning */}
                                    {(() => {
                                        const chosenWager = isCustomWager 
                                            ? Math.round(parseFloat(customWagerInput) * 100) 
                                            : selectedWager;
                                        
                                        const hasSufficient = walletBalance >= chosenWager;

                                        return (
                                            <div className="space-y-3">
                                                {chosenWager > 0 && (
                                                    <div className={`p-3 rounded-xl border flex flex-col space-y-1 text-[10px] font-bold uppercase tracking-wider ${
                                                        hasSufficient ? 'border-brand-primary/20 bg-brand-primary/5 text-brand-primary' : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
                                                    }`}>
                                                        <div className="flex justify-between">
                                                            <span>Active Wager:</span>
                                                            <span>${(chosenWager / 100).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between border-t border-brand-primary/10 pt-1 mt-1 font-black">
                                                            {hasSufficient ? (
                                                                <span className="text-emerald-400">✓ BALANCE VERIFIED & SECURE</span>
                                                            ) : (
                                                                <span className="text-rose-400 animate-pulse">🚨 INSUFFICIENT PLATFORM FUNDS</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {matchmakingError && (
                                                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                                                        {matchmakingError}
                                                    </div>
                                                )}

                                                {/* Action wagers triggers */}
                                                {hasSufficient ? (
                                                    <button
                                                        onClick={startMatchmaking}
                                                        className="w-full py-3 bg-brand-primary text-brand-void font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg flex items-center justify-center gap-2 hover:bg-brand-primary-hover transition-all"
                                                    >
                                                        <FaSearch />
                                                        <span>Search Wager Opponent</span>
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col space-y-2">
                                                        <button
                                                            disabled
                                                            className="w-full py-3 bg-brand-primary/20 text-brand-primary/20 font-black text-xs uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                                                        >
                                                            <FaSearch />
                                                            <span>Search Blocked</span>
                                                        </button>
                                                        <Link href={`/${locale}/wallet`} className="w-full">
                                                            <button className="w-full py-2.5 bg-brand-surface border border-brand-primary/20 text-brand-primary font-black text-xs uppercase tracking-widest rounded-xl hover:bg-brand-primary/5 transition-all text-center">
                                                                Top Up Wallet
                                                            </button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    <div className="h-px w-full bg-brand-primary/10 my-4" />

                                    {/* Alternate Protocols: Friendly Invite & Computer AI */}
                                    <div className="space-y-2.5">
                                        <span className="text-[9px] font-black uppercase text-brand-primary/30 tracking-widest px-0.5">Alternative Protocols</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => { setShowGameSection(false); createGame('online'); }}
                                                className="py-2.5 rounded-xl border border-brand-primary/10 bg-brand-surface/40 hover:bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5"
                                            >
                                                <FaShareAlt className="text-xs text-brand-primary/60" />
                                                <span>Invite Friend</span>
                                            </button>
                                            <button
                                                onClick={() => { setShowGameSection(false); createGame('computer'); }}
                                                className="py-2.5 rounded-xl border border-brand-primary/10 bg-brand-surface/40 hover:bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-wider flex flex-col items-center justify-center space-y-1.5"
                                            >
                                                <FaRobot className="text-xs text-brand-primary/60" />
                                                <span>Battle AI</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Holographic Referral Gold-Dust Popup */}
            <AnimatePresence>
                {showReferralPopup && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="fixed bottom-24 left-4 right-4 z-50 pointer-events-none"
                    >
                        <div className="w-full max-w-sm mx-auto p-4 rounded-2xl border border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700]/10 via-[#FFD700]/5 to-transparent backdrop-blur-md shadow-[0_0_40px_rgba(255,215,0,0.2)] flex items-center gap-4 relative overflow-hidden">
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            
                            <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 flex items-center justify-center border border-[#FFD700]/50 relative z-10">
                                <FaCoins className="text-[#FFD700] text-xl animate-bounce" />
                                <div className="absolute inset-0 bg-[#FFD700] blur-xl opacity-20" />
                            </div>
                            
                            <div className="flex flex-col relative z-10">
                                <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.2em] mb-0.5">Referral Commission</span>
                                <span className="text-sm font-black text-white italic tracking-wide">+$2.45 USDT</span>
                                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">From: Player "Grandmaster"</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </LayoutWrapper >
    );
}
