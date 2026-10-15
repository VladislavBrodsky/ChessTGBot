'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FaChessKnight, FaTelegramPlane } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { Backdrop } from '@/components/ui/Backdrop';
import { PageHeader } from '@/components/ui/PageHeader';
import { telegramHaptic } from '@/lib/telegram';
import { mainMiniAppLink } from '@/lib/invitations';

/** A public, shareable referral page. Never trust a bot name from the URL. */
export default function QrClient() {
  const params = useSearchParams();
  const t = useTranslations('Referral');
  const code = params.get('code') || '';
  const validCode = /^[A-Za-z0-9_-]{1,60}$/.test(code);
  const bot = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');
  const inviteLink = validCode ? mainMiniAppLink(bot, `ref_${code}`) : '';
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}&color=000000&bgcolor=ffffff&qzone=2&format=png`;

  return (
    <main className="relative flex min-h-[100dvh] items-center overflow-hidden bg-brand-void px-4 pt-[calc(24px+var(--app-safe-top))] pb-[calc(24px+var(--app-safe-bottom))] text-brand-primary">
      <Backdrop />
      <div className="relative z-10 mx-auto w-full max-w-[420px] space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface text-brand-action">
          <FaChessKnight size={26} aria-hidden="true" />
        </div>
        <PageHeader align="center" title={t('invite_title')} description={t('invite_description')} />
        <Card variant="solid" className="p-4 sm:p-6 text-center">
          {validCode ? <>
            <div className="mx-auto w-full max-w-[244px] rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- external QR generation service */}
              <img src={qrSrc} alt={t('invite_qr_alt')} width={220} height={220} className="block h-auto w-full aspect-square" />
            </div>
            <p className="mt-4 text-sm font-medium text-brand-muted">@{bot}</p>
            <a href={inviteLink} target="_blank" rel="noopener noreferrer" onClick={() => telegramHaptic('selection')}
              className="ui-action-link ui-action-link--primary mt-6 justify-center text-center">
              <FaTelegramPlane size={20} aria-hidden="true" />{t('open_invite')}
            </a>
          </> : <p role="alert" className="py-12 text-sm text-brand-muted">{t('invalid_invite')}</p>}
        </Card>
      </div>
    </main>
  );
}
