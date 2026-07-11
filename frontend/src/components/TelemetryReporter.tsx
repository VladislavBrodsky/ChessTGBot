'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logTelemetryEvent, flushTelemetry } from '@/lib/telemetry';

export default function TelemetryReporter() {
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    // Session Start
    logTelemetryEvent('session_start');
    
    return () => {
      // Session End
      logTelemetryEvent('session_end');
      flushTelemetry();
    };
  }, []);

  useEffect(() => {
    if (pathname && pathname !== lastPathname.current) {
      logTelemetryEvent('page_visit', { path: pathname });
      lastPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
