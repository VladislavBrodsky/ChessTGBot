import React from 'react';

/**
 * Skeleton system.
 *
 * Rule: a skeleton must occupy the SAME box as the content it stands in for, so nothing moves when data
 * arrives (layout shift is measured in e2e/layout-shift.spec.ts). To guarantee that, composite skeletons
 * reuse the real recipe classes (.ui-hero-card, .ui-list-row, .ui-stat, .goal-tile, .podium) and take their
 * line heights from the type roles instead of guessing pixel values.
 */

type TypeRole = 'display' | 'title-1' | 'title-2' | 'title-3' | 'body-lg' | 'body' | 'label' | 'caption' | 'eyebrow' | 'numeric-lg' | 'numeric' | 'numeric-sm';

/** Height of one line of text in a role: font-size x line-height, from the same tokens the text uses. */
const lineHeight = (role: TypeRole) => `calc(var(--type-${role}-size) * var(--type-${role}-leading))`;

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  /** For `text`: take the line height from a type role (default `body`). */
  textRole?: TypeRole;
  className?: string;
}

export function Skeleton({ variant = 'text', width, height, textRole = 'body', className = '', style, ...props }: SkeletonProps) {
  const shape = variant === 'circular' ? 'skeleton--circle' : variant === 'text' ? 'skeleton--text' : variant === 'card' ? 'skeleton--card' : '';
  const css: React.CSSProperties = {
    ...(width !== undefined ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === 'number' ? `${height}px` : height } : variant === 'text' ? { height: lineHeight(textRole) } : {}),
    ...style,
  };
  return <div aria-hidden="true" className={`skeleton ${shape} ${className}`} style={css} {...props} />;
}

/** Paragraph placeholder; line count and widths are fixed so the block is stable. */
export function SkeletonText({ lines = 3, textRole = 'body', className = '' }: { lines?: number; textRole?: TypeRole; className?: string }) {
  const widths = ['100%', '92%', '64%', '80%'];
  return (
    <div className={`flex flex-col gap-1.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <Skeleton key={i} textRole={textRole} width={i === lines - 1 ? '64%' : widths[i % widths.length]} />)}
    </div>
  );
}

/** Wrapper that announces loading once and hides the placeholder shapes from assistive tech. */
function Busy({ label = 'Loading', className = '', children }: { label?: string; className?: string; children: React.ReactNode }) {
  return <div role="status" aria-busy="true" aria-label={label} className={className}>{children}</div>;
}

/** Mirrors `.ui-list-row`: 40px tile, title + meta lines, trailing control. */
export function ListRowSkeleton() {
  return (
    <div className="ui-list-row" aria-hidden="true">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <Skeleton variant="rectangular" className="size-tile-md shrink-0 rounded-tile" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton textRole="body" width="55%" />
          <Skeleton textRole="caption" width="35%" />
        </div>
      </div>
      <Skeleton variant="rectangular" width={56} height={26} className="shrink-0 rounded-chip" />
    </div>
  );
}

export function SkeletonList({ count = 3, className = '', label }: { count?: number; className?: string; label?: string }) {
  return (
    <Busy label={label} className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: count }, (_, i) => <ListRowSkeleton key={i} />)}
    </Busy>
  );
}

/** Mirrors `.ui-stat`: eyebrow label + numeric value + meta line. */
export function StatTileSkeleton({ metaLines = 1 }: { metaLines?: number }) {
  return (
    <div className="ui-stat" aria-hidden="true">
      <Skeleton textRole="eyebrow" width="45%" />
      <Skeleton textRole="numeric-lg" width="60%" />
      {Array.from({ length: metaLines }, (_, i) => <Skeleton key={i} textRole="caption" width={i === metaLines - 1 ? '70%' : '95%'} />)}
    </div>
  );
}

/** Mirrors the profile W-D-L breakdown card: header, 10px bar, three label/value/percent columns. */
export function BreakdownSkeleton() {
  return (
    <div className="w-full space-y-3.5 rounded-2xl border border-brand-border bg-brand-surface p-4" aria-hidden="true">
      <div className="flex items-center justify-between px-0.5"><Skeleton height={18} width={110} /><Skeleton height={18} width={56} /></div>
      <Skeleton variant="rectangular" width="100%" height={10} className="rounded-full" />
      <div className="grid grid-cols-3 gap-2 pt-0.5 text-center">
        {[0, 1, 2].map(i => (
          <div key={i} className={`flex flex-col items-center gap-0.5 ${i === 1 ? 'border-x border-brand-border-opacity-10' : ''}`}>
            <Skeleton height={18} width={44} /><Skeleton height={20} width={28} className="mt-0.5" /><Skeleton height={18} width={36} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 4, columns = 2, className = '', label }: { count?: number; columns?: 2 | 3 | 4; className?: string; label?: string }) {
  const cols = columns === 4 ? 'grid-cols-2 sm:grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <Busy label={label} className={`grid ${cols} gap-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => <StatTileSkeleton key={i} />)}
    </Busy>
  );
}

