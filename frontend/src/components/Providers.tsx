'use client';

import { ReactNode, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import ReferralNotification from './ReferralNotification';
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

    // Low-end device detection: weak hardware gets the same effect freezes as
    // "reduce motion" (see :root.lite-fx in globals.css) WITHOUT requiring the
    // user to find an OS accessibility setting. hardwareConcurrency <= 4 marks
    // older phones; deviceMemory (Chrome/Android only) catches low-RAM devices.
    useEffect(() => {
        try {
            const nav = navigator as any;
            const lowCpu = (nav.hardwareConcurrency || 8) <= 4;
            const lowMem = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
            if (lowCpu || lowMem) {
                document.documentElement.classList.add('lite-fx');
            }
        } catch { /* detection is best-effort */ }
    }, []);

    const inner = (
        // This keeps OS-level reduced motion as the default and upgrades Framer
        // Motion to "always" when the persisted in-app preference is enabled.
        <ReducedMotionProvider>
            <ClientErrorReporter />
            <TelemetryReporter />
            <Suspense fallback={null}>
                <ReferralNotification />
            </Suspense>
            <CustomAlertModal />
            <TaskSuccessModal />
            {children}
        </ReducedMotionProvider>
    );

    if (needsTonConnect) {
        return <TonConnectProvider>{inner}</TonConnectProvider>;
    }

    return inner;
}
