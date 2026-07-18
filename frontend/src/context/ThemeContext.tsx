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
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        
        // Fallback to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }
    }
    return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    // Apply theme changes to the document element and Telegram WebApp
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);

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

    // Listen for system preference changes
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        
        const handleChange = (e: MediaQueryListEvent) => {
            // Only update theme if the user hasn't explicitly set a preference in localStorage
            if (!localStorage.getItem('theme')) {
                setThemeState(e.matches ? 'light' : 'dark');
            }
        };

        // Modern browsers support addEventListener, fallback to addListener for older clients
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
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
