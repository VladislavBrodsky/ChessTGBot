'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
// apiFetch removed since we useSWRFetch
import { useSWRFetch } from '@/hooks/useSWRFetch';
import { usePathname } from 'next/navigation';
import { getInitDataNow, waitForInitData } from '@/lib/telegramAuth';

interface UserContextType {
    walletBalance: number;
    walletAddress: string;
    gramRewardsNano: string | null;
    gramLeaderboardVisible: boolean | null;
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
    gramRewardsNano: null,
    gramLeaderboardVisible: null,
    stats: null,
    syncBalance: async () => null,
    syncStats: async () => null,
    loadingBalance: true,
    loadingStats: true,
    balanceError: false,
    statsError: false,
});

const BALANCE_SWR_OPTIONS = {
    revalidateOnFocus: true,
    focusThrottleInterval: 30_000,
    refreshInterval: 60_000,
    refreshWhenHidden: false,
    dedupingInterval: 30_000,
};

const STATS_SWR_KEY: any[] = ['/api/v1/users/sync', {}];
const STATS_SWR_OPTIONS = {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
};

export function UserProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [authenticated, setAuthenticated] = useState(false);
    useEffect(() => {
        let cancelled = false;
        const current = Boolean(getInitDataNow());
        setAuthenticated(current);
        if (!current) {
            // The Telegram SDK may arrive after the first render. Reuse the same
            // readiness gate as apiFetch so SWR does not stay disabled forever.
            void waitForInitData().then(credential => {
                if (!cancelled) setAuthenticated(Boolean(credential));
            });
        }
        return () => { cancelled = true; };
    }, [pathname]);
    const { data: balanceData, error: balanceSWR_Error, isLoading: fetchingBalance, mutate: syncBalance } = useSWRFetch(
        authenticated ? '/api/v1/wallet/balance' : null,
        BALANCE_SWR_OPTIONS,
    );

    const { data: statsData, error: statsSWR_Error, isLoading: fetchingStats, mutate: syncStats } = useSWRFetch(
        authenticated ? STATS_SWR_KEY : null,
        STATS_SWR_OPTIONS,
    );

    const loadingBalance = !authenticated || (fetchingBalance && !balanceData);
    const loadingStats = !authenticated || (fetchingStats && !statsData);
    const walletBalance = balanceData?.balance || 0;
    const walletAddress = balanceData?.wallet_address || "";
    const gramRewardsNano = typeof balanceData?.gram_rewards_nano === "string" ? balanceData.gram_rewards_nano : null;
    const gramLeaderboardVisible = typeof balanceData?.gram_leaderboard_visible === "boolean" ? balanceData.gram_leaderboard_visible : null;
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
            gramRewardsNano,
            gramLeaderboardVisible,
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
            gramRewardsNano,
            gramLeaderboardVisible,
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
