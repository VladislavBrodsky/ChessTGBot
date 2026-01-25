/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    void: "var(--color-brand-void)",
                    surface: "var(--color-brand-surface)",
                    elevated: "var(--color-brand-elevated)",
                    border: "var(--color-brand-border)",
                    "text-gray": "var(--color-brand-text-gray)",
                },
                gray: "#71767B",
                nebula: {
                    dark: "var(--bg-secondary)", // #0B001F or Light equivalent
                    purple: "var(--accent-primary)", // #7B2CBF
                    cyan: "var(--accent-secondary)", // #00F0FF
                    glow: "rgba(123, 44, 191, 0.5)",
                    void: "var(--bg-primary)", // #050014 or White
                },
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '2.5rem',
                'px': '1px',
            },
            backgroundImage: {
                "brand-gradient": "radial-gradient(circle at 50% 0%, #111111 0%, #000000 100%)",
                "glass-gradient": "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0) 100%)",
                "silver-gradient": "linear-gradient(180deg, #FFFFFF 0%, #A1A1A1 100%)",
            },
            boxShadow: {
                "neon": "0 0 15px rgba(255, 255, 255, 0.05), 0 0 30px rgba(255, 255, 255, 0.02)",
                "premium": "0 10px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
                "inner-glow": "inset 0 0 20px rgba(255, 255, 255, 0.02)",
            },
            animation: {
                "float": "float 6s ease-in-out infinite",
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-5px)" },
                }
            }
        },
    },
    plugins: [],
};
