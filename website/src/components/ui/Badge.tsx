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

export function BadgeRow({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`badge-row ${className}`} {...props} />;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`eyebrow ${className}`}>{children}</span>;
}
