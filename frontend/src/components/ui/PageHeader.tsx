'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { telegramHaptic } from '@/lib/telegram';

export type HeroTone = 'success' | 'gold' | 'info' | 'premium' | 'danger';

/** One stable title/purpose group and in-flow utilities on every destination. */
export function PageHeader({ title, description, eyebrow, actions, backHref, backLabel, icon, tone, align = 'start' }: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
  icon?: ReactNode;
  tone?: HeroTone;
  /** Dashboard headers use `start`; entry and invite screens may explicitly use `center`. */
  align?: 'center' | 'start';
}) {
  const t = useTranslations('Index');
  return (
    <header className="page-header" data-tone={tone} data-align={align} data-has-lead={backHref ? true : undefined} data-has-actions={actions ? true : undefined}>
      <div className="page-header__lead">
        {backHref && (
          <Link href={backHref} aria-label={backLabel || t('back')} className="html-back-button ui-icon-button" onClick={() => telegramHaptic('selection')}>
            <FiArrowLeft size={20} className="rtl:rotate-180" aria-hidden="true" />
          </Link>
        )}
      </div>
      <div className="page-header__main">
        {icon && <span className="page-header__icon" aria-hidden="true">{icon}</span>}
        <div className="page-header__copy">
          {eyebrow && <p className="page-header__eyebrow t-eyebrow text-brand-muted">{eyebrow}</p>}
          <h1 className="page-header__title t-title-1 text-brand-primary">{title}</h1>
          {description && <div className="page-header__desc t-body text-brand-muted">{description}</div>}
        </div>
      </div>
      <div className="page-header__actions">{actions}</div>
    </header>
  );
}

export function SectionHeader({ title, id, action }: { title: ReactNode; id?: string; action?: ReactNode }) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <h2 id={id} className="ui-section-title t-title-2 text-brand-primary">{title}</h2>
      {action}
    </div>
  );
}

/** Navigation is a link; mutations remain Button actions. */
export function ActionLink({ href, children, icon, primary = false, className = '', onClick }: {
  href: string; children: ReactNode; icon?: ReactNode; primary?: boolean; className?: string; onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Link href={href} onClick={(e) => {
      telegramHaptic(primary ? 'medium' : 'selection');
      if (onClick) onClick(e);
    }}
      className={`ui-action-link ${primary ? 'ui-action-link--primary' : ''} ${className}`}>
      {icon && <span className={primary ? 'ui-action-link__icon' : 'shrink-0 text-xl'} aria-hidden="true">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      <span className={primary ? 'ui-action-link__arrow' : 'contents'} aria-hidden="true"><FiArrowRight size={primary ? 20 : 18} className="shrink-0 rtl:rotate-180" /></span>
    </Link>
  );
}
