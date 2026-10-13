'use client';

import { useTranslations } from 'next-intl';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface IncomingRematchDrawerProps {
  incomingRematch: { challenger_name: string; wager: number; double_stakes: boolean };
  timeControl?: number; onAccept: () => void; onDecline: () => void;
}
export default function IncomingRematchDrawer({ incomingRematch, timeControl = 600, onAccept, onDecline }: IncomingRematchDrawerProps) {
  const t = useTranslations('Game'), tq = useTranslations('QuickMatch');
  return <Modal isOpen layer={110} onClose={onDecline} title={t('rematch_dialog_title')} description={t('challenger_offered_rematch', { name: incomingRematch.challenger_name })} maxWidth="sm"
    footer={<div className="grid grid-cols-2 gap-3"><Button variant="secondary" onClick={onDecline}>{t('reject')}</Button><Button variant="primary" onClick={onAccept}>{t('accept')}</Button></div>}>
    <dl className="result-metrics"><div><dt>{t('proposed_wager')}</dt><dd><bdi>{(incomingRematch.wager / 100).toFixed(2)} USDT</bdi></dd></div><div><dt>{t('time_control')}</dt><dd>{tq('minutes', { count: timeControl / 60 })}</dd></div></dl>
    {incomingRematch.double_stakes && <Badge variant="amber" className="mt-3">{t('double_stakes_active')}</Badge>}
  </Modal>;
}
