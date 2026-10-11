'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
    if (typeof window !== 'undefined') {
        // localStorage can throw a SecurityError inside Telegram Web's cross-origin
        // (third-party) iframe when the browser blocks third-party storage. This runs
        // during render, so an unguarded throw would crash the entire app.
        try {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') return saved;
        } catch { /* storage blocked — fall through to default */ }
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    // Apply browser tokens here. TelegramInit owns host capability checks and
    // colour sync, including the case where the SDK arrives after hydration.
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);

    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        try { localStorage.setItem('theme', newTheme); } catch { /* storage blocked in third-party iframe */ }
    };

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
