import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'card':
        return 'rounded-2xl min-h-[100px] w-full';
      case 'rectangular':
        return 'rounded-xl';
      case 'text':
      default:
        return 'rounded-md h-4 w-full';
    }
  };

  const inlineStyles: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : {}),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-brand-elevated/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.06] before:to-transparent ${getVariantStyles()} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

export function SkeletonList({ count = 3, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-label="Loading content" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-brand-surface border border-brand-border">
          <Skeleton variant="circular" width={40} height={40} className="shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={14} />
            <Skeleton variant="text" width="40%" height={10} />
          </div>
          <Skeleton variant="rectangular" width={64} height={28} className="shrink-0" />
        </div>
      ))}
    </div>
  );
}
