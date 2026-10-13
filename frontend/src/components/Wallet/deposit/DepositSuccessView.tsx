'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useAnimationsEnabled } from '@/hooks/useAnimationsEnabled';
import Confetti from 'react-confetti';

export interface DepositSuccessViewProps {
  showConfetti: boolean;
  windowDimensions: { width: number; height: number };
  successMessage: string;
  walletBalance?: number;
  onClose: () => void;
}

export function DepositSuccessView({
  showConfetti,
  windowDimensions,
  successMessage,
  walletBalance,
  onClose,
}: DepositSuccessViewProps) {
  const tw = useTranslations('Wallet');
  const tc = useTranslations('Common');
  const animations = useAnimationsEnabled();
  return <Modal isOpen onClose={onClose} title={tw('deposit_complete')} description={successMessage} maxWidth="sm"
    footer={<Button variant="primary" className="w-full" onClick={onClose}>{tc('close')}</Button>}>
    {showConfetti && animations && <div className="fixed inset-0 pointer-events-none"><Confetti width={windowDimensions.width} height={windowDimensions.height} recycle={false} numberOfPieces={56} /></div>}
    <dl className="result-metrics"><div><dt>{tw('updated_balance')}</dt><dd><bdi>{typeof walletBalance === 'number' && Number.isFinite(walletBalance) ? `$${(walletBalance / 100).toFixed(2)}` : '—'} USDT</bdi></dd></div></dl>
  </Modal>;
}
