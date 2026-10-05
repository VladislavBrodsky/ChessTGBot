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
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Make callback globally available for the widget
    if (onAuthCallback && typeof window !== 'undefined') {
      (window as any).onTelegramAuth = (user: any) => {
        onAuthCallback(user);
      };
    }

    let isMounted = true;
    setIsLoading(true);
    setLoadFailed(false);

    // Listen to messages from oauth.telegram.org
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.origin === 'string' && event.origin.includes('telegram.org')) {
        if (isMounted) {
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

      // Observe iframe insertion & lifecycle
      const observer = new MutationObserver(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe && isMounted) {
          iframe.addEventListener('load', () => {
            // Verify after render whether iframe actually loaded or crashed
            setTimeout(() => {
              if (!isMounted) return;
              try {
                // If the iframe was blocked by client (adblock) or domain error,
                // it often collapses or fails to report size
                if (iframe.offsetWidth < 50 || iframe.offsetHeight < 20) {
                  setLoadFailed(true);
                } else {
                  setIsLoading(false);
                }
              } catch {
                setLoadFailed(true);
              }
              setIsLoading(false);
            }, 800);
          });

          iframe.addEventListener('error', () => {
            if (isMounted) {
              setLoadFailed(true);
              setIsLoading(false);
            }
          });
        }
      });

      observer.observe(containerRef.current, { childList: true, subtree: true });

      // Fallback timeout: if after 3.2 seconds the widget has not settled
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          const iframe = containerRef.current?.querySelector('iframe');
          if (!iframe || iframe.offsetWidth < 50 || iframe.offsetHeight < 20) {
            setLoadFailed(true);
          }
          setIsLoading(false);
        }
      }, 3200);

      return () => {
        isMounted = false;
        window.removeEventListener('message', handleMessage);
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, onAuthCallback, redirectUrl, retryCount]);

  return (
    <div className={`relative flex flex-col items-center justify-center min-h-[48px] ${className}`}>
      {isLoading && !loadFailed && (
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand-surface border border-brand-border text-brand-muted text-xs font-semibold animate-pulse shadow-sm">
          <svg className="w-4 h-4 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Connecting Telegram...</span>
        </div>
      )}

      {loadFailed ? (
        <div className="flex flex-col items-center gap-2.5 w-full">
          <a
            href={`https://t.me/${botName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-emerald-500/20 active:scale-98"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
            </svg>
            <span>Log in via Telegram</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-brand-muted text-center font-mono">
              Widget blocked or domain unverified
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setLoadFailed(false);
                setRetryCount(c => c + 1);
              }}
              className="text-[10px] text-emerald-500 hover:underline font-mono"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={`flex justify-center transition-opacity duration-300 ${isLoading ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}
        />
      )}
    </div>
  );
}
