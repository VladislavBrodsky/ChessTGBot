'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiGift, FiInfo } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { telegramHaptic } from '@/lib/telegram';

/** A rules preview only. No season, entry, balance, or prize exists yet. */
export function GramVaultPreview() {
  const t = useTranslations('GramVaultPreview');
  const [open, setOpen] = useState(false);

  return <>
    <Card variant="solid" className="space-y-3 p-4" aria-labelledby="gram-vault-preview-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="ui-icon-tile ui-icon-tile--premium shrink-0">
            <FiGift size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="gram-vault-preview-title" className="t-title-3 truncate">{t('title')}</h2>
            <p className="t-caption text-brand-muted truncate">{t('status')}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            telegramHaptic('selection');
            setOpen(true);
          }}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400/50 transition-all text-xs font-semibold cursor-pointer active:scale-95 whitespace-nowrap"
          aria-label={t('details')}
        >
          <FiInfo size={13} className="text-purple-400" aria-hidden="true" />
          <span>{t('badge')}</span>
        </button>
      </div>

      <p className="t-body text-brand-muted">{t('summary')}</p>

      <div className="flex items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-elevated/40 px-3.5 py-2.5 text-caption text-brand-muted">
        <FiInfo size={14} className="shrink-0 text-brand-muted" aria-hidden="true" />
        <span>{t('current_box')}</span>
      </div>
    </Card>

    <Modal isOpen={open} onClose={() => setOpen(false)} title={t('title')} description={t('status')}>
      <div className="space-y-4">
        <p className="t-body text-brand-muted">{t('summary')}</p>
        <ol className="space-y-2">
          <li className="ui-list-row p-3">{t('phase_one')}</li>
          <li className="ui-list-row p-3">{t('phase_two')}</li>
        </ol>
        <p className="t-body text-brand-muted">{t('chance')}</p>
        <p className="t-caption text-brand-muted">{t('current_box')}</p>
        <Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>{t('close')}</Button>
      </div>
    </Modal>
  </>;
}
