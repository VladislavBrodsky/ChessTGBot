import { Card } from "./Card";
import { Icon, type IconName } from "@/icons";

export function FeatureList({ items }: { items: { icon: IconName; title: string; body: string; status?: string }[] }) {
  return (
    <Card className="feature-list">
      <ul>{items.map((item) => (
        <li key={item.title}>
          <span className="feature-list-icon"><Icon name={item.icon} size={20} /></span>
          <div className="feature-list-content">
            <h3>{item.title}</h3>
            {item.status && <span className="feature-list-status">{item.status}</span>}
            <p>{item.body}</p>
          </div>
        </li>
      ))}</ul>
    </Card>
  );
}
