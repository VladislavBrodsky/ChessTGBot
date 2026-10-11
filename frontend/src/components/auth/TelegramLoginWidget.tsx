'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface TelegramLoginWidgetProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  usePic?: boolean;
  onAuthCallback?: (data: any) => void;
  redirectUrl?: string;
  className?: string;
}

export default function TelegramLoginWidget({
  botName,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  usePic = true,
  onAuthCallback,
  redirectUrl,
  className = ''
}: TelegramLoginWidgetProps) {
  const t = useTranslations('Login');
  const ti = useTranslations('Index');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Make callback globally available for the widget
    if (onAuthCallback && typeof window !== 'undefined') {
      (window as any).onTelegramAuth = (user: any) => {
        onAuthCallback(user);
      };
    }

    let isMounted = true;
    let frameObserver: MutationObserver | undefined;
    let receivedMessage = false;
    setIsLoading(true);
    setLoadFailed(false);
    setIsVerified(false);

    // Listen to messages from oauth.telegram.org
    const handleMessage = (event: MessageEvent) => {
      let trustedTelegramOrigin = false;
      try {
        const origin = new URL(event.origin);
        trustedTelegramOrigin = origin.protocol === 'https:' && (origin.hostname === 'telegram.org' || origin.hostname.endsWith('.telegram.org'));
      } catch { /* Ignore malformed origins. */ }
      if (trustedTelegramOrigin) {
        receivedMessage = true;
        if (isMounted) {
          setIsVerified(true);
          setIsLoading(false);
          setLoadFailed(false);
        }
      }
    };
    window.addEventListener('message', handleMessage);

    // Load widget script
    if (containerRef.current) {
      containerRef.current.innerHTML = '';

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botName);
      script.setAttribute('data-size', buttonSize);
      if (cornerRadius !== undefined) {
        script.setAttribute('data-radius', cornerRadius.toString());
      }
      if (requestAccess) {
        script.setAttribute('data-request-access', requestAccess);
      }
      script.setAttribute('data-userpic', usePic.toString());

      if (redirectUrl) {
        script.setAttribute('data-auth-url', redirectUrl);
      } else {
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      }

      script.async = true;

      script.onerror = () => {
        if (isMounted) {
          setLoadFailed(true);
          setIsLoading(false);
        }
      };

      containerRef.current.appendChild(script);

      // Telegram's widget injects an untitled iframe; give it an accessible name (WCAG 4.1.2 / axe frame-title).
      const nameFrames = () => containerRef.current?.querySelectorAll('iframe:not([title])').forEach(frame => frame.setAttribute('title', 'Log in with Telegram'));
      frameObserver = new MutationObserver(nameFrames);
      frameObserver.observe(containerRef.current, { childList: true, subtree: true });
      nameFrames();

      // A missing handshake has several possible causes. Offer a retry without
      // claiming to have detected the user's browser or blocker settings.
      const timeoutId = setTimeout(() => {
        if (isMounted && !receivedMessage) {
          setLoadFailed(true);
          setIsLoading(false);
        }
      }, 2500);

      return () => {
        isMounted = false;
        window.removeEventListener('message', handleMessage);
        clearTimeout(timeoutId);
        frameObserver?.disconnect();
      };
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, onAuthCallback, redirectUrl, retryCount]);

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-28 w-full ${className}`}>
      {isLoading && !loadFailed && !isVerified && (
        <div role="status" className="w-full space-y-2 text-center">
          <Skeleton height={48} /><p className="text-caption text-brand-muted">{t('connecting')}</p>
        </div>
      )}

      {/* Verified native Telegram widget (hidden until fully ready to avoid crashed Chromium subframe) */}
      <div
        ref={containerRef}
        className={isVerified && !loadFailed ? 'flex justify-center w-full' : 'hidden'}
      />

      {/* Retry an unavailable widget; the page already provides the Telegram app link */}
      {loadFailed && (
        <div className="flex flex-col items-center gap-2.5 w-full">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-caption text-brand-muted text-center">{t('widget_unavailable')}</span>
            <Button variant="ghost" size="sm"
              onClick={() => {
                setIsLoading(true);
                setLoadFailed(false);
                setIsVerified(false);
                setRetryCount(c => c + 1);
              }}
            >
              {ti('retry')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
