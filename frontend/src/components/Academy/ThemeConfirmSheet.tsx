'use client';

import { useLocale, useTranslations } from 'next-intl';
import { FaPalette } from 'react-icons/fa';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';

interface ThemeConfirmSheetProps {
  isOpen: boolean;
  themeName: string;
  themeDescription?: string;
  priceXP: number;
  userXP: number;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ThemeConfirmSheet({ isOpen, themeName, themeDescription, priceXP, userXP, loading = false, onConfirm, onCancel }: ThemeConfirmSheetProps) {
  const t = useTranslations('Marketplace');
  const tc = useTranslations('Common');
  const locale = useLocale();
  const affordable = userXP >= priceXP;
  return (
    <Drawer isOpen={isOpen} onClose={() => { if (!loading) onCancel(); }} title={t('unlock_theme')} description={themeName}>
      <div className="space-y-4">
        <span className="ui-icon-tile ui-icon-tile--premium"><FaPalette aria-hidden="true" /></span>
        {themeDescription && <p className="t-body text-brand-muted">{themeDescription}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="ui-stat"><span className="ui-stat__label">{t('cost')}</span><bdi className="ui-stat__value text-lg">{priceXP.toLocaleString(locale)} XP</bdi></div>
          <div className="ui-stat"><span className="ui-stat__label">{t('xp_balance')}</span><bdi className="ui-stat__value text-lg">{userXP.toLocaleString(locale)} XP</bdi></div>
        </div>
        <Button className="w-full" variant="premium" isLoading={loading} disabled={loading || !affordable} onClick={onConfirm}>
          {affordable ? t('confirm_unlock', { cost: priceXP.toLocaleString(locale) }) : t('need_more_xp', { amount: (priceXP - userXP).toLocaleString(locale) })}
        </Button>
        <Button className="w-full" variant="ghost" disabled={loading} onClick={onCancel}>{tc('cancel')}</Button>
      </div>
    </Drawer>
  );
}
