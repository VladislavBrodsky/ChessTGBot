'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaChessKnight, FaCopy, FaShareAlt, FaTelegramPlane } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import { Card } from '@/components/ui/Card';
import { Backdrop } from '@/components/ui/Backdrop';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { QrCode } from '@/components/ui/QrCode';
import { telegramHaptic } from '@/lib/telegram';
import { copyToClipboard } from '@/lib/clipboard';
import { mainMiniAppLink, shareInvitation } from '@/lib/invitations';

/** A public, shareable referral page with instant vector QR and complete back navigation. */
export default function QrClient() {
  const router = useRouter();
  const locale = useLocale();
  const params = useSearchParams();
  const t = useTranslations('Referral');
  const tIndex = useTranslations('Index');
  const inviteText = useTranslations('Invitations');

  const code = params.get('code') || '';
  const validCode = /^[A-Za-z0-9_-]{1,60}$/.test(code);
  const bot = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');
  const inviteLink = validCode ? mainMiniAppLink(bot, `ref_${code}`) : '';

  const handleBack = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    telegramHaptic('light');
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${locale}/challenges`);
    }
  }, [router, locale]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Telegram?.WebApp) return;
    const tg = window.Telegram.WebApp;
    if (!tg.BackButton) return;

    const onTgBack = () => {
      telegramHaptic('light');
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push(`/${locale}/challenges`);
      }
    };

    tg.BackButton.show();
    tg.onEvent?.('backButtonClicked', onTgBack);
    return () => {
      try {
        tg.offEvent?.('backButtonClicked', onTgBack);
        tg.BackButton.hide();
      } catch {
        /* noop */
      }
    };
  }, [router, locale]);

  const copyLink = async () => {
    if (!validCode) return;
    if (await copyToClipboard(inviteLink)) {
      telegramHaptic('success');
    }
  };

  const shareLink = () => {
    if (!validCode) return;
    telegramHaptic('selection');
    shareInvitation(inviteLink, inviteText('share_text'));
  };

  return (
    <main className="relative flex min-h-[100dvh] items-center overflow-hidden bg-brand-void px-4 pt-[calc(24px+var(--app-safe-top))] pb-[calc(24px+var(--app-safe-bottom))] text-brand-primary">
      <Backdrop />
      <div className="relative z-10 mx-auto w-full max-w-[420px] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface text-brand-action">
            <FaChessKnight size={22} aria-hidden="true" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleBack} leftIcon={<FiArrowLeft />}>
            {tIndex('back')}
          </Button>
        </div>

        <PageHeader
          align="center"
          title={t('invite_title')}
          description={t('invite_description')}
          backHref={`/${locale}/challenges`}
        />

        <Card variant="solid" className="p-4 sm:p-6 text-center space-y-4">
          {validCode ? (
            <>
              <div className="mx-auto flex aspect-square w-full max-w-[244px] items-center justify-center rounded-2xl bg-white p-3 shadow-lg border border-white/20">
                <QrCode value={inviteLink} alt={t('invite_qr_alt')} size={220} />
              </div>
              <p className="text-sm font-medium text-brand-muted">@{bot}</p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="secondary" onClick={copyLink} leftIcon={<FaCopy />} className="w-full">
                  {t('copy')}
                </Button>
                <Button variant="secondary" onClick={shareLink} leftIcon={<FaShareAlt />} className="w-full">
                  {t('share_invite')}
                </Button>
              </div>

              <a
                href={inviteLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => telegramHaptic('selection')}
                className="ui-action-link ui-action-link--primary mt-3 justify-center text-center"
              >
                <FaTelegramPlane size={18} aria-hidden="true" />
                {t('open_invite')}
              </a>

              <Button variant="ghost" size="sm" onClick={handleBack} className="w-full mt-2 text-brand-muted">
                {tIndex('back')}
              </Button>
            </>
          ) : (
            <div className="space-y-4 py-8">
              <p role="alert" className="text-sm text-brand-muted">{t('invalid_invite')}</p>
              <Button variant="secondary" onClick={handleBack} className="w-full">
                {tIndex('back')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
