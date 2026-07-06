'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

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
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [stats, setStats] = useState<any>(null);
    const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);
    const [balanceError, setBalanceError] = useState<boolean>(false);
    const [statsError, setStatsError] = useState<boolean>(false);

    const syncBalance = useCallback(async () => {
        setLoadingBalance(true);
        try {
            const res = await apiFetch("/api/v1/wallet/balance");
            if (res.ok) {
                const data = await res.json();
                setWalletBalance(data.balance);
                setWalletAddress(data.wallet_address || "");
                setBalanceError(false);
                return data;
            }
            setBalanceError(true);
        } catch (err) {
            console.error("Failed to sync wallet balance", err);
            setBalanceError(true);
        } finally {
            // Always resolve the loading state — leaving it stuck on true made
            // consumers show skeletons forever whenever the API was unreachable.
            setLoadingBalance(false);
        }
        return null;
    }, []);

    const syncStats = useCallback(async () => {
        setLoadingStats(true);
        try {
            const res = await apiFetch("/api/v1/users/sync", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setStatsError(false);
                return data;
            }
            setStatsError(true);
        } catch (err) {
            console.error("Failed to fetch Stats", err);
            setStatsError(true);
        } finally {
            setLoadingStats(false);
        }
        return null;
    }, []);

    useEffect(() => {
        // Load initial data on mount
        syncBalance();
        syncStats();
    }, [syncBalance, syncStats]);

    return (
        <UserContext.Provider value={{
            walletBalance,
            walletAddress,
            stats,
            syncBalance,
            syncStats,
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
