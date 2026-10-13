import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "@/icons";

type BadgeProps = Omit<ComponentProps<"span">, "onClick"> & {
  tone?: "neutral" | "accent" | "outline";
  icon?: IconName;
};

/** Static metadata. Actions and filters keep the shared Button hit area. */
export function Badge({ tone = "neutral", icon, className = "", children, ...props }: BadgeProps) {
  return (
    <span className={`site-badge ${className}`} data-badge data-tone={tone} {...props}>
      {icon && <Icon name={icon} size={16} className="site-badge-icon" />}
      <span className="site-badge-label">{children}</span>
    </span>
  );
}

/** A short product label with separate, readable qualifiers; copy stays verbatim. */
export function HeroContext({ children, ...props }: BadgeProps & { children: string }) {
  const [primary, ...details] = children.split(" · ");
  if (details.length === 0) return <Badge {...props}>{children}</Badge>;
  return (
    <div className="hero-context">
      <Badge {...props}>{primary}</Badge>
      <span className="hero-context-divider" aria-hidden="true"> · </span>
      <span className="hero-context-details">{details.join(" · ")}</span>
    </div>
  );
}

export function BadgeRow({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`badge-row ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}
