'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode, useEffect, useState } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
    const [manifestUrl, setManifestUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isProd = window.location.hostname === 'chesstgbot-production.up.railway.app';
            const url = isProd
                ? `${window.location.origin}/tonconnect-manifest.json`
                : 'https://raw.githubusercontent.com/VladislavBrodsky/ChessTGBot/main/frontend/public/tonconnect-manifest-dev.json?v=2';
            setManifestUrl(url);
        }
    }, []);

    if (!manifestUrl) {
        return <>{children}</>;
    }

    return (
        <TonConnectUIProvider manifestUrl={manifestUrl}>
            {children}
        </TonConnectUIProvider>
    );
}
