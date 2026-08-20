import React, { ButtonHTMLAttributes } from 'react';
import { telegramHaptic } from '@/lib/telegram';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'action' | 'premium' | 'outline' | 'solid' | 'cyber' | 'destructive';
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
  ...props
}, ref) => {
  
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-white';
  
  // Mobile-friendly sizes (ensuring at least 44px height for touch targets on md/lg)
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] rounded-lg',
    md: 'text-sm px-4 py-2.5 min-h-[44px] rounded-xl',
    lg: 'text-base px-6 py-3 min-h-[50px] rounded-2xl',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-brand-primary text-brand-void hover:bg-white/90 active:bg-white/80 shadow-md',
    secondary: 'bg-brand-surface text-brand-primary hover:bg-brand-elevated border border-brand-border',
    glass: 'glass-button',
    action: 'action-button',
    solid: 'bg-brand-surface border border-brand-border shadow-sm text-brand-primary hover:bg-brand-elevated',
    premium: 'bg-purple-600 text-white hover:bg-purple-500 active:bg-purple-700 shadow-premium',
    cyber: 'bg-cyber-card border border-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-[1px]',
    outline: 'bg-transparent border border-brand-border text-brand-primary hover:bg-brand-elevated',
    destructive: 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 active:bg-rose-500/30',
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
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="mr-2 shrink-0">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2 shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
