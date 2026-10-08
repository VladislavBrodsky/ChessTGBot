'use client';

import React from 'react';
import { twMerge } from 'tailwind-merge';
import { telegramHaptic } from '@/lib/telegram';

export type CardVariant = 'glass' | 'solid' | 'premium' | 'cyber' | 'x-panel';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ 
  variant = 'glass', 
  interactive = false,
  className = '', 
  children, 
  onClick,
  onKeyDown,
  ...props 
}, ref) => {
  
  const baseClasses = 'ui-card rounded-2xl overflow-hidden';
  
  const variantClasses = {
    glass: 'glass-panel',
    solid: 'bg-brand-surface border border-brand-border',
    premium: 'bg-brand-surface border border-purple-500/20 shadow-premium relative overflow-hidden',
    cyber: 'bg-cyber-card border border-brand-primary/20 shadow-neon',
    'x-panel': 'bg-brand-surface border border-brand-border shadow-sm transition-all',
  };

  const interactiveClasses = interactive 
    ? 'cursor-pointer transition-colors duration-150 hover:border-brand-muted/40'
    : '';

  return (
    <div 
      ref={ref}
      className={twMerge(baseClasses, variantClasses[variant], interactiveClasses, className)}
      role={interactive && onClick ? 'button' : undefined}
      tabIndex={interactive && onClick ? 0 : undefined}
      onClick={onClick ? (event) => { telegramHaptic('selection'); onClick(event); } : undefined}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented && interactive && onClick && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
