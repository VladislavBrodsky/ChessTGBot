'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LayoutWrapper from "@/components/LayoutWrapper";
import Link from "next/link";
import { FaChessPawn, FaGraduationCap, FaCog, FaRobot } from "react-icons/fa";

export default function Home() {
    const [tgUser, setTgUser] = useState<any>(null);
    const [elo, setElo] = useState<number>(1000); // Default ELO

    useEffect(() => {
        // Init Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
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
                        setElo(data.elo);
                    })
                    .catch(err => console.error("Failed to fetch ELO", err));
            }
        } else {
            // Dev Mode Mock Fetch
            fetch(`/api/v1/users/12345`)
                .then(res => res.json())
                .then(data => {
                    setElo(data.elo);
                    setTgUser({ first_name: data.first_name, photo_url: null });
                })
                .catch(err => console.error("Failed to fetch ELO (Dev)", err));
        }
    }, []);

    const createGame = async () => {
        try {
            const res = await fetch("/api/v1/game/create", { method: "POST" });
            const data = await res.json();

            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(data.game_id, ["users", "groups", "channels"]);
            } else {
                window.location.href = `/game?id=${data.game_id}`;
            }
        } catch (e) {
            console.error("Failed to create game", e);
            alert("Error creating game. Is backend running?");
        }
    };

    return (
        <LayoutWrapper>
            <div className="flex flex-col items-center w-full max-w-md space-y-8">
                {/* Header / Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full glass-panel p-6 rounded-3xl flex flex-col items-center relative overflow-hidden"
                >
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-secondary to-transparent opacity-50" />

                    <div className="w-20 h-20 rounded-full bg-nebula-dark border-2 border-accent-primary p-1 mb-4 shadow-neon relative">
                        {/* Avatar Placeholder or TG Photo */}
                        {tgUser?.photo_url ? (
                            <img src={tgUser.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-2xl font-bold text-white">
                                {tgUser?.first_name?.[0] || "P"}
                            </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 border-2 border-nebula-dark rounded-full" />
                    </div>

                    <h2 className="text-xl font-bold mb-1">
                        {tgUser ? `${tgUser.first_name} ${tgUser.last_name || ''}` : "Player"}
                    </h2>
                    <div className="flex items-center space-x-2 text-accent-secondary font-mono backdrop-blur-sm bg-black/20 px-3 py-1 rounded-full border border-white/10">
                        <span className="text-yellow-400">★</span>
                        <span>{elo} ELO</span>
                    </div>
                </motion.div>

                {/* Main Actions */}
                <div className="w-full grid grid-cols-1 gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={createGame}
                        className="glass-button w-full py-5 rounded-2xl flex items-center justify-center space-x-4 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center group-hover:bg-accent-primary/40 transition-colors">
                            <FaChessPawn className="text-accent-secondary text-xl" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-bold tracking-wide">Play Online</span>
                            <span className="text-xs opacity-70">Challenge a friend</span>
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="glass-button w-full py-5 rounded-2xl flex items-center justify-center space-x-4 group grayscale opacity-70 hover:grayscale-0 hover:opacity-100"
                        onClick={() => alert("AI Opponent coming soon!")}
                    >
                        <div className="w-10 h-10 rounded-full bg-accent-secondary/20 flex items-center justify-center group-hover:bg-accent-secondary/40 transition-colors">
                            <FaRobot className="text-purple-400 text-xl" />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-lg font-bold tracking-wide">Play Computer</span>
                            <span className="text-xs opacity-70">Stockfish 16 (Coming Soon)</span>
                        </div>
                    </motion.button>
                </div>

                {/* Secondary Actions (Grid) */}
                <div className="w-full grid grid-cols-2 gap-4">
                    <Link href="/academy" className="w-full">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="glass-button w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-2 h-32"
                        >
                            <FaGraduationCap className="text-3xl text-pink-500 mb-1" />
                            <span className="font-medium">Academy</span>
                        </motion.button>
                    </Link>

                    <Link href="/settings" className="w-full">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="glass-button w-full py-4 rounded-2xl flex flex-col items-center justify-center gap-2 h-32"
                        >
                            <FaCog className="text-3xl text-gray-400 mb-1" />
                            <span className="font-medium">Settings</span>
                        </motion.button>
                    </Link>
                </div>

                <div className="text-xs opacity-50 mt-8 font-mono">
                    v1.0.0 • Antigravity
                </div>
            </div>
        </LayoutWrapper>
    );
}
