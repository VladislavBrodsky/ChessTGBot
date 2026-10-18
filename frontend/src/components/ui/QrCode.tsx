'use client';

import React, { useMemo } from 'react';
import { generateQrMatrix, matrixToSvgPath } from '@/lib/qrcode';

export interface QrCodeProps {
  value: string;
  size?: number | string;
  className?: string;
  quietZone?: number;
  alt?: string;
  fgColor?: string;
  bgColor?: string;
}

export function QrCode({
  value,
  size = 220,
  className = '',
  quietZone = 2,
  alt = 'QR Code',
  fgColor = 'black',
  bgColor = 'white',
}: QrCodeProps) {
  const { path, totalSize } = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { path: '', totalSize: 25 };
    }
    try {
      const { matrix } = generateQrMatrix(value);
      return matrixToSvgPath(matrix, quietZone);
    } catch (err) {
      console.warn('QR code generation fallback error:', err);
      return { path: '', totalSize: 25 };
    }
  }, [value, quietZone]);

  if (!path) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-2xl bg-brand-surface border border-brand-border text-caption text-brand-muted ${className}`}
        role="img"
        aria-label={alt}
      >
        —
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={alt}
      className={`block max-w-full ${className}`}
      shapeRendering="crispEdges"
    >
      <rect width={totalSize} height={totalSize} fill={bgColor} rx={2} />
      <path d={path} fill={fgColor} />
    </svg>
  );
}

export default QrCode;
