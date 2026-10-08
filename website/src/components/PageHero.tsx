import { Badge } from "@/components/ui/Badge";
import type { ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/icons";

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
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 text-caption text-fg-muted hover:text-fg"
          >
            <Icon name="arrow-left" size={16} />
            Back to home
          </Link>
          <Badge tone="accent">{eyebrow}</Badge>
          <h1 className="poster page-title">{title}</h1>
        </div>
        <div className="hero-details">
          <p className="max-w-[42ch] text-lead text-fg-muted">{lead}</p>
          {children}
        </div>
      </div>
      <div className="hero-visual min-w-0">{visual}</div>
    </section>
  );
}
