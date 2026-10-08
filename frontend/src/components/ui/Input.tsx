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
  'aria-describedby': describedBy,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full flex flex-col space-y-2 text-start">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-brand-primary"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div aria-hidden="true" className="absolute start-3.5 flex items-center justify-center text-brand-muted pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={[describedBy, error ? errorId : helperText ? helperId : undefined].filter(Boolean).join(' ') || undefined}
          className={`
            w-full rounded-xl bg-brand-elevated border text-base font-medium text-brand-primary placeholder:text-brand-muted transition-colors duration-150 outline-none
            ${leftIcon ? 'ps-11' : 'ps-4'}
            ${rightIcon ? 'pe-11' : 'pe-4'}
            py-3 min-h-12
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
          <div className="absolute end-3.5 flex items-center justify-center text-brand-muted">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-caption leading-relaxed text-brand-danger">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-caption leading-relaxed text-brand-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
