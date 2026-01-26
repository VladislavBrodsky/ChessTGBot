'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot, FaStar } from "react-icons/fa";

export default function Home() {
    const [tgUser, setTgUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);

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

            // Fetch User Stats
            if (tg.initDataUnsafe?.user?.id) {
                fetch(`/api/v1/users/${tg.initDataUnsafe.user.id}`)
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

    const createGame = async (type: 'online' | 'computer' = 'online') => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const res = await fetch(`/api/v1/game/create?type=${type}`, { method: "POST" });
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
                {/* Minimalist Brand Section */}
                <div className="flex flex-col items-center w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-white text-4xl md:text-5xl font-black italic tracking-tighter select-none mb-1 shadow-neon"
                    >
                        CHESS APP
                    </motion.div>
                    <div className="h-px w-16 bg-white/10 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/20">Neural Matrix Protocol</span>
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
                            <div className="w-12 h-12 rounded-2xl bg-brand-elevated border border-white/5 p-1 relative shadow-inner-glow">
                                {tgUser?.photo_url ? (
                                    <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-xl object-cover" />
                                ) : (
                                    <div className="w-full h-full rounded-xl bg-linear-to-br from-white/10 to-transparent flex items-center justify-center text-xl font-black text-white/30">
                                        {tgUser?.first_name?.[0] || "?"}
                                    </div>
                                )}
                                {stats?.is_premium && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[9px] text-black border-2 border-black">
                                        <FaStar />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-center">
                                <h2 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2 leading-none mb-1">
                                    {tgUser?.first_name || "Unknown"}
                                </h2>
                                <div className="flex items-center gap-2.5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">Rating</span>
                                        <span className="text-[11px] font-black text-white/90">{stats?.elo || 1000} ELO</span>
                                    </div>
                                    <div className="w-px h-5 bg-white/5" />
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none mb-0.5">Win Rate</span>
                                        <span className="text-[11px] font-black text-white/90">{stats?.win_rate?.toFixed(1) || 0}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center relative z-10">
                            <div className="px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 shadow-inner-glow">
                                <span className="text-[9px] font-black text-white/60 tracking-tighter uppercase whitespace-nowrap">LVL 0{Math.floor((stats?.elo || 1000) / 200)}</span>
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
                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Current Streak</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-white">{stats?.current_streak?.count || 0}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${stats?.current_streak?.type === 'win' ? 'text-emerald-400' :
                                        stats?.current_streak?.type === 'loss' ? 'text-red-400' : 'text-white/40'
                                        }`}>
                                        {stats?.current_streak?.type === 'win' ? 'WINS' :
                                            stats?.current_streak?.type === 'loss' ? 'LOSSES' : 'NONE'}
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
                                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Best Streak</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black text-white">{stats?.best_streak?.wins || 0}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">WINS</span>
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
                            <h3 className="text-[9px] font-black uppercase tracking-widest text-white/40 px-1">Recent Activity</h3>
                            <div className="space-y-2">
                                {stats.recent_games.slice(0, 3).map((game: any, idx: number) => (
                                    <motion.div
                                        key={game.game_id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.25 + idx * 0.05 }}
                                        className="glass-panel p-2.5 flex items-center justify-between hover:bg-white/5 transition-colors"
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
                                                <span className="text-[11px] font-bold text-white/90 leading-none mb-0.5">
                                                    vs {game.opponent.name}
                                                </span>
                                                <span className="text-[9px] font-medium text-white/40">
                                                    {game.opponent.elo} ELO
                                                </span>
                                            </div>
                                        </div>

                                        {/* ELO Change */}
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[11px] font-black ${game.elo_change > 0 ? 'text-emerald-400' :
                                                game.elo_change < 0 ? 'text-red-400' : 'text-white/40'
                                                }`}>
                                                {game.elo_change > 0 ? '+' : ''}{game.elo_change}
                                            </span>
                                            <span className="text-[8px] font-medium text-white/30 uppercase tracking-wider">ELO</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Primary Action Button */}
                <div className="w-full grid grid-cols-1 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.01, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => createGame('online')}
                        className="w-full h-28 action-button relative overflow-hidden flex flex-col items-center justify-center group shadow-premium"
                        disabled={isCreating}
                    >
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-white/5 opacity-50" />
                        <div className="relative z-10 flex flex-col items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center border border-black/10 group-hover:scale-110 group-hover:bg-black/10 transition-all duration-300">
                                <FaChessPawn size={20} className="text-black/70" />
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-black tracking-[0.2em]">EXECUTE MATCHMAKING</span>
                                <span className="text-[8px] font-bold opacity-30 tracking-[0.4em] mt-0.5 uppercase">Protocol Beta-7</span>
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
                        className="glass-button w-full py-5 flex flex-col items-center justify-center gap-2.5 group border-white/5 hover:border-white/20 transition-all"
                        disabled={isCreating}
                    >
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                            <FaRobot className="text-lg text-white/40 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest">AI Training</span>
                    </motion.button>

                    <Link href="/academy" className="w-full">
                        <motion.div
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="glass-panel w-full py-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer group border-white/5 hover:border-white/20 transition-all shadow-none"
                        >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                <FaGraduationCap className="text-lg text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest">Academy</span>
                        </motion.div>
                    </Link>
                </div>

                {/* System Control Panel */}
                <div className="w-full pt-3 border-t border-white/5">
                    <Link href="/settings" className="flex items-center justify-between p-3 rounded-2xl bg-brand-surface/50 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 group-hover:rotate-45 transition-all duration-500">
                                <FaCog className="text-sm text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">Configuration</span>
                                <span className="text-[7px] font-bold text-white/10 uppercase tracking-tighter">System Parameters v1.2</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            <span className="text-[8px] font-black text-white/10 group-hover:text-white/30 transition-colors">ACTIVE</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
                        </div>
                    </Link>
                </div>

                {/* Footer Decor */}
                <footer className="flex flex-col items-center py-6 select-none pointer-events-none opacity-10 w-full">
                    <div className="flex items-center gap-4 w-full px-8">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent to-white/20" />
                        <span className="text-[8px] font-black tracking-[1.5em] uppercase text-white/40 shrink-0">ANTIGRAVITY</span>
                        <div className="h-px flex-1 bg-linear-to-l from-transparent to-white/20" />
                    </div>
                </footer>
            </div>
        </LayoutWrapper>
    );
}
