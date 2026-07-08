'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/logger';

/**
 * Installs global listeners for errors that React error boundaries cannot catch:
 * uncaught exceptions outside render (event handlers, timers) and unhandled
 * promise rejections. Renders nothing. Mounted once, high in the tree.
 */
export default function ClientErrorReporter() {
    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            reportClientError(event.error ?? event.message, 'window.onerror');
        };
        const onRejection = (event: PromiseRejectionEvent) => {
            reportClientError(event.reason, 'unhandledrejection');
        };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, []);

    return null;
}
