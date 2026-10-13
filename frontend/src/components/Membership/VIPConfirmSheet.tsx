'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { FaCheck } from 'react-icons/fa';

interface VIPConfirmSheetProps {
    isOpen: boolean;
    title: string;
    description: string;
    costText: string;
    balanceText?: string;
    perks?: string[];
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function VIPConfirmSheet({ isOpen, title, description, costText, balanceText, perks = [], loading = false, onConfirm, onCancel }: VIPConfirmSheetProps) {
  const t = useTranslations('Membership'), tc = useTranslations('Common');
  const cancel = () => { if (!loading) onCancel(); };
  return <Drawer isOpen={isOpen} onClose={cancel} title={title} description={description} layer={110}
    footer={<div className="space-y-2"><Button variant="primary" className="w-full" onClick={onConfirm} disabled={loading} isLoading={loading}>{t('confirm_upgrade')}</Button><Button variant="secondary" className="w-full" onClick={cancel} disabled={loading}>{tc('cancel')}</Button></div>}>
    {perks.length > 0 && <ul className="space-y-3">{perks.map((perk, i) => <li key={i} className="flex items-start gap-3 t-body"><FaCheck className="text-brand-success shrink-0 mt-1" aria-hidden="true" /><span>{perk}</span></li>)}</ul>}
    <dl className="result-metrics"><div><dt>{t('payment_amount')}</dt><dd><bdi>{costText}</bdi></dd></div></dl>
    {balanceText && <p className="t-caption text-brand-muted">{balanceText}</p>}
  </Drawer>;
}
