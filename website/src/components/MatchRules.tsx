import { Icon, type IconName } from "@/icons";
import { MATCH_RULES, SETTLEMENT, winnerReceives } from "@/lib/config";
import { Card } from "./ui/Card";

const minutes = MATCH_RULES.clockMinutes;
const exampleStake = 5;
const feePercent = SETTLEMENT.platformFeePercent + SETTLEMENT.referralFeePercent;

const rules: { icon: IconName; label: string; value: string; note: string }[] = [
  {
    icon: "clock",
    label: "Clock",
    value: `${minutes[0]}–${minutes[minutes.length - 1]} min per side`,
    note: `Choose ${new Intl.ListFormat("en", { type: "disjunction" }).format(minutes.map(String))} minutes. There is no increment, and your clock only runs on your move.`,
  },
  {
    icon: "coins",
    label: "Stake",
    value: `Free, or from ${MATCH_RULES.minStakeUsdt} USDT`,
    note: "You are paired with a player on the same stake. Lose the game and you lose your stake.",
  },
  {
    icon: "trophy",
    label: "Win",
    value: `${SETTLEMENT.winnerPercent}% of the pot`,
    note: `A ${exampleStake} USDT match credits the winner ${winnerReceives(exampleStake).toFixed(2)} USDT, their stake included. The other ${feePercent}% covers platform and referral fees.`,
  },
  {
    icon: "scales",
    label: "Draw",
    value: "Both stakes returned",
    note: "Stalemate, an agreed draw, or any other drawn result refunds each player in full.",
  },
  {
    icon: "lightning",
    label: "First move",
    value: `${MATCH_RULES.firstMoveSeconds} seconds`,
    note: `${MATCH_RULES.offlineFirstMoveMinutes} minutes if you were matched while the app was closed. Miss it and the match is aborted with stakes refunded.`,
  },
  {
    icon: "arrow-counter-clockwise",
    label: "Disconnect",
    value: "Your clock keeps running",
    note: "Reconnect before it reaches 0:00 to play on. If it runs out, you lose on time.",
  },
];

/** The rules a player match runs on, each sourced from MATCH_RULES / SETTLEMENT. Static: nothing here is a live figure. */
export function MatchRules() {
  return (
    <Card className="match-sheet">
      <dl className="match-rules">
        {rules.map((rule) => (
          <div key={rule.label} className="match-rule">
            <dt>
              <Icon name={rule.icon} size={16} />
              {rule.label}
            </dt>
            <dd>
              <p className="match-rule-value">{rule.value}</p>
              <p className="match-rule-note">{rule.note}</p>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
