'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [manifestUrl, setManifestUrl] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setManifestUrl(`${window.location.origin}/tonconnect-manifest.json`);
        }
    }, []);

    // Do not mount TonConnectUIProvider until the URL is resolved client-side
    if (!manifestUrl) {
        return <>{children}</>;
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
