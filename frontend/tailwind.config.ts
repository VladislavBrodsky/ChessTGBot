import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                nebula: {
                    dark: "var(--bg-secondary)", // #0B001F or Light equivalent
                    purple: "var(--accent-primary)", // #7B2CBF
                    cyan: "var(--accent-secondary)", // #00F0FF
                    glow: "rgba(123, 44, 191, 0.5)",
                    void: "var(--bg-primary)", // #050014 or White
                },
                glass: {
                    start: "var(--glass-bg)",
                    end: "rgba(255, 255, 255, 0.02)",
                    border: "var(--glass-border)",
                    highlight: "rgba(255, 255, 255, 0.1)",
                }
            },
            backgroundImage: {
                "antigravity-gradient": "radial-gradient(circle at 50% 0%, #1a0b2e 0%, #050014 100%)",
                "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
            },
            boxShadow: {
                "neon": "0 0 15px rgba(123, 44, 191, 0.6), 0 0 30px rgba(123, 44, 191, 0.3)",
                "neon-cyan": "0 0 15px rgba(0, 240, 255, 0.6), 0 0 30px rgba(0, 240, 255, 0.3)",
                "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                }
            }
        },
    },
    plugins: [],
};
export default config;
