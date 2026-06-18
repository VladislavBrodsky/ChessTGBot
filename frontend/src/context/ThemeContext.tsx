'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Read the theme the inline <script> in layout.tsx already applied to the DOM.
 * This runs synchronously before the first render so useState never has to
 * change the value, eliminating the flash-of-unstyled-content.
 */
function getInitialTheme(): Theme {
    if (typeof document !== 'undefined') {
        const attr = document.documentElement.getAttribute('data-theme');
        if (attr === 'light' || attr === 'dark') return attr;
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    // No useEffect needed for the initial read — getInitialTheme handles it.
    // We still watch for system-preference changes after mount.

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        // Sync background and header color with Telegram WebApp
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            try {
                const tg = (window as any).Telegram.WebApp;
                const color = theme === 'light' ? '#F3F4F6' : '#000000';
                tg.setHeaderColor(color);
                tg.setBackgroundColor(color);
            } catch (err) {
                console.warn('Failed to sync Telegram WebApp theme colors', err);
            }
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
