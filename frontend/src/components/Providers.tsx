'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState, Suspense } from 'react';
import ReferralNotification from './ReferralNotification';
import CustomAlertModal from './CustomAlertModal';
import TaskSuccessModal from './TaskSuccessModal';

export default function Providers({ children }: { children: ReactNode }) {
    const [manifestUrl, setManifestUrl] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setManifestUrl(`${window.location.origin}/tonconnect-manifest.json`);
        }
    }, []);

    // Do not mount TonConnectUIProvider until the URL is resolved client-side
    if (!manifestUrl) {
        return (
            <>
                <Suspense fallback={null}>
                    <ReferralNotification />
                </Suspense>
                <CustomAlertModal />
                <TaskSuccessModal />
                {children}
            </>
        );
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            <Suspense fallback={null}>
                <ReferralNotification />
            </Suspense>
            <CustomAlertModal />
            <TaskSuccessModal />
            {children}
        </TonConnectUIProvider>
    );
}
