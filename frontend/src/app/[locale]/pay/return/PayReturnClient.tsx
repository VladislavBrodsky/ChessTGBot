'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaChessKnight, FaCheckCircle, FaTelegramPlane, FaTimesCircle } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { mainMiniAppLink } from '@/lib/invitations';
import { getStoredWebAuth } from '@/lib/sessionAuth';
import { hardRedirect } from '@/lib/hardRedirect';

/**
 * Where Stripe sends a player after card checkout.
 *
 * Checkout opens in Telegram's browser, which holds no Mini App session, so the
 * authenticated wallet page used to bounce the player to a login screen right
 * after paying. This page is public and says what happened and where to go next.
 * It cannot verify the payment (it has no session), so it makes no claim about
 * the balance: the Mini App confirms and credits the payment itself.
 */
export default function PayReturnClient() {
  const locale = useLocale();
  const t = useTranslations('PayReturn');
  const params = useSearchParams();
  const status = params.get('status');
  const sessionId = params.get('session_id') || '';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // A browser that does hold a session (Telegram, or a desktop web login) goes
    // back to the wallet, where the existing verification runs.
    const hasSession = Boolean(window.Telegram?.WebApp?.initData) || Boolean(getStoredWebAuth());
    if (!hasSession) return;
    setRedirecting(true);
    const verifiable = status === 'success' && /^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId);
    hardRedirect(verifiable
      ? `/${locale}/wallet?status=success&session_id=${encodeURIComponent(sessionId)}`
      : `/${locale}/wallet`);
  }, [locale, status, sessionId]);

  if (redirecting) return null;

  const bot = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');
  const kind = status === 'success' ? 'success' : status === 'cancel' ? 'cancel' : 'unknown';
  const Icon = kind === 'success' ? FaCheckCircle : kind === 'cancel' ? FaTimesCircle : FaChessKnight;
  const tone = kind === 'success' ? 'text-emerald-400' : kind === 'cancel' ? 'text-brand-muted' : 'text-brand-primary';

  return (
    <main className="min-h-[100dvh] bg-brand-void flex items-center justify-center px-4 py-8">
      <Card variant="solid" className="w-full max-w-sm space-y-4 p-6 text-center">
        <Icon className={`mx-auto text-4xl ${tone}`} aria-hidden="true" />
        <h1 className="text-xl font-bold text-brand-primary">{t(`title_${kind}`)}</h1>
        <p className="text-sm text-brand-muted">{t(`body_${kind}`)}</p>
        <a
          href={mainMiniAppLink(bot, 'home')}
          className="ui-button action-button inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-[650]"
        >
          <FaTelegramPlane aria-hidden="true" />
          {t('open_app')}
        </a>
      </Card>
    </main>
  );
}
