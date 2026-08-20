'use client';

import React from 'react';
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
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
    lg: 'p-1.5 text-base',
  };

  const itemPaddingClasses = {
    sm: 'py-1 px-2.5 min-h-[34px]',
    md: 'py-1.5 px-3.5 min-h-[42px]',
    lg: 'py-2 px-4 min-h-[48px]',
  };

  return (
    <div
      role="tablist"
      className={`inline-flex w-full items-center justify-center rounded-2xl bg-brand-void/80 border border-brand-border ${sizeClasses[size]} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => {
              if (!isSelected) {
                telegramHaptic('selection');
                onChange(option.value);
              }
            }}
            className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-white ${itemPaddingClasses[size]} ${
              isSelected ? 'text-brand-primary' : 'text-brand-muted hover:text-brand-primary/80'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="segmented-control-active"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-0 rounded-xl bg-brand-elevated border border-white/10 shadow-sm"
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon && <span className="text-base">{option.icon}</span>}
              <span>{option.label}</span>
              {option.badge !== undefined && (
                <span className="ml-1 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
