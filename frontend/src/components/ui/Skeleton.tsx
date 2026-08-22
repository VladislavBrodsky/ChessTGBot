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

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-3xl bg-brand-surface border border-brand-border space-y-4 ${className}`} aria-label="Loading card" role="status">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 flex-1">
          <Skeleton variant="text" width="50%" height={16} />
          <Skeleton variant="text" width="30%" height={11} />
        </div>
        <Skeleton variant="rectangular" width={56} height={22} className="rounded-full" />
      </div>
      <Skeleton variant="text" width="90%" height={12} />
      <Skeleton variant="text" width="70%" height={12} />
      <div className="pt-2">
        <Skeleton variant="rectangular" width="100%" height={40} className="rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4, columns = 2, className = '' }: { count?: number; columns?: 2 | 3 | 4; className?: string }) {
  const colClass = columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2';
  return (
    <div className={`grid ${colClass} gap-3 ${className}`} aria-label="Loading grid" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-2xl bg-brand-surface border border-brand-border space-y-3">
          <Skeleton variant="rectangular" width="100%" height={110} className="rounded-xl" />
          <Skeleton variant="text" width="70%" height={14} />
          <Skeleton variant="text" width="45%" height={10} />
          <div className="flex items-center justify-between pt-1">
            <Skeleton variant="text" width={50} height={12} />
            <Skeleton variant="rectangular" width={60} height={26} className="rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileCard({ className = '' }: { className?: string }) {
  return (
    <div className={`p-5 rounded-3xl bg-brand-surface border border-brand-border space-y-4 ${className}`} aria-label="Loading profile" role="status">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="space-y-1.5">
            <Skeleton variant="text" width={100} height={16} />
            <Skeleton variant="text" width={60} height={11} />
          </div>
        </div>
        <Skeleton variant="rectangular" width={65} height={24} className="rounded-full" />
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Skeleton variant="text" width={40} height={10} />
          <Skeleton variant="text" width={30} height={10} />
        </div>
        <Skeleton variant="rectangular" width="100%" height={6} className="rounded-full" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-brand-border text-center pt-2">
        <div className="flex flex-col items-center gap-1">
          <Skeleton variant="text" width={36} height={10} />
          <Skeleton variant="text" width={28} height={14} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton variant="text" width={36} height={10} />
          <Skeleton variant="text" width={28} height={14} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <Skeleton variant="text" width={36} height={10} />
          <Skeleton variant="text" width={28} height={14} />
        </div>
      </div>
    </div>
  );
}
