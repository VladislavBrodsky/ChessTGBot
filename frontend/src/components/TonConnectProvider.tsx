'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

/** Mounted inside lazy wallet dialogs, so route content never waits for the SDK.
 * The manifest is available on the first dialog render, before any consumer hook runs.
 */
export default function TonConnectProvider({ children }: { children: ReactNode }) {
    const manifestUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/tonconnect-manifest-v2.json`
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
