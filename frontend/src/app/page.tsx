'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
    const [tgUser, setTgUser] = useState<any>(null);

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
                window.location.href = `/game/${startParam}`;
            }

            // Theme Params Integration
            if (tg.themeParams) {
                const root = document.documentElement;
                if (tg.themeParams.bg_color) root.style.setProperty('--tg-bg', tg.themeParams.bg_color);
                if (tg.themeParams.text_color) root.style.setProperty('--tg-text', tg.themeParams.text_color);
                if (tg.themeParams.button_color) root.style.setProperty('--tg-button', tg.themeParams.button_color);
                if (tg.themeParams.button_text_color) root.style.setProperty('--tg-button-text', tg.themeParams.button_text_color);
            }
        }
    }, []);

    const createGame = async () => {
        try {
            // Direct call to backend
            const res = await fetch("http://localhost:8000/api/v1/game/create", {
                method: "POST"
            });
            const data = await res.json();

            // Use Telegram's switchInlineQuery to share
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.switchInlineQuery(data.game_id, ["users", "groups", "channels"]);
            } else {
                alert(`Dev Mode: Game created! ID: ${data.game_id}`);
                // Redirect to game page for testing (simulate joining)
                window.location.href = `/game/${data.game_id}`;
            }
        } catch (e) {
            console.error("Failed to create game", e);
            alert("Error creating game. Is backend running?");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30">
                <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-purple-600 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[250px] h-[250px] bg-cyan-500 rounded-full blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="glass-panel p-8 rounded-3xl w-full max-w-md text-center border-t border-white/10"
            >
                <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                    Antigravity Chess
                </h1>
                <p className="text-gray-400 mb-8 font-light">
                    Experience the void.
                </p>

                <div className="space-y-4">
                    <button
                        onClick={createGame}
                        className="w-full glass-button py-4 px-6 rounded-xl text-lg font-medium tracking-wide text-white hover:text-cyan-300"
                    >
                        Create Match
                    </button>

                    <button className="w-full glass-button py-4 px-6 rounded-xl text-lg font-medium tracking-wide text-gray-400 hover:text-white">
                        Leaderboard
                    </button>
                </div>

                {tgUser && (
                    <div className="mt-8 text-xs text-gray-600">
                        Logged in as {tgUser.first_name}
                    </div>
                )}
            </motion.div>
        </main>
    );
}
