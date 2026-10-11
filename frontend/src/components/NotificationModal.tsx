'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FiBookOpen, FiInfo } from 'react-icons/fi';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const t = useTranslations('Notifications');
  const [activeTab, setActiveTab] = useState<'guide' | 'features'>('guide');
  const guide = [
    { title: t('wallet_title'), description: t('wallet_description') },
    { title: t('xp_title'), description: t('xp_description') },
    { title: t('vault_title'), description: t('vault_description') },
  ];
  const features = [
    { title: t('vault_title'), description: t('vault_description') },
    { title: t('practice_title'), description: t('practice_description') },
  ];
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('title')} maxWidth="md">
      <div className="space-y-5">
        <Tabs aria-label={t('title')} activeTab={activeTab} onChange={setActiveTab}
          tabs={[
            { id: 'guide', label: t('guide'), icon: <FiBookOpen aria-hidden="true" /> },
            { id: 'features', label: t('features'), icon: <FiInfo aria-hidden="true" /> },
          ]} />
        <div role="tabpanel" aria-label={activeTab === 'guide' ? t('guide') : t('features')}>
          <ol className="space-y-4">
            {(activeTab === 'guide' ? guide : features).map((item, index) => (
              <li key={item.title} className="flex items-start gap-3">
                <span className="ui-icon-tile shrink-0 tabular-nums" aria-hidden="true">{index + 1}</span>
                <div className="min-w-0">
                  <h3 className="t-title-3 text-brand-primary">{item.title}</h3>
                  <p className="t-body mt-1 text-brand-muted">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Modal>
  );
}
