import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'amber' | 'emerald' | 'cyan' | 'rose';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ 
  variant = 'primary', 
  className = '', 
  children, 
  ...props 
}, ref) => {
  
  // Enforcing the typography hierarchy rule from the audit: 
  // Badges get the bold uppercase tracking-widest styling
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border';
  
  const variantClasses = {
    primary: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
    secondary: 'bg-brand-surface text-brand-muted border-brand-border-opacity-20',
    outline: 'bg-transparent text-brand-primary border-brand-primary/30',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };

  return (
    <span 
      ref={ref}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});
