import { useCallback } from 'react';
import { sendTelemetryEvent } from '@/lib/api';

export function useTelemetry() {
  const trackEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    // Fire and forget so we don't block UI
    sendTelemetryEvent(eventType, eventData).catch(() => {});
  }, []);

  return { trackEvent };
}
