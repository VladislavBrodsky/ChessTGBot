'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
interface ModalState { type: 'alert' | 'confirm'; message: string; callback?: (ok: boolean) => void }
export default function CustomAlertModal() {
  const t = useTranslations('AlertModal');
  const [modal, setModal] = useState<ModalState | null>(null);
  useEffect(() => {
    const alert = (event: Event) => {
      const { message, callback } = (event as CustomEvent<{message: string; callback?: () => void}>).detail;
      telegramHaptic('warning'); setModal({ type: 'alert', message, callback: () => callback?.() });
    };
    const confirm = (event: Event) => {
      telegramHaptic('medium'); setModal({ type: 'confirm', ...(event as CustomEvent<{ message: string; callback: (ok: boolean) => void }>).detail });
    };
    window.addEventListener('custom-alert', alert); window.addEventListener('custom-confirm', confirm);
    return () => { window.removeEventListener('custom-alert', alert); window.removeEventListener('custom-confirm', confirm); };
  }, []);
  const close = (ok: boolean) => { modal?.callback?.(ok); setModal(null); };
  return <Modal isOpen={Boolean(modal)} layer={120} onClose={() => close(modal?.type === 'alert')} title={modal?.type === 'confirm' ? t('confirmation') : t('system_notice')} maxWidth="sm"
    footer={modal?.type === 'confirm' ? <div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={() => close(false)}>{t('cancel')}</Button><Button variant="primary" onClick={() => close(true)}>{t('confirm')}</Button></div> : <Button variant="primary" className="w-full" onClick={() => close(true)}>{t('close')}</Button>}>
    <p className="t-body text-brand-primary break-words whitespace-pre-wrap">{modal?.message}</p>
  </Modal>;
}
