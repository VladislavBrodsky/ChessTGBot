'use client';

import React from 'react';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  badge?: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

const dotSizeClasses = {
  xs: 'w-1.5 h-1.5 bottom-0 right-0',
  sm: 'w-2 h-2 bottom-0 right-0',
  md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
  lg: 'w-3 h-3 bottom-0.5 right-0.5',
  xl: 'w-3.5 h-3.5 bottom-1 right-1',
};

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  badge,
  className = '',
}: AvatarProps) {
  const getInitials = (n?: string | null) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]}
          rounded-2xl bg-brand-elevated border border-brand-border flex items-center justify-center font-bold text-brand-primary overflow-hidden shadow-sm select-none
        `}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {isOnline && (
        <span
          className={`
            absolute ${dotSizeClasses[size]} rounded-full bg-emerald-500 border-2 border-brand-void shadow-[0_0_8px_rgba(16,185,129,0.8)]
          `}
          aria-label="Online"
        />
      )}

      {badge && (
        <div className="absolute -top-1.5 -right-1.5 pointer-events-none">
          {badge}
        </div>
      )}
    </div>
  );
}
