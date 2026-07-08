'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

/**
 * Wraps children in the TON Connect UI provider.
 *
 * Kept in its own module so it can be lazy-loaded (next/dynamic) and mounted
 * ONLY on routes that actually use a wallet (game / wallet / membership).
 * Mounting it globally made every page — including Home, where no wallet UI
 * exists — eagerly download the TON SDK chunks, wallets-v2.json, and ~35 wallet
 * icon PNGs from config.ton.org on first load. See Providers.tsx.
 *
 * manifestUrl is computed SYNCHRONOUSLY at render. This component is imported
 * with `dynamic(..., { ssr: false })`, so it only ever renders on the client
 * where `window` exists — there is no server render to guard against. Resolving
 * the URL in a useEffect instead would leave the FIRST render without a
 * provider; because this component now mounts fresh when the user navigates to
 * /game, that first render is exactly when a consumer (WalletConnect) mounts and
 * calls useTonConnectUI(), which throws "You should add <TonConnectUIProvider>".
 */
export default function TonConnectProvider({ children }: { children: ReactNode }) {
    const manifestUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/tonconnect-manifest.json`
            : '';

    // Extremely unlikely (ssr:false ⇒ always client), but if window is somehow
    // unavailable, render children rather than crash — a wallet action would
    // simply no-op until a real render occurs.
    if (!manifestUrl) {
        return <>{children}</>;
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
