'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/logger';

/**
 * Route-level error boundary for the whole locale subtree. Next.js renders this
 * (instead of the bare "Application error" page) whenever a client render throws
 * — e.g. the TonConnect provider crash. It reports the error to the backend
 * (which alerts admins) and offers the user a one-tap recovery.
 */
export default function LocaleError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // A ChunkLoadError means this client is running HTML from a build whose
        // hashed chunks were replaced by a redeploy (each deploy swaps the whole
        // container, old /_next/static is gone). Reloading fetches the new HTML
        // and fixes it — do that automatically instead of stranding the user,
        // but at most once a minute so a genuinely broken build can't reload-loop.
        const isStaleChunk = /ChunkLoadError|Loading chunk .+ failed|error loading dynamically imported module|Importing a module script failed/i
            .test(`${error?.name ?? ''} ${error?.message ?? ''}`);
        if (isStaleChunk && typeof window !== 'undefined') {
            let lastReload = 0;
            try {
                lastReload = Number(sessionStorage.getItem('chunk-error-reload-at') || 0);
            } catch { /* storage unavailable — fall through to reporting */ }
            if (Date.now() - lastReload > 60_000) {
                try {
                    sessionStorage.setItem('chunk-error-reload-at', String(Date.now()));
                    window.location.reload();
                    return; // stale build, not a code bug — no alert
                } catch { /* storage unavailable — fall through to reporting */ }
            }
        }
        reportClientError(error, 'render');
    }, [error]);

    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-brand-void text-brand-primary px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-400 text-2xl">
                ⚠
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight mb-2">Something went wrong</h2>
            <p className="text-[11px] font-bold text-brand-primary opacity-40 uppercase tracking-widest max-w-[280px] mb-8">
                The app hit an unexpected error. Our team has been notified automatically.
            </p>
            <button
                onClick={reset}
                className="px-8 py-3 rounded-2xl bg-brand-primary text-brand-void text-[11px] font-black uppercase tracking-wider active:scale-95 transition-transform"
            >
                Try again
            </button>
        </div>
    );
}
