import type { ComponentProps, ReactNode } from "react";
import type { IconName } from "@/icons";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { MetaLine } from "./MetaLine";

type DetailCardProps = Omit<ComponentProps<"div">, "title"> & {
  badge: string;
  icon?: IconName;
  tone?: "accent" | "neutral";
  /** Quiet qualifier opposite the badge; wraps below it when space runs out. */
  status?: string;
  /** A small visual opposite the badge, used instead of a status (for example a piece tile). */
  aside?: ReactNode;
  title: ReactNode;
  /** Short facts in the footer, "A · B" or a list. */
  meta?: string | ReactNode[];
  /** "wide" spans two of the three desktop columns. */
  span?: "single" | "wide";
};

/** One step, pillar or rule: badge and status, title, body, then a divided footer of short facts. */
export function DetailCard({ badge, icon, tone = "neutral", status, aside, title, meta, span = "single", className = "", children, ...props }: DetailCardProps) {
  return (
    <Card className={`detail-card ${className}`} data-span={span} {...props}>
      <div className="detail-card-meta">
        <Badge tone={tone} icon={icon}>{badge}</Badge>
        {status && <span className="detail-card-status">{status}</span>}
        {!status && aside}
      </div>
      <h3 className="detail-card-title">{title}</h3>
      <div className="detail-card-body">{children}</div>
      {meta && <MetaLine items={meta} className="detail-card-footer" />}
    </Card>
  );
}

/** One column on phones, two from 768px, three from 1024px where wide cards span two. */
export function DetailGrid({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`detail-grid ${className}`} {...props} />;
}
