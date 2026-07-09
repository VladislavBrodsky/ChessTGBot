'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TelegramLoginWidgetProps {
  botName: string;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: 'write';
  usePic?: boolean;
  onAuthCallback?: (data: any) => void;
  redirectUrl?: string;
}

export default function TelegramLoginWidget({
  botName,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = 'write',
  usePic = true,
  onAuthCallback,
  redirectUrl
}: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Make callback globally available for the widget
    if (onAuthCallback && typeof window !== 'undefined') {
      (window as any).onTelegramAuth = (user: any) => {
        onAuthCallback(user);
      };
    }

    // Load widget script
    if (containerRef.current) {
      // Clear container first (in case of strict mode double effect)
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
      containerRef.current.appendChild(script);
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, onAuthCallback, redirectUrl]);

  return <div ref={containerRef} className="flex justify-center" />;
}
