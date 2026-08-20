import React from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { FaChessPawn } from 'react-icons/fa';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <Card
      variant="solid"
      className={`flex flex-col items-center justify-center text-center p-8 space-y-4 border-dashed border-brand-border ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-elevated text-brand-muted border border-brand-border">
        {icon || <FaChessPawn className="h-6 w-6" />}
      </div>

      <div className="space-y-1 max-w-xs">
        <h3 className="text-base font-bold text-brand-primary">{title}</h3>
        {description && (
          <p className="text-xs leading-relaxed text-brand-muted">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}
