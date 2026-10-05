'use client';

import React, { useState, useEffect } from 'react';
import { FaRobot } from 'react-icons/fa';
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

  if (isBot) {
    return <FaRobot className="text-xl text-brand-muted" />;
  }

  if (!userId || hasError) {
    return <span className={textClassName || "text-xl font-bold text-brand-muted"}>{fallbackText}</span>;
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
