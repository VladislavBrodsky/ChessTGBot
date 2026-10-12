'use client';

import React, { useState, useEffect } from 'react';
import { getFullPhotoUrl } from '@/lib/api';

export interface PlayerAvatarProps {
  userId?: number | null;
  fallbackText: string;
  isBot?: boolean;
  textClassName?: string;
}

export function PlayerAvatar({ userId, fallbackText, isBot, textClassName }: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [userId]);

  if (!userId || userId === -1 || hasError) {
    const cleanInitials = fallbackText && fallbackText !== '?' ? fallbackText.slice(0, 2).toUpperCase() : 'GM';
    return (
      <span className={textClassName || "text-sm font-bold tracking-tight text-brand-primary flex size-full items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20"}>
        {cleanInitials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- backend avatar endpoint; static export runs with images.unoptimized so next/image adds no benefit
    <img
      src={getFullPhotoUrl(`/api/v1/users/avatar/${userId}`)}
      alt=""
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}
