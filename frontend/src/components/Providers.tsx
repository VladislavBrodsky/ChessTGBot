'use client';

import { ReactNode, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SWRConfig } from 'swr';
import CustomAlertModal from './CustomAlertModal';
import TaskSuccessModal from './TaskSuccessModal';
import ClientErrorReporter from './ClientErrorReporter';
import TelemetryReporter from './TelemetryReporter';
import { ReducedMotionProvider } from '@/context/ReducedMotionContext';

// Lazy-load the TON Connect provider so its JS chunk (the TON SDK) and its
// network cost (wallets-v2.json + ~35 wallet icon PNGs from config.ton.org) are
// only paid on routes that actually render wallet UI. ssr:false because the
// provider is client-only.
const TonConnectProvider = dynamic(() => import('./TonConnectProvider'), { ssr: false });

// Route segments that render a TON Connect consumer:
//  - /game      -> PlayLobby (WalletConnect, LobbyDepositDrawer)
//  - /wallet    -> DepositModal, WalletSelectorModal
//  - /membership-> DepositModal
const TON_ROUTE_PATTERN = /\/(game|wallet|membership)(\/|$)/;

export default function Providers({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const needsTonConnect = TON_ROUTE_PATTERN.test(pathname || '');

    // Low-end device detection: weak hardware and mobile Telegram hosts get the same
    // effect freezes as "reduce motion" (see :root.lite-fx in globals.css) without the
    // user having to find an OS accessibility setting.
    //
    // The decision is normally made by the pre-hydration script in [locale]/layout.tsx,
    // which runs before first paint so the expensive blurs never paint at all. This
    // effect is only a late fallback for the one case that script cannot see: a Telegram
    // launch with no platform on the URL hash, where the SDK finishes loading afterwards
    // and is the first thing to reveal that we are on a phone.
    useEffect(() => {
        try {
            const root = document.documentElement;
            if (root.classList.contains('lite-fx')) return;

            const nav = navigator as any;
            const lowCpu = (nav.hardwareConcurrency || 8) <= 4;
            const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
            const platform = (window as any).Telegram?.WebApp?.platform;
            const mobileHost = platform === 'ios' || platform === 'android';

            if (lowCpu || lowMem || mobileHost) {
                root.classList.add('lite-fx');
            }
        } catch { /* detection is best-effort */ }
    }, []);

    const pageContent = needsTonConnect ? (
        <TonConnectProvider>{children}</TonConnectProvider>
    ) : children;

    return (
        <SWRConfig value={{
            // Keep previously rendered data visible while the app checks for a
            // fresher value. Re-fetching on every Telegram foreground event
            // creates unnecessary flashes and request bursts in the WebView.
            dedupingInterval: 60_000,
            focusThrottleInterval: 60_000,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            keepPreviousData: true,
        }}>
        {/* This keeps OS-level reduced motion as the default and upgrades Framer
            Motion to "always" when the persisted in-app preference is enabled. */}
        <ReducedMotionProvider>
            <ClientErrorReporter />
            <TelemetryReporter />
            <CustomAlertModal />
            <TaskSuccessModal />
            {pageContent}
        </ReducedMotionProvider>
        </SWRConfig>
    );
}
