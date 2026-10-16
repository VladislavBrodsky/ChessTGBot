import { Card } from "./Card";
import { Icon, type IconName } from "@/icons";
import { MetaLine } from "./MetaLine";

export function FeatureList({ items }: { items: { icon: IconName; title: string; body: string; status?: string }[] }) {
  return (
    <Card className="feature-list">
      <ul>{items.map((item) => (
        <li key={item.title}>
          <span className="feature-list-icon"><Icon name={item.icon} size={20} /></span>
          <div className="feature-list-content">
            <h3>{item.title}</h3>
            {item.status && <MetaLine className="feature-list-status" items={item.status} />}
            <p>{item.body}</p>
          </div>
        </li>
      ))}</ul>
    </Card>
  );
}
