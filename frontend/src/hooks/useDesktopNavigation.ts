'use client';

import { useEffect, useState } from 'react';
import { hasE2ETestIdentity } from '@/lib/e2eTestMode';
import { getStoredWebAuth } from '@/lib/sessionAuth';

/** Telegram always keeps its familiar bottom dock, including desktop Telegram. */
export function useDesktopNavigation() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      const browserAuth = !!getStoredWebAuth();
      const telegram = !!window.Telegram?.WebApp?.initData || window.self !== window.top;
      setDesktop(media.matches && !telegram && (browserAuth || hasE2ETestIdentity()));
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return desktop;
}
