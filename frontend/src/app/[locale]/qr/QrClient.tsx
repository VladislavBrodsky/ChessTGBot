'use client';

import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FaChessKnight, FaTelegramPlane } from 'react-icons/fa';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { telegramHaptic } from '@/lib/telegram';

/** A public, shareable referral page. Never trust a bot name from the URL. */
export default function QrClient() {
  const params = useSearchParams();
  const t = useTranslations('Referral');
  const code = params.get('code') || '';
  const validCode = /^[A-Za-z0-9_-]{1,64}$/.test(code);
  const bot = (process.env.NEXT_PUBLIC_BOT_USERNAME || 'chess_matbot').trim().replace(/^@+/, '');
  const inviteLink = `https://t.me/${bot}?start=ref_${code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(inviteLink)}&color=000000&bgcolor=ffffff&qzone=2&format=png`;

  return (
    <main className="flex min-h-[100dvh] items-center bg-brand-void px-4 pt-[calc(24px+var(--app-safe-top))] pb-[calc(24px+var(--app-safe-bottom))] text-brand-primary">
      <div className="mx-auto w-full max-w-[420px] space-y-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface text-brand-action">
          <FaChessKnight size={26} aria-hidden="true" />
        </div>
        <PageHeader title={t('invite_title')} description={t('invite_description')} />
        <Card variant="solid" className="p-6 text-center">
          {validCode ? <>
            <div className="mx-auto w-fit rounded-2xl bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- external QR generation service */}
              <img src={qrSrc} alt={t('invite_qr_alt')} width={220} height={220} className="block h-[220px] w-[220px]" />
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