/** Mirrors `.goal-tile`: 60px ring, two title lines, one meta line. */
export function GoalTilesSkeleton({ count = 3, label }: { count?: number; label?: string }) {
  return (
    <Busy label={label} className="grid grid-cols-[repeat(auto-fit,minmax(104px,1fr))] gap-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="goal-tile" style={{ minHeight: 'var(--size-goal-tile-min)' }} aria-hidden="true">
          <Skeleton variant="circular" width={60} height={60} />
          <SkeletonText lines={2} textRole="caption" className="w-full" />
          <Skeleton textRole="caption" width="40%" />
        </div>
      ))}
    </Busy>
  );
}

/** Mirrors the home/profile `.ui-hero-card`: identity row, XP track, three figures. */
export function HeroCardSkeleton({ label }: { label?: string }) {
  return (
    <Busy label={label} className="ui-hero-card space-y-5 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <Skeleton variant="rectangular" className="size-avatar-lg rounded-2xl" width={52} height={52} />
          <div className="flex flex-col gap-2"><Skeleton textRole="numeric-lg" width={120} /><Skeleton textRole="caption" width={72} /></div>
        </div>
        <Skeleton variant="rectangular" width={92} height="var(--size-control-sm)" className="rounded-control" />
      </div>
      <div className="flex flex-col gap-2"><div className="flex justify-between"><Skeleton textRole="label" width={64} /><Skeleton textRole="caption" width={96} /></div><Skeleton variant="rectangular" height="var(--size-track-lg)" className="rounded-full" /></div>
      <div className="grid grid-cols-3 gap-3 border-t border-brand-border pt-4">
        {[0, 1, 2].map(i => <div key={i} className="flex flex-col gap-1.5"><Skeleton textRole="eyebrow" width="70%" /><Skeleton textRole="numeric" width="50%" /></div>)}
      </div>
    </Busy>
  );
}

/** Mirrors the leaderboard podium + two rows. */
export function PodiumSkeleton({ label }: { label?: string }) {
  return (
    <Busy label={label}>
      <div className="podium" aria-hidden="true">
        {[2, 1, 3].map((rank) => (
          <div key={rank} className="podium__slot">
            <Skeleton variant="circular" width={rank === 1 ? 64 : 48} height={rank === 1 ? 64 : 48} />
            <Skeleton textRole="caption" width="70%" />
            <Skeleton textRole="caption" width="50%" />
            <div className={`podium__step podium__step--${rank}`} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 p-3"><ListRowSkeleton /><ListRowSkeleton /></div>
    </Busy>
  );
}

/** Page-level placeholder: header + the first sections, using the same page shell. */
export function PageSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Busy label={label} className="app-page">
      <div className="page-header" aria-hidden="true"><div className="flex-1 space-y-2"><Skeleton textRole="eyebrow" width={96} /><Skeleton textRole="title-1" width="60%" /></div></div>
      <HeroCardSkeleton />
      <SkeletonList count={rows} />
    </Busy>
  );
}

/** Kept for existing call sites. */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return <Busy className={`ui-stat gap-3 ${className}`}><Skeleton textRole="title-3" width="50%" /><SkeletonText lines={2} /><Skeleton variant="rectangular" height="var(--size-control-sm)" className="rounded-control" /></Busy>;
}
export function SkeletonProfileCard({ className = '' }: { className?: string }) {
  return <HeroCardSkeletonWrapper className={className} />;
}
function HeroCardSkeletonWrapper({ className }: { className: string }) {
  return <div className={className}><HeroCardSkeleton /></div>;
}
