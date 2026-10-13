'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiLock, FiInfo } from 'react-icons/fi';
import { Badge } from '@/components/ui/Badge';
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
            <FiLock size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 id="gram-vault-preview-title" className="t-title-3 truncate">{t('title')}</h2>
              <Badge variant="purple">{t('badge')}</Badge>
            </div>
            <p className="t-caption text-brand-muted truncate">{t('status')}</p>
          </div>
        </div>
      </div>

      <p className="t-body text-brand-muted">{t('summary')}</p>

      <div className="flex items-center gap-2 rounded-xl border border-brand-border/60 bg-brand-elevated/40 px-3 py-2 text-caption text-brand-muted">
        <FiInfo size={14} className="shrink-0 text-brand-muted" aria-hidden="true" />
        <span>{t('current_box')}</span>
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          telegramHaptic('selection');
          setOpen(true);
        }}
      >
        {t('details')}
      </Button>
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
