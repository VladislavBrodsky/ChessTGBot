'use client';

import { useEffect, useRef, useState } from 'react';

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

      // Timeout: If Telegram's iframe hasn't sent a verified handshake within 2.5s,
      // it was blocked by browser shields (e.g. Brave), third-party cookie restrictions, or invalid domain.
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
      };
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, onAuthCallback, redirectUrl, retryCount]);

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-[48px] w-full ${className}`}>
      {isLoading && !loadFailed && !isVerified && (
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-muted text-sm font-semibold animate-pulse shadow-sm">
          <svg className="w-4 h-4 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Connecting Telegram...</span>
        </div>
      )}

      {/* Verified native Telegram widget (hidden until fully ready to avoid crashed Chromium subframe) */}
      <div
        ref={containerRef}
        className={isVerified && !loadFailed ? 'flex justify-center w-full' : 'hidden'}
      />

      {/* Resilient fallback CTA when iframe is blocked by Brave Shields or adblockers */}
      {loadFailed && (
        <div className="flex flex-col items-center gap-2.5 w-full">
          <a
            href={`https://t.me/${botName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold normal-case tracking-normal transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-98"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
            </svg>
            <span>Log in via Telegram</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-caption text-brand-muted text-center font-mono">
              Brave Shields or ad-blocker detected
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadFailed(false);
                setIsVerified(false);
                setRetryCount(c => c + 1);
              }}
              className="ui-tap-target text-caption text-emerald-500 hover:underline font-mono"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
