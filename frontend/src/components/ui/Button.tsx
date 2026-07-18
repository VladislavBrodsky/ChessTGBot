import React, { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'action' | 'premium' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
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
  ...props
}, ref) => {
  
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Mobile-friendly sizes (ensuring at least 44px height for touch targets on md/lg)
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px] rounded-lg',
    md: 'text-sm px-4 py-2 min-h-[44px] rounded-xl',
    lg: 'text-base px-6 py-3 min-h-[50px] rounded-2xl',
  };

  const variantClasses = {
    primary: 'bg-brand-primary text-brand-void hover:bg-opacity-90',
    secondary: 'bg-brand-surface text-brand-primary hover:bg-brand-elevated border border-brand-border-opacity-10',
    glass: 'glass-button', // uses the CSS class
    action: 'action-button', // uses the CSS class
    solid: 'bg-brand-surface border border-brand-border-opacity-10 shadow-sm text-brand-primary hover:bg-brand-surface/80',
    premium: 'bg-purple-500 text-white hover:bg-purple-600 shadow-premium',
    cyber: 'bg-cyber-card border border-brand-primary/20 text-brand-primary shadow-[0_0_15px_rgba(var(--color-brand-primary),0.1)] hover:shadow-[0_0_20px_rgba(var(--color-brand-primary),0.2)] hover:-translate-y-[1px]',
    outline: 'bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary/10',
  };

  return (
    <button
      ref={ref}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {!isLoading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </button>
  );
});
