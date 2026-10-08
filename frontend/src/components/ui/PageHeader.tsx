'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiArrowRight, FiCreditCard, FiUser } from 'react-icons/fi';
import { useLocale, useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';

/** One heading and one clear orientation point on every destination. */
export function PageHeader({ title, description, eyebrow, actions, backHref, backLabel }: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  const t = useTranslations('Index');
  return (
    <header className="page-header">
      {backHref && (
        <Link href={backHref} aria-label={backLabel || t('back')} className="html-back-button ui-icon-button" onClick={() => telegramHaptic('selection')}>
          <FiArrowLeft size={20} className="rtl:rotate-180" aria-hidden="true" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="mb-1 text-caption font-medium text-brand-muted">{eyebrow}</p>}
        <h1 className="text-page-title font-semibold text-brand-primary">{title}</h1>
        {description && <div className="mt-1.5 text-sm leading-relaxed text-brand-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeader({ title, id, action }: { title: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="text-section-title font-semibold text-brand-primary">{title}</h2>
      {action}
    </div>
  );
}

export function PageUtilities() {
  const locale = useLocale();
  const t = useTranslations('Index');
  return <>
    <Link href={`/${locale}/wallet`} aria-label={t('nav_wallet')} className="ui-icon-button" onClick={() => telegramHaptic('selection')}><FiCreditCard size={20} aria-hidden="true" /></Link>
    <Link href={`/${locale}/profile`} aria-label={t('nav_profile')} className="ui-icon-button" onClick={() => telegramHaptic('selection')}><FiUser size={20} aria-hidden="true" /></Link>
  </>;
}

/** Navigation is a link; mutations remain Button actions. */
export function ActionLink({ href, children, icon, primary = false, className = '' }: {
  href: string; children: ReactNode; icon?: ReactNode; primary?: boolean; className?: string;
}) {
  return (
    <Link href={href} onClick={() => telegramHaptic(primary ? 'medium' : 'selection')}
      className={`ui-action-link ${primary ? 'ui-action-link--primary' : ''} ${className}`}>
      {icon && <span className="shrink-0 text-xl" aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      <FiArrowRight size={18} className="shrink-0 rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}
