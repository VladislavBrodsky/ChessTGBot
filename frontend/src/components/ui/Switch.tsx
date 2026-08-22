'use client';

import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { telegramHaptic } from '@/lib/telegram';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;
  const descriptionId = `${switchId}-desc`;

  const handleToggle = () => {
    if (disabled) return;
    telegramHaptic('selection');
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex flex-col text-left cursor-pointer" onClick={handleToggle}>
          {label && (
            <label
              htmlFor={switchId}
              className={`text-xs font-bold text-brand-primary cursor-pointer select-none ${
                disabled ? 'opacity-50' : ''
              }`}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              id={descriptionId}
              className="text-[10px] text-brand-muted font-medium select-none"
            >
              {description}
            </span>
          )}
        </div>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-void
          ${checked ? 'bg-emerald-500' : 'bg-brand-elevated border-brand-border'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <span className="sr-only">{label || 'Toggle switch'}</span>
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}
