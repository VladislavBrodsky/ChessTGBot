'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { ReactNode } from 'react';

// Manifest URL must be absolute and publicly accessible
// For dev/testing, we can use a relative path if hosted on the same domain, or a public URL
// In production, this should be the real deployed URL
const MANIFEST_URL = 'https://chesstgbot-production.up.railway.app/tonconnect-manifest.json';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            {children}
        </TonConnectUIProvider>
    );
}
