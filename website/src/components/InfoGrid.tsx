import type { ReactNode } from "react";
import { Card } from "./ui/Card";

export type InfoItem = {
  title: string;
  body: string;
  marker?: ReactNode;
  note?: string;
};

/** Related explanations share a surface and reading rhythm, rather than a stack of oversized cards. */
export function InfoGrid({ items, ordered = false }: { items: readonly InfoItem[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <Card>
      <List className="info-grid" role="list">
        {items.map((item, i) => (
          <li key={item.title} className="info-item">
            <div className="info-item-heading">
              {item.marker ?? (ordered ? <span className="info-marker">0{i + 1}</span> : null)}
              <h3>{item.title}</h3>
            </div>
            <p className="text-body text-fg-muted">{item.body}</p>
            {item.note && <p className="text-caption font-medium">{item.note}</p>}
          </li>
        ))}
      </List>
    </Card>
  );
}
