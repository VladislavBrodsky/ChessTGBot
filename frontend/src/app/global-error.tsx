'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/logger';

/**
 * Root error boundary. Catches errors thrown in the root layout itself (where
 * the locale error.tsx cannot reach). Must render its own <html>/<body>, and
 * uses inline styles since the app stylesheet may not have loaded. Last-resort
 * fallback — still reports to the backend so nothing crashes silently.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        reportClientError(error, 'global');
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    minHeight: '100dvh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#080412',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    padding: '0 24px',
                }}
            >
                <h2 style={{ fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                    Something went wrong
                </h2>
                <p style={{ fontSize: 12, opacity: 0.5, maxWidth: 300, margin: '0 0 28px' }}>
                    The app hit an unexpected error and has been notified.
                </p>
                <button
                    onClick={reset}
                    style={{
                        padding: '12px 32px',
                        borderRadius: 16,
                        border: 'none',
                        background: '#fff',
                        color: '#080412',
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
