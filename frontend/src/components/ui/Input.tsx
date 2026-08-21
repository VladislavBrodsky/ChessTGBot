'use client';

import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-muted"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center justify-center text-brand-muted pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full rounded-xl bg-brand-surface border text-xs font-bold text-brand-primary placeholder:text-brand-muted/40 transition-all duration-200 outline-none
            ${leftIcon ? 'pl-10' : 'pl-3.5'}
            ${rightIcon ? 'pr-10' : 'pr-3.5'}
            py-3 min-h-[44px]
            ${error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
              : 'border-brand-border focus:border-brand-primary/50 focus:ring-2 focus:ring-brand-primary/10 hover:border-brand-border-opacity-30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed bg-brand-elevated' : 'cursor-text'}
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 flex items-center justify-center text-brand-muted">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[10px] font-bold text-red-400">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[10px] font-medium text-brand-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
