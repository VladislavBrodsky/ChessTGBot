import React from 'react';

export type CardVariant = 'glass' | 'solid' | 'premium' | 'cyber';

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
  ...props 
}, ref) => {
  
  const baseClasses = 'rounded-2xl overflow-hidden';
  
  const variantClasses = {
    glass: 'glass-panel',
    solid: 'bg-brand-surface border border-brand-border-opacity-10 shadow-sm',
    premium: 'premium-liquid-content border border-transparent shadow-premium',
    cyber: 'bg-cyber-card border border-brand-primary/20 shadow-neon',
  };

  const interactiveClasses = interactive 
    ? 'cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md'
    : '';

  if (variant === 'premium') {
    return (
      <div className={`premium-liquid-border ${interactive ? 'cursor-pointer' : ''} ${className}`}>
        <div 
          ref={ref}
          className={`${baseClasses} ${variantClasses[variant]}`}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
