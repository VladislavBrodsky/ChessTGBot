'use client';

import React, { ButtonHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { telegramHaptic } from '@/lib/telegram';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'action' | 'premium' | 'outline' | 'solid' | 'cyber' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  enableHaptic?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'glass',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  disabled,
  enableHaptic = true,
  onClick,
  type = 'button',
  ...props
}, ref) => {
  
  const baseClasses = 'ui-button inline-flex min-w-11 items-center justify-center gap-2 font-semibold leading-snug transition-colors duration-150 select-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  // Mobile-friendly sizes (ensuring at least 44px height for touch targets on md/lg)
  const sizeClasses = {
    sm: 'text-sm px-3 py-2 min-h-11 rounded-xl',
    md: 'text-sm px-4 py-3 min-h-12 rounded-xl',
    lg: 'text-base px-6 py-3.5 min-h-[52px] rounded-2xl',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'action-button',
    secondary: 'bg-brand-surface text-brand-primary hover:bg-brand-elevated border border-brand-border',
    glass: 'glass-button',
    action: 'action-button',
    solid: 'bg-brand-surface border border-brand-border shadow-sm text-brand-primary hover:bg-brand-elevated',
    premium: 'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 shadow-premium',
    cyber: 'bg-cyber-card border border-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-[1px]',
    outline: 'bg-transparent border border-brand-border text-brand-primary hover:bg-brand-elevated',
    destructive: 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30',
    ghost: 'bg-transparent text-brand-muted hover:bg-brand-elevated hover:text-brand-primary',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableHaptic && !disabled && !isLoading) {
      telegramHaptic('light');
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      className={twMerge(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <svg aria-hidden="true" className="animate-spin h-4 w-4 shrink-0 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span aria-hidden="true" className="shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span aria-hidden="true" className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
