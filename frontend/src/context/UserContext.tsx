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
}

const UserContext = createContext<UserContextType>({
    walletBalance: 0,
    walletAddress: "",
    stats: null,
    syncBalance: async () => null,
    syncStats: async () => null,
    loadingBalance: true,
    loadingStats: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [walletBalance, setWalletBalance] = useState<number>(0);
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [stats, setStats] = useState<any>(null);
    const [loadingBalance, setLoadingBalance] = useState<boolean>(true);
    const [loadingStats, setLoadingStats] = useState<boolean>(true);

    const syncBalance = useCallback(async () => {
        try {
            const res = await apiFetch("/api/v1/wallet/balance");
            if (res.ok) {
                const data = await res.json();
                setWalletBalance(data.balance);
                setWalletAddress(data.wallet_address || "");
                setLoadingBalance(false);
                return data;
            }
        } catch (err) {
            console.error("Failed to sync wallet balance", err);
        }
        return null;
    }, []);

    const syncStats = useCallback(async () => {
        try {
            const res = await apiFetch("/api/v1/users/sync", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setLoadingStats(false);
                return data;
            }
        } catch (err) {
            console.error("Failed to fetch Stats", err);
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
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
