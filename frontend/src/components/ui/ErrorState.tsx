'use client';

import { useTranslations } from 'next-intl';
import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FiAlertCircle } from 'react-icons/fi';

export interface ErrorStateProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  action?: React.ReactNode;
  className?: string;
  /** Heading level of the title; use `h2` when the state directly follows the page's `h1` so levels never skip. */
  headingAs?: 'h2' | 'h3' | 'h4';
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  action,
  className = '',
  headingAs: Heading = 'h3',
}: ErrorStateProps) {
  const t = useTranslations('Common');
  return (
    <Card
      variant="solid"
      role="alert"
      className={`flex flex-col items-center justify-center text-center p-6 space-y-4 border-rose-500/20 bg-rose-950/10 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <FiAlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-sm">
        <Heading className="text-sm font-bold text-brand-primary">{title ?? t('error_title')}</Heading>
        <p className="text-sm leading-relaxed text-brand-muted">{message ?? t('error_description')}</p>
      </div>

      {action ? (
        action
      ) : onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel ?? t('retry')}
        </Button>
      ) : null}
    </Card>
  );
}
