'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';

/** Shared, non-scrolling title/purpose/close anatomy for sheets and dialogs. */
export function DialogHeader({ title, description, titleId, descriptionId, onClose, showClose = true }: {
  title?: ReactNode; description?: ReactNode; titleId: string; descriptionId: string;
  onClose: () => void; showClose?: boolean;
}) {
  const t = useTranslations('Common');
  return <div className="ui-dialog-header">
    <div className="min-w-0 flex-1 space-y-1">
      <h2 id={titleId} className="t-title-2 text-brand-primary break-words">{title || t('dialog')}</h2>
      {description && <div id={descriptionId} className="t-body text-brand-muted leading-relaxed">{description}</div>}
    </div>
    {showClose && <Button variant="ghost" className="h-11 w-11 shrink-0 p-0" aria-label={t('close_dialog')} onClick={onClose}>
      <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M6 18 18 6" strokeWidth="2" strokeLinecap="round" /></svg>
    </Button>}
  </div>;
}
