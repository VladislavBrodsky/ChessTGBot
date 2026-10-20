import { Icon } from "@/icons";

/** A product-backed invitation. No simulated players, activity, or online counts. */
export function PlayOfferStrip() {
  return (
    <div className="live-proof" aria-label="Free play and Mystery Box offer">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-1 text-caption font-semibold text-fg">
        <Icon name="gift" size={14} />
        Free to start
      </span>
      <span className="text-caption text-fg-muted">
        Play 3 qualifying games to earn one Mystery Box
      </span>
      <span className="text-caption text-fg-muted">
        Rewards: XP, an XP boost, or a profile border
      </span>
    </div>
  );
}
