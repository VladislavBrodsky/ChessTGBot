import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'amber' | 'emerald' | 'cyan' | 'rose' | 'purple';
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'default' | 'counter';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/** Passive metadata; interactive filters belong in Tabs, SegmentedControl or Button. */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ variant = 'secondary', size = 'default', icon, className = '', children, ...props }, ref) => (
  <span ref={ref} data-ui-badge className={`ui-badge ui-badge--${variant} ${size === 'counter' ? 'ui-badge--counter' : ''} ${className}`} {...props}>
    {icon && <span className="ui-badge-icon" aria-hidden="true">{icon}</span>}
    <span className="ui-badge-label">{children}</span>
  </span>
));
Badge.displayName = 'Badge';

export function BadgeRow({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-badge-row ${className}`} {...props} />;
}
