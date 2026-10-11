"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/icons";

export interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return (
    <div
      className={`grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}
    >
      {children}
    </div>
  );
}

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  icon?: string;
  description: string;
  href?: string;
  cta?: string;
  badge?: ReactNode;
  headerContent?: ReactNode;
  children?: ReactNode;
}

export function BentoCard({
  name,
  className = "",
  background,
  icon,
  description,
  href,
  cta = "Explore",
  badge,
  headerContent,
  children,
}: BentoCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-6 transition-all duration-300 hover:border-fg-muted/40 hover:shadow-md ${className}`}
    >
      {/* Background visual element */}
      {background && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {background}
        </div>
      )}

      {/* Top Header / Badge */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-2">
        {badge ? (
          <div>{badge}</div>
        ) : icon ? (
          <div className="flex size-10 items-center justify-center rounded-xl bg-inset border border-line text-fg-default shadow-xs transition-transform duration-300 group-hover:scale-105">
            <Icon name={icon as IconName} size={20} />
          </div>
        ) : <div />}
        {headerContent}
      </div>

      {/* Custom Body / Children if provided */}
      {children && <div className="relative z-10 my-auto">{children}</div>}

      {/* Card Content & Title */}
      <div className="relative z-10 mt-auto pt-3">
        <h3 className="text-heading-sm font-medium tracking-tight text-fg-default mb-1.5 transition-colors">
          {name}
        </h3>
        <p className="text-body-sm text-fg-muted line-clamp-2 mb-3">
          {description}
        </p>

        {href && (
          <div className="pt-1">
            {href.startsWith("#") ? (
              <a
                href={href}
                className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>{cta}</span>
                <Icon name="arrow-right" size={14} className="transition-transform group-hover:translate-x-1" />
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex items-center gap-1.5 font-mono text-caption font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <span>{cta}</span>
                <Icon name="arrow-right" size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Subtle hover gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />
    </div>
  );
}
