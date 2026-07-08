'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';

/**
 * Wraps children in the TON Connect UI provider.
 *
 * Kept in its own module so it can be lazy-loaded (next/dynamic) and mounted
 * ONLY on routes that actually use a wallet (game / wallet / membership).
 * Mounting it globally made every page — including Home, where no wallet UI
 * exists — eagerly download the TON SDK chunks, wallets-v2.json, and ~35 wallet
 * icon PNGs from config.ton.org on first load. See Providers.tsx.
 */
export default function TonConnectProvider({ children }: { children: ReactNode }) {
    const [manifestUrl, setManifestUrl] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setManifestUrl(`${window.location.origin}/tonconnect-manifest.json`);
        }
    }, []);

    // Until the manifest URL resolves client-side, render children without the
    // provider (no wallet UI can mount before hydration anyway).
    if (!manifestUrl) {
        return <>{children}</>;
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
