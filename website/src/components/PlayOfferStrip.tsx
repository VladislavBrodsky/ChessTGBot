import { Icon, type IconName } from "@/icons";

const REWARDS: { icon: IconName; label: string }[] = [
  { icon: "lightning", label: "XP" },
  { icon: "trend-up", label: "XP boost" },
  { icon: "crown-simple", label: "Profile border" },
];

/**
 * The free Mystery Box offer under the hero CTA. A static explainer, not a progress meter:
 * the three game marks illustrate the rule and never show simulated activity.
 */
export function PlayOfferStrip() {
  return (
    <section className="offer-card" aria-labelledby="offer-card-title">
      <div className="offer-card-head">
        <span className="offer-card-icon" aria-hidden="true">
          <Icon name="gift" size={20} />
        </span>
        <div className="offer-card-copy">
          <span className="offer-card-eyebrow">Free to start, no deposit needed</span>
          <p id="offer-card-title" className="offer-card-title">
            Play 3 qualifying games to earn one Mystery Box
          </p>
        </div>
      </div>

      <ol className="offer-steps" aria-hidden="true">
        {[1, 2, 3].map((game) => (
          <li key={game} className="offer-step">
            <span className="offer-step-mark">{game}</span>
          </li>
        ))}
        <li className="offer-step offer-step--box">
          <span className="offer-step-mark">
            <Icon name="gift" size={14} />
          </span>
        </li>
      </ol>

      <div className="offer-card-rewards">
        <span className="offer-card-label">Reveals one</span>
        <ul className="offer-rewards" aria-label="Possible rewards">
          {REWARDS.map((reward) => (
            <li key={reward.label} className="offer-reward">
              <Icon name={reward.icon} size={16} />
              {reward.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
