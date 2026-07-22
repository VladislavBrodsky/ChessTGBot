'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
// apiFetch removed since we useSWRFetch
import { useSWRFetch } from '@/hooks/useSWRFetch';

interface UserContextType {
    walletBalance: number;
    walletAddress: string;
    stats: any;
    syncBalance: () => Promise<{ balance: number; wallet_address?: string } | null>;
    syncStats: () => Promise<any>;
    loadingBalance: boolean;
    loadingStats: boolean;
    /**
     * True when the last balance fetch failed. Consumers MUST NOT present
     * walletBalance as "$0.00" while this is set — a user with real funds on a
     * flaky connection would read it as "my money is gone". Show an
     * unavailable/retry state instead.
     */
    balanceError: boolean;
    statsError: boolean;
}

const UserContext = createContext<UserContextType>({
    walletBalance: 0,
    walletAddress: "",
    stats: null,
    syncBalance: async () => null,
    syncStats: async () => null,
    loadingBalance: true,
    loadingStats: true,
    balanceError: false,
    statsError: false,
});

const BALANCE_SWR_OPTIONS = {
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
};

const STATS_SWR_KEY: any[] = ['/api/v1/users/sync', {}];
const STATS_SWR_OPTIONS = {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;
        const isTMA = !!(window as any).Telegram?.WebApp?.initData;
        // Runs during render; localStorage can throw inside Telegram Web's cross-origin
        // (third-party) iframe when the browser blocks third-party storage.
        let hasWebAuth = false;
        try { hasWebAuth = !!localStorage.getItem('telegram_web_auth'); } catch { /* storage blocked */ }
        return isTMA || hasWebAuth;
    }, []);

    const authenticated = isAuthenticated();
    const { data: balanceData, error: balanceSWR_Error, isLoading: loadingBalance, mutate: syncBalance } = useSWRFetch(
        authenticated ? '/api/v1/wallet/balance' : null,
        BALANCE_SWR_OPTIONS,
    );

    const { data: statsData, error: statsSWR_Error, isLoading: loadingStats, mutate: syncStats } = useSWRFetch(
        authenticated ? STATS_SWR_KEY : null,
        STATS_SWR_OPTIONS,
    );

    const walletBalance = balanceData?.balance || 0;
    const walletAddress = balanceData?.wallet_address || "";
    const balanceError = !!balanceSWR_Error;

    const stats = statsData || null;
    const statsError = !!statsSWR_Error;

    // Optional: Keep the sync methods returning a promise for backward compatibility if needed,
    // though SWR's mutate returns a promise too.
    const syncBalanceWrapper = useCallback(async () => {
        const data = await syncBalance();
        return data || null;
    }, [syncBalance]);

    const syncStatsWrapper = useCallback(async () => {
        const data = await syncStats();
        return data || null;
    }, [syncStats]);

    const value = useMemo(() => ({
            walletBalance,
            walletAddress,
            stats,
            syncBalance: syncBalanceWrapper,
            syncStats: syncStatsWrapper,
            loadingBalance,
            loadingStats,
            balanceError,
            statsError,
        }), [
            walletBalance,
            walletAddress,
            stats,
            syncBalanceWrapper,
            syncStatsWrapper,
            loadingBalance,
            loadingStats,
            balanceError,
            statsError,
        ]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
