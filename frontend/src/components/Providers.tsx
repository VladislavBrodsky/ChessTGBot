'use client';

import { ReactNode, useEffect } from 'react';
import { SWRConfig } from 'swr';
import CustomAlertModal from './CustomAlertModal';
import TaskSuccessModal from './TaskSuccessModal';
import ClientErrorReporter from './ClientErrorReporter';
import TelemetryReporter from './TelemetryReporter';
import { ReducedMotionProvider } from '@/context/ReducedMotionContext';
import AuthGuard from './AuthGuard';

export default function Providers({ children }: { children: ReactNode }) {

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

    // Wallet dialogs own their provider. Loading the TON SDK must never block
    // the route shell or remount AuthGuard when moving between destinations.
    const pageContent = <AuthGuard>{children}</AuthGuard>;

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
