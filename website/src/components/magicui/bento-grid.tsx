"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/icons";
import { Card } from "@/components/ui/Card";

export interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

/** Local Magic UI adapter: natural rows and the shared marketing breakpoints. */
export function BentoGrid({ children, className = "" }: BentoGridProps) {
  return <div className={`marketing-bento ${className}`}>{children}</div>;
}

export interface BentoCardProps {
  name: string;
  className?: string;
  background?: ReactNode;
  icon?: IconName;
  description: string;
  href?: string;
  cta?: string;
  badge?: ReactNode;
  headerContent?: ReactNode;
  children?: ReactNode;
}

/** Artwork stays in flow; descriptions and actions remain visible on touch screens. */
export function BentoCard({ name, className = "", background, icon, description, href,
  cta = "Explore", badge, headerContent, children }: BentoCardProps) {
  const titleId = useId();
  return (
    <Card className={`reward-panel ${className}`} role="article" aria-labelledby={titleId}>
      <div className="reward-copy">
        {(badge || icon || headerContent) && <div className="feature-card-meta">
          {badge ?? (icon && <Icon name={icon} size={20} />)}
          {headerContent && <span className="feature-card-status">{headerContent}</span>}
        </div>}
        <div className="feature-card-text"><h3 id={titleId}>{name}</h3><p>{description}</p></div>
        {href && <Link href={href} className="feature-card-link">{cta}<Icon name="arrow-right" size={18} /></Link>}
      </div>
      {(background || children) && <div className="reward-demo">{background}{children}</div>}
    </Card>
  );
}
