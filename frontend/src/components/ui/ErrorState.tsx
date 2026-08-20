import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FiAlertCircle } from 'react-icons/fi';

export interface ErrorStateProps {
  title?: React.ReactNode;
  message?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading this data. Please try again.',
  onRetry,
  retryLabel = 'Try again',
  className = '',
}: ErrorStateProps) {
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
        <h3 className="text-sm font-bold text-brand-primary">{title}</h3>
        <p className="text-xs leading-relaxed text-brand-muted">{message}</p>
      </div>

      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </Card>
  );
}
