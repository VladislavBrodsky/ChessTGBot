'use client';

import React, { useId } from 'react';
import { telegramHaptic } from '@/lib/telegram';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

export function Switch({ checked, onChange, label, description, disabled = false, id, className = '', 'aria-label': ariaLabel }: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;
  const handleToggle = () => {
    if (disabled) return;
    telegramHaptic('selection');
    onChange(!checked);
  };
  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <label htmlFor={switchId} className={`min-w-0 cursor-pointer text-start ${disabled ? 'opacity-50' : ''}`}>
          {label && <span className="block text-sm font-medium text-brand-primary">{label}</span>}
          {description && <span id={`${switchId}-desc`} className="mt-1 block text-caption leading-relaxed text-brand-muted">{description}</span>}
        </label>
      )}
      <button id={switchId} type="button" role="switch" aria-checked={checked}
        aria-label={ariaLabel || label || 'Toggle switch'}
        aria-describedby={description ? `${switchId}-desc` : undefined}
        disabled={disabled} onClick={handleToggle}
        onKeyDown={(event) => {
          // Native buttons already synthesize keyboard clicks in browsers.
          if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); handleToggle(); }
        }}
        className="ui-tap-target ui-switch inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-50">
        <span aria-hidden="true" className={`relative h-6 w-11 rounded-full border transition-colors ${checked ? 'bg-brand-action border-brand-action' : 'bg-brand-elevated border-brand-muted'}`}>
          <span className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-[inset-inline-start] duration-150 ${checked ? 'start-[22px]' : 'start-0.5'}`} />
        </span>
      </button>
    </div>
  );
}
