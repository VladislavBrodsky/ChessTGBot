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
                    dark: "#0B001F", // Deep space violet
                    purple: "#7B2CBF", // Neon Purple
                    cyan: "#00F0FF", // Neon Cyan
                    glow: "rgba(123, 44, 191, 0.5)",
                },
                glass: {
                    start: "rgba(255, 255, 255, 0.05)",
                    end: "rgba(255, 255, 255, 0.0)",
                    border: "rgba(255, 255, 255, 0.1)",
                }
            },
            backgroundImage: {
                "antigravity-gradient": "radial-gradient(circle at center, #1a0b2e 0%, #000000 100%)",
            },
            boxShadow: {
                "neon": "0 0 10px #7B2CBF, 0 0 20px #7B2CBF",
                "neon-cyan": "0 0 10px #00F0FF, 0 0 20px #00F0FF",
            }
        },
    },
    plugins: [],
};
export default config;
