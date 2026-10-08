import { Badge } from "@/components/ui/Badge";
import type { ReactNode } from "react";

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  visual,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: string;
  children?: ReactNode;
  visual: ReactNode;
}) {
  return (
    <section className="page-hero">
      <div className="page-hero-copy min-w-0 flex-col items-start gap-5">
        <div className="hero-intro">
          <Badge tone="accent">{eyebrow}</Badge>
          <h1 className="poster page-title">{title}</h1>
          <p className="hero-lead max-w-[42ch] text-fg-muted">{lead}</p>
        </div>
        <div className="hero-details page-hero-details">
          {children}
        </div>
      </div>
      <div className="hero-visual min-w-0">{visual}</div>
    </section>
  );
}
