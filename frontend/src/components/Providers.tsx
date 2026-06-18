'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';
import ReferralNotification from './ReferralNotification';
import CustomAlertModal from './CustomAlertModal';

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
                <ReferralNotification />
                <CustomAlertModal />
                {children}
            </>
        );
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            <ReferralNotification />
            <CustomAlertModal />
            {children}
        </TonConnectUIProvider>
    );
}
