import { SETTLEMENT } from "@/lib/config";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Icon } from "@/icons";

const parts = [
  {
    percent: SETTLEMENT.winnerPercent,
    name: "Winner’s payout",
    tag: "Instant Credit",
    tagColor: "text-fg bg-inset border-line",
    badgeStyle: "border-line bg-inset text-fg",
    barColor: "bg-inset",
    body: "95% of the total pot deposits straight to your balance the moment checkmate, resignation, or clock flag is verified.",
  },
  {
    percent: SETTLEMENT.platformFeePercent,
    name: "Platform infrastructure",
    tag: "Cloud Matchmaking",
    tagColor: "text-fg-muted bg-fg-muted/10 border-line/20",
    badgeStyle: "border-line/30 bg-fg-muted/10 text-fg-muted",
    barColor: "bg-fg-muted",
    body: "3% platform fee covers move validation servers, real-time WebSocket matchmaking, and cloud hosting infrastructure.",
  },
  {
    percent: SETTLEMENT.referralFeePercent,
    name: "Referral community pool",
    tag: "6-Tier Network",
    tagColor: "text-fg bg-inset border-line",
    badgeStyle: "border-line bg-inset text-fg",
    barColor: "bg-inset",
    body: "2% of every pot distributes to the player’s affiliate network across 6 tiers in lifetime passive rewards.",
  },
];

export function SettlementBreakdown() {
  return (
    <Card className="flex flex-col justify-between p-6 sm:p-7 bg-surface border border-line rounded-2xl relative overflow-hidden h-full">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone="neutral" icon="scales">
            Pot Allocation Architecture
          </Badge>
          <span className="font-mono text-caption font-semibold text-fg-muted bg-inset border border-line px-2.5 py-0.5 rounded-full">
            Decided Matches
          </span>
        </div>

        <div>
          <h3 className="text-heading-sm font-medium tracking-tight mb-1">
            Where every dollar goes
          </h3>
          <p className="text-body-sm text-fg-muted">
            Zero hidden deductions. Every decided match follows transparent, automated pot distribution rules
          </p>
        </div>

        {/* Visual Allocation Proportion Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-caption font-mono text-fg-muted">
            <span>Combined Pot Distribution</span>
            <span className="text-fg font-semibold">100% Accounted</span>
          </div>
          <div
            className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-inset p-0.5 border border-line"
            aria-hidden="true"
          >
            {parts.map((part) => (
              <span
                key={part.name}
                className={`${part.barColor} rounded-full transition-all`}
                style={{ width: `${part.percent}%` }}
              />
            ))}
          </div>
        </div>

        {/* 3 Allocation Modules */}
        <div className="space-y-3 pt-2">
          {parts.map((part) => (
            <div
              key={part.name}
              className="flex items-start gap-3.5 p-3.5 rounded-xl bg-inset/40 border border-line/60 transition-colors hover:bg-inset/70"
            >
              <div
                className={`shrink-0 flex items-center justify-center size-10 rounded-lg border font-mono font-bold text-base ${part.badgeStyle}`}
              >
                {part.percent}%
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <h4 className="text-body font-medium text-fg">{part.name}</h4>
                  <span
                    className={`font-mono text-caption font-semibold px-2 py-0.5 rounded-full border ${part.tagColor}`}
                  >
                    {part.tag}
                  </span>
                </div>
                <p className="text-caption text-fg-muted leading-relaxed">
                  {part.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="mt-5 pt-3.5 border-t border-line flex flex-wrap gap-2 items-center justify-between text-caption font-mono text-fg-muted">
        <span className="flex items-center gap-1.5 text-fg font-semibold">
          <Icon name="shield-check" size={14} />
          Automated match escrow
        </span>
        <span className="text-fg font-semibold">Platform balance payout</span>
      </div>
    </Card>
  );
}

