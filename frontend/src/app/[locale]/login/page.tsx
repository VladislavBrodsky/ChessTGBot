'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaChessKnight, FaLock, FaTelegramPlane } from 'react-icons/fa';
import TelegramLoginWidget from '@/components/auth/TelegramLoginWidget';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { Backdrop } from '@/components/ui/Backdrop';
import { telegramHaptic } from '@/lib/telegram';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Login');
  const [mounted, setMounted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  useEffect(() => {
    setMounted(true);
    const isTMA = !!(window as any).Telegram?.WebApp?.initData;
    let hasWebAuth = false;
    try { hasWebAuth = !!localStorage.getItem('telegram_web_auth'); } catch { /* storage blocked */ }
    if (isTMA) {
      try { (window as any).Telegram?.WebApp?.ready(); (window as any).Telegram?.WebApp?.expand(); } catch { /* noop */ }
    }
    if (isTMA || hasWebAuth) { setIsRedirecting(true); router.replace(`/${locale}/home`); }
  }, [router, locale]);
  const handleTelegramAuth = useCallback((user: Record<string, unknown>) => {
    const parts: string[] = [];
    Object.keys(user).forEach((key) => {
      const val = user[key];
      if (val !== undefined && val !== null && val !== '') {
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
      }
    });
    const authString = parts.join('&');
    try { localStorage.setItem('telegram_web_auth', authString); } catch { /* storage blocked */ }
    setIsRedirecting(true);
    router.replace(`/${locale}/home`);
  }, [locale, router]);
  const bot = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');

  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-brand-void px-4 pt-[calc(24px+var(--app-safe-top))] pb-[calc(24px+var(--app-safe-bottom))] text-brand-primary">
      <Backdrop />
      <div className="relative z-10 mx-auto w-full max-w-[840px] space-y-5">
        <Card variant="solid" className="ui-backdrop-card backdrop-blur-md grid md:grid-cols-2">
          <section className="flex min-w-0 flex-col items-center justify-center gap-6 border-b border-brand-border p-5 text-center sm:p-8 md:border-b-0 md:border-e" aria-label={t('secure_web_portal')}>
            <span className="ui-icon-tile ui-icon-tile--success" aria-hidden="true"><FaChessKnight size={26} /></span>
            <div className="w-full space-y-3"><Badge variant="secondary">{t('secure_web_portal')}</Badge><PageHeader title={t('web3chess')} /></div>
            <p className="max-w-[280px] text-sm leading-relaxed text-brand-muted">{t('premium_desc')}</p>
            {!mounted || isRedirecting ? <div role="status" className="w-full space-y-2"><Skeleton height={48} /><p className="t-caption text-brand-muted">{t('authenticating')}</p></div> :
              <TelegramLoginWidget botName={bot} buttonSize="large" cornerRadius={12} onAuthCallback={handleTelegramAuth} />}
            <p className="flex items-center justify-center gap-2 text-caption text-brand-muted"><FaLock className="shrink-0 text-brand-action" aria-hidden="true" />{t('secure_auth')}</p>
          </section>
          <section className="flex min-w-0 flex-col items-center justify-center gap-5 p-5 text-center sm:p-8" aria-labelledby="mobile-login-title">
            <h2 id="mobile-login-title" className="t-title-2">{t('play_on_mobile')}</h2>
            <p className="max-w-[280px] text-sm leading-relaxed text-brand-muted">{t('scan_qr')}</p>
            <div className="flex aspect-square w-full max-w-[180px] items-center justify-center rounded-2xl bg-white p-3 shadow-lg border border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element -- external QR service image */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://t.me/${bot}`)}&color=000000&bgcolor=ffffff&margin=2`} alt={t('qr_alt')} width={156} height={156} className="block h-auto w-full aspect-square" />
            </div>
            <a href={`https://t.me/${bot}`} target="_blank" rel="noopener noreferrer" onClick={() => telegramHaptic('selection')} className="ui-action-link ui-action-link--primary w-full justify-center"><FaTelegramPlane aria-hidden="true" />{t('open_in_telegram')}</a>
          </section>
        </Card>
        <p className="text-center text-caption text-brand-muted">Web3Chess · Telegram</p>
      </div>
    </main>
  );
}
