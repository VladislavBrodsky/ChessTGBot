'use client';

import type { ReactNode } from 'react';

type Tone = 'emerald' | 'gold' | 'purple' | 'cyan';

const TONE_STROKE: Record<Tone, string> = {
  emerald: 'var(--ring-emerald)',
  gold: 'var(--ring-gold)',
  purple: 'var(--ring-purple)',
  cyan: 'var(--ring-cyan)',
};

interface ProgressRingProps {
  /** 0–100 */
  percent: number;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label: string;
  children?: ReactNode;
  className?: string;
}

/** Accessible circular progress. The value must come from real data. */
export function ProgressRing({ percent, size = 64, stroke = 6, tone = 'emerald', label, children, className = '' }: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={TONE_STROKE[tone]} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - clamped / 100)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      {children !== undefined && <span className="absolute inset-0 flex items-center justify-center">{children}</span>}
    </div>
  );
}
