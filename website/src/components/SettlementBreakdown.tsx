import { SETTLEMENT } from "@/lib/config";
import { Card } from "./ui/Card";
import { Icon } from "@/icons";

const parts = [
  {
    percent: SETTLEMENT.winnerPercent,
    name: "Winner’s payout",
    tag: "Instant Credit",
    tagColor: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
    color: "bg-emerald-500",
    body: "95% of the total pot deposits straight to your balance the moment checkmate or clock flag is verified.",
  },
  {
    percent: SETTLEMENT.platformFeePercent,
    name: "Platform infrastructure",
    tag: "FIDE Engines & Nodes",
    tagColor: "text-slate-600 bg-slate-500/10 border-slate-500/20",
    color: "bg-slate-400",
    body: "3% platform fee covers Stockfish 16 cloud compute, neural anti-cheat radar, and sub-25ms WebSocket matchmaking.",
  },
  {
    percent: SETTLEMENT.referralFeePercent,
    name: "Referral community pool",
    tag: "6-Tier Affiliates",
    tagColor: "text-blue-600 bg-blue-500/10 border-blue-500/20",
    color: "bg-blue-500",
    body: "2% of every pot distributes to the player’s affiliate network across 6 tiers in lifetime passive rewards.",
  },
];

export function SettlementBreakdown() {
  return (
    <Card className="p-6 bg-surface border border-line rounded-2xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="text-caption text-fg-muted font-mono">How the combined pot is allocated</p>
        <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Transparent Split
        </span>
      </div>

      <div className="flex h-2.5 w-full gap-1 overflow-hidden rounded-full bg-inset p-0.5 border border-line" aria-hidden="true">
        {parts.map((part) => (
          <span
            key={part.name}
            className={`${part.color} rounded-full transition-all`}
            style={{ width: `${part.percent}%` }}
          />
        ))}
      </div>

      <dl className="settlement-grid mt-6 space-y-4">
        {parts.map((part) => (
          <div className="settlement-item border-b border-line pb-4 last:border-b-0 last:pb-0" key={part.name}>
            <div className="flex items-center justify-between col-span-2 mb-1">
              <dt className="text-title font-medium">{part.name}</dt>
              <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border ${part.tagColor}`}>
                {part.tag}
              </span>
            </div>
            <dd className="settlement-value poster text-stat font-bold text-fg-default">{part.percent}%</dd>
            <dd className="text-caption text-fg-muted leading-relaxed">{part.body}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 pt-3.5 border-t border-line flex items-center justify-between text-caption font-mono text-fg-muted">
        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <Icon name="shield-check" size={14} />
          Smart escrow audited
        </span>
        <span className="text-fg-default">Zero platform custody hold</span>
      </div>
    </Card>
  );
}
