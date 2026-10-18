'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FaCheck, FaCopy, FaShareAlt } from 'react-icons/fa';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { QrCode } from '@/components/ui/QrCode';
import { copyToClipboard } from '@/lib/clipboard';
import { shareInvitation } from '@/lib/invitations';
import { telegramHaptic } from '@/lib/telegram';

interface ReferralQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteLink: string;
  botUsername: string;
  code: string;
}

export function ReferralQrModal({
  isOpen,
  onClose,
  inviteLink,
  botUsername,
  code,
}: ReferralQrModalProps) {
  const t = useTranslations('Referral');
  const tCommon = useTranslations('Common');
  const inviteText = useTranslations('Invitations');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!inviteLink) return;
    if (await copyToClipboard(inviteLink)) {
      setCopied(true);
      telegramHaptic('success');
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (!inviteLink) return;
    telegramHaptic('selection');
    shareInvitation(inviteLink, inviteText('share_text'));
  };

  const handleClose = () => {
    telegramHaptic('light');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('invite_qr_alt')}
      description={t('invite_description')}
      maxWidth="sm"
      footer={
        <Button variant="secondary" onClick={handleClose} className="w-full">
          {tCommon('close')}
        </Button>
      }
    >
      <div className="flex flex-col items-center space-y-4 py-2">
        <div className="flex aspect-square w-full max-w-[244px] items-center justify-center rounded-2xl bg-white p-3 shadow-xl border border-white/20">
          <QrCode value={inviteLink} alt={t('invite_qr_alt')} size={216} />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-brand-primary">@{botUsername}</p>
          <p className="font-mono text-xs text-brand-muted">ref_{code}</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 pt-1">
          <Button
            variant="secondary"
            onClick={handleCopy}
            leftIcon={copied ? <FaCheck className="text-brand-action" /> : <FaCopy />}
            className="w-full"
          >
            {copied ? t('copied') : t('copy')}
          </Button>
          <Button
            variant="secondary"
            onClick={handleShare}
            leftIcon={<FaShareAlt />}
            className="w-full"
          >
            {t('share_invite')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ReferralQrModal;
