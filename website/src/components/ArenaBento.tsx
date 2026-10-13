import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";

const features = [
  {
    label: "Free practice",
    title: "Play the AI at your pace",
    body: "Pick a difficulty and finish a game without a deposit. Your first three qualifying AI games unlock one free in-app mystery box.",
    href: "/play",
    action: "Start free practice",
  },
  {
    label: "Progression",
    title: "Make each game count",
    body: "Build XP, study the Academy, and use challenges to choose a clear next step. The first-three box shows its reward odds before you join.",
    href: "/academy",
    action: "Explore the Academy",
  },
  {
    label: "Optional stakes",
    title: "Review the pot before you play",
    body: "Player matches with USDT stakes are optional. Equal stakes form a pot; the winner receives 95% of it in their in-app balance.",
    href: "/wagers",
    action: "Read stakes and fees",
  },
];

export function ArenaBento() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title} className="flex flex-col p-6">
          <Badge tone="neutral">{feature.label}</Badge>
          <h3 className="mt-5 text-heading-sm font-medium text-fg-default">{feature.title}</h3>
          <p className="mt-3 flex-1 text-body text-fg-muted">{feature.body}</p>
          <Link href={feature.href} className="mt-6 inline-flex min-h-11 items-center gap-2 text-label font-semibold text-fg-default underline underline-offset-4">
            {feature.action} <Icon name="arrow-right" size={16} />
          </Link>
        </Card>
      ))}
    </div>
  );
}
