import type { CSSProperties, ReactNode } from 'react';

/**
 * Staggered entrance for page sections, in pure CSS (`.reveal-in` in
 * globals.css). It runs from the server-rendered HTML, so there is no hydration
 * flash, and the global reduced-motion rules collapse it to an instant paint.
 */
export function Stagger({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function RevealItem({ children, index = 0, className = '' }: { children: ReactNode; index?: number; className?: string }) {
  return (
    <div className={`reveal-in ${className}`} style={{ '--reveal-i': Math.min(index, 8) } as CSSProperties}>
      {children}
    </div>
  );
}
