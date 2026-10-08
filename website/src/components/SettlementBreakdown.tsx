import { SETTLEMENT } from "@/lib/config";
import { Card } from "./ui/Card";

const parts = [
  { percent: SETTLEMENT.winnerPercent, name: "Winner’s balance", body: "Includes the winner’s original stake. Credited after a decided match." },
  { percent: SETTLEMENT.platformFeePercent, name: "Platform fee", body: "Separate from any deposit or withdrawal fee shown in the app." },
  { percent: SETTLEMENT.referralFeePercent, name: "Referral pool", body: "Eligibility follows the referral program rules." },
];

export function SettlementBreakdown() {
  return (
    <Card>
      <p className="mb-4 text-caption text-fg-muted">How the combined pot is allocated</p>
      <div className="settlement-bar" aria-hidden="true">
        {parts.map((part, i) => <span key={part.name} data-part={i} style={{ flexGrow: part.percent }} />)}
      </div>
      <dl className="settlement-grid">
        {parts.map((part) => (
          <div className="settlement-item" key={part.name}>
            <dt className="text-title">{part.name}</dt>
            <dd className="settlement-value poster text-stat">{part.percent}%</dd>
            <dd className="text-caption text-fg-muted">{part.body}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
