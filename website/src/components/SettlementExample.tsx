import { Icon } from "@/icons";
import { winnerReceives } from "@/lib/config";

const stake = 25;
const pot = stake * 2;

/** Illustrative settlement math, not player activity or a transaction record. */
export function SettlementExample() {
  return (
    <div className="settlement-feed">
      <div className="settlement-status">
        <div className="settlement-status-heading">
          <span className="settlement-status-title">Example match settlement</span>
        </div>
        <div className="settlement-status-details">
          <span>Illustration only</span>
          <span>95% winner share</span>
        </div>
      </div>
      <div className="settlement-list">
        {[
          { label: "Each player stakes", value: `${stake} USDT`, icon: "coins" as const },
          { label: "Combined pot", value: `${pot} USDT`, icon: "sword" as const },
          { label: "Winner receives in app balance", value: `${winnerReceives(stake).toFixed(2)} USDT`, icon: "trophy" as const },
        ].map((item) => (
          <div key={item.label} className="settlement-row">
            <span className="settlement-icon"><Icon name={item.icon} size={16} /></span>
            <div className="settlement-player"><span>{item.label}</span></div>
            <div className="settlement-amount"><strong>{item.value}</strong></div>
          </div>
        ))}
      </div>
    </div>
  );
}
