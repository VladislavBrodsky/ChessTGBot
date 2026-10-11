'use client';

import { useTranslations } from 'next-intl';
import React, { useId } from 'react';
import { Badge } from './Badge';
import { selectionKeyboard } from './selectionKeyboard';
import { motion } from 'framer-motion';
import { telegramHaptic } from '@/lib/telegram';

export interface SegmentOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel,
  size = 'md',
}: SegmentedControlProps<T>) {
  const tc = useTranslations('Common');
  const sizeClasses = {
    sm: 'p-0.5 text-sm',
    md: 'p-1 text-sm',
    lg: 'p-1.5 text-base',
  };

  const itemPaddingClasses = {
    sm: 'py-1 px-2.5 min-h-11',
    md: 'py-1.5 px-3.5 min-h-11',
    lg: 'py-2 px-4 min-h-[48px]',
  };

  const indicatorId = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel ?? tc('view_options')}
      className={`flex w-full flex-wrap items-center justify-center rounded-2xl bg-brand-surface border border-brand-border ${sizeClasses[size]} ${className}`}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onKeyDown={(event) => selectionKeyboard(event, index, options.length, (next) => { telegramHaptic('selection'); onChange(options[next].value); })}
            onClick={() => {
              if (!isSelected) {
                telegramHaptic('selection');
                onChange(option.value);
              }
            }}
            className={`ui-tap-target relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-brand-primary ${itemPaddingClasses[size]} ${
              isSelected ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId={`${indicatorId}-active`}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 rounded-xl bg-brand-elevated border border-brand-border shadow-sm"
              />
            )}

            <span className="relative z-10 flex min-w-0 flex-wrap items-center justify-center gap-1.5">
              {option.icon && <span className="text-base">{option.icon}</span>}
              <span>{option.label}</span>
              {option.badge !== undefined && (
                <Badge size="counter" variant={isSelected ? "primary" : "secondary"}>{option.badge}</Badge>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
