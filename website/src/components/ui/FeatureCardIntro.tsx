import Link from "next/link";
import { Badge } from "./Badge";
import { Icon, type IconName } from "@/icons";

export function FeatureCardIntro({ id, label, status, icon, title, body, href, action, neutral = false }: {
  id: string; label: string; status: string; icon: IconName; title: string; body: string; href: string; action: string; neutral?: boolean;
}) {
  return (
    <div className="reward-copy">
      <div className="feature-card-meta">
        <Badge tone={neutral ? "neutral" : "accent"} icon={icon}>{label}</Badge>
        <span className="feature-card-status">{status}</span>
      </div>
      <div className="feature-card-text">
        <h3 id={id}>{title}</h3>
        <p>{body}</p>
      </div>
      <Link href={href} className="feature-card-link">{action}<Icon name="arrow-right" size={18} /></Link>
    </div>
  );
}
