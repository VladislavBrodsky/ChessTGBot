'use client';

import { ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import ReferralNotification from './ReferralNotification';
import CustomAlertModal from './CustomAlertModal';
import TaskSuccessModal from './TaskSuccessModal';

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

    const inner = (
        // reducedMotion="user" makes every framer-motion animation respect the
        // OS "reduce motion" setting — disabling the app-wide infinite pulses,
        // pings and drifts for users who opt in (often low-end devices), cutting
        // continuous compositing work without changing the default experience.
        <MotionConfig reducedMotion="user">
            <Suspense fallback={null}>
                <ReferralNotification />
            </Suspense>
            <CustomAlertModal />
            <TaskSuccessModal />
            {children}
        </MotionConfig>
    );

    if (needsTonConnect) {
        return <TonConnectProvider>{inner}</TonConnectProvider>;
    }

    return inner;
}
