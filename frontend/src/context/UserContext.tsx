'use client';

import React, { createContext, useContext, useCallback } from 'react';
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

export function UserProvider({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useCallback((): boolean => {
        if (typeof window === 'undefined') return false;
        const isTMA = !!(window as any).Telegram?.WebApp?.initData;
        const hasWebAuth = !!localStorage.getItem('telegram_web_auth');
        return isTMA || hasWebAuth;
    }, []);

    const { data: balanceData, error: balanceSWR_Error, isLoading: loadingBalance, mutate: syncBalance } = useSWRFetch(
        isAuthenticated() ? '/api/v1/wallet/balance' : null,
        {
            revalidateOnFocus: true,
            dedupingInterval: 5000, // 5 seconds
        }
    );

    const { data: statsData, error: statsSWR_Error, isLoading: loadingStats, mutate: syncStats } = useSWRFetch(
        isAuthenticated() ? ['/api/v1/users/sync', {}] : null,
        {
            revalidateOnFocus: true,
            dedupingInterval: 10000, // 10 seconds
        }
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

    return (
        <UserContext.Provider value={{
            walletBalance,
            walletAddress,
            stats,
            syncBalance: syncBalanceWrapper,
            syncStats: syncStatsWrapper,
            loadingBalance,
            loadingStats,
            balanceError,
            statsError,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
