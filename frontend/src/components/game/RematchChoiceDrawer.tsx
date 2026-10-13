'use client';

import { useTranslations } from 'next-intl';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';

interface RematchChoiceDrawerProps { wagerAmount: number; onClose: () => void; onSendRematchOffer: (doubleStakes: boolean) => void }
export default function RematchChoiceDrawer({ wagerAmount, onClose, onSendRematchOffer }: RematchChoiceDrawerProps) {
  const t = useTranslations('Game');
  return <Drawer isOpen layer={110} onClose={onClose} title={t('revenge_match')} description={t('rematch_setup_description')}>
    <div className="space-y-3">
      <Button variant="primary" className="w-full flex-col" onClick={() => onSendRematchOffer(false)}><span>{t('same_stakes')}</span><bdi className="t-caption">{(wagerAmount / 100).toFixed(2)} USDT</bdi></Button>
      <Button variant="secondary" className="w-full flex-col" onClick={() => onSendRematchOffer(true)}><span>{t('double_stakes_choice')}</span><bdi className="t-caption">{(wagerAmount * 2 / 100).toFixed(2)} USDT</bdi></Button>
      <Button variant="ghost" className="w-full" onClick={onClose}>{t('cancel')}</Button>
    </div>
  </Drawer>;
}
