/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";

export interface AvatarItem {
  imageUrl: string;
  profileUrl?: string;
  name?: string;
}

interface AvatarCirclesProps {
  numPeople?: number;
  avatarUrls: (string | AvatarItem)[];
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AvatarCircles({
  numPeople,
  avatarUrls,
  className = "",
  size = "md",
}: AvatarCirclesProps) {
  const sizeMap = {
    sm: "size-7 text-[10px]",
    md: "size-9 text-xs",
    lg: "size-11 text-sm",
  };

  return (
    <div
      className={`flex items-center -space-x-2.5 sm:-space-x-3 overflow-hidden ${className}`}
    >
      {avatarUrls.map((avatar, idx) => {
        const item: AvatarItem =
          typeof avatar === "string" ? { imageUrl: avatar } : avatar;
        const img = (
          <img
            src={item.imageUrl}
            alt={item.name || `Player ${idx + 1}`}
            width={40}
            height={40}
            className={`${sizeMap[size]} rounded-full border-2 border-canvas bg-surface object-cover shadow-none transition-transform duration-200 hover:scale-110 hover:z-20`}
          />
        );

        if (item.profileUrl) {
          return (
            <a
              key={idx}
              href={item.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              {img}
            </a>
          );
        }

        return (
          <span key={idx} className="inline-block">
            {img}
          </span>
        );
      })}

      {numPeople !== undefined && numPeople > 0 && (
        <div
          className={`flex ${sizeMap[size]} items-center justify-center rounded-full border-2 border-canvas bg-inset font-semibold text-fg shadow-none`}
        >
          +{numPeople >= 1000 ? `${(numPeople / 1000).toFixed(1)}k` : numPeople}
        </div>
      )}
    </div>
  );
}
