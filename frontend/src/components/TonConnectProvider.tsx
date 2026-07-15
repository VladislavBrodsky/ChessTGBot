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
 * manifestUrl is PINNED to the Railway frontend URL — never derived from
 * window.location.origin. The manifest is fetched by the WALLET's
 * infrastructure (e.g. Telegram Wallet's backend), not by this WebView, so it
 * must live on a host that resolves everywhere. When the app moved to
 * web3chess.online, the apex's Namecheap DNS kept a URL-forwarding A record
 * (162.255.119.119, no HTTPS) that most public resolvers return — the app
 * loaded for users whose resolver had the Railway answer, but Telegram Wallet
 * couldn't fetch the origin-derived manifest and every connect died with
 * "App Manifest Error". The Railway domain has no such split-DNS failure mode.
 */
const MANIFEST_URL =
    process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL ||
    'https://chesstgbot-frontend-production.up.railway.app/tonconnect-manifest.json';

export default function TonConnectProvider({ children }: { children: ReactNode }) {
    // The URL is a synchronous constant: the provider must exist on the FIRST
    // render, because this component mounts fresh on /game navigation exactly
    // when a consumer (WalletConnect) calls useTonConnectUI(), which throws
    // "You should add <TonConnectUIProvider>" without it.
    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            {children}
        </TonConnectUIProvider>
    );
}
