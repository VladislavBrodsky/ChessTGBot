import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { MetaLine } from "@/components/ui/MetaLine";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
const settlementSteps = [
  { title: "Choose a stake", detail: "Both players commit the same USDT amount", icon: "coins" as const },
  { title: "Play the match", detail: "A decided result settles the combined pot", icon: "sword" as const },
  { title: "See the receipt", detail: "The winner’s app balance receives 95%", icon: "shield-check" as const },
];

export function ArenaBento() {
  return (
    <div className="arena-bento">
      {/* ── 1. Real crypto PvP wagers ── */}
      <Card className="arena-card sm:col-span-2">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="accent" icon="lightning">
              Real-time PvP Arena
            </Badge>
            <MetaLine items="From 1 USDT · 95% Winner Payout" />
          </div>
          <h3 className="arena-card-title arena-card-title-lg">
            Real crypto chess with instant Telegram matchmaking
          </h3>
          <p>
            Put your tactical mind to work. Choose Bullet, Blitz, or Rapid, set your stake, and play rivals worldwide. Both players commit equal USDT — the winner claims 95% of the combined pot directly to their platform balance.
          </p>
        </div>

        {/* Illustrative settlement math, not a player transaction */}
        <div className="arena-panel">
          <div className="arena-panel-heading">
            <span className="flex items-center gap-2 font-semibold text-fg">
              <i className="size-2 rounded-full bg-win-fill" aria-hidden="true" />
              Example Blitz Match 3+2
            </span>
            <MetaLine items="Illustrative $25 stakes" />
          </div>
          <dl className="arena-pot">
            <div>
              <dt>Player Stake</dt>
              <dd><NumberTicker value={25} prefix="$" decimalPlaces={2} /></dd>
              <dd>Equal stake</dd>
            </div>
            <div>
              <dt>Combined Pot</dt>
              <dd><NumberTicker value={50} prefix="$" decimalPlaces={2} /></dd>
              <dd>Locked in pot</dd>
            </div>
            <div data-highlight>
              <dt>Winner Payout</dt>
              <dd><NumberTicker value={47.5} prefix="+$" decimalPlaces={2} /></dd>
              <dd>95% payout</dd>
            </div>
          </dl>
        </div>
      </Card>

      {/* ── 2. Mystery boxes: two rows tall on desktop so the wide card beside it has no empty band ── */}
      <Card className="arena-card arena-vault-card lg:row-span-2">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="accent" icon="gift">
              Free Mystery Box
            </Badge>
            <span className="arena-card-status">One per account</span>
          </div>
          <h3 className="arena-card-title">
            Play 3 games to earn a Mystery Box
          </h3>
          <p>
            Complete three qualifying games to claim a free box. The current reward is XP, a 24-hour XP boost, or a gold profile border.
          </p>
        </div>

        <div className="arena-vault" aria-hidden="true">
          <span className="arena-vault-core"><Icon name="gift" size={18} /></span>
          <OrbitingCircles radius={38} duration={12} iconSize={24} path>
            <span className="arena-vault-token"><Icon name="sparkle" size={12} /></span>
            <span className="arena-vault-token"><Icon name="lightning" size={12} /></span>
          </OrbitingCircles>
          <OrbitingCircles radius={58} reverse duration={18} iconSize={24} path>
            <span className="arena-vault-token"><Icon name="crown-simple" size={12} /></span>
            <span className="arena-vault-token"><Icon name="trophy" size={12} /></span>
          </OrbitingCircles>
        </div>

        <ul className="arena-list">
          <li>
            <span><i className="bg-caution-soft" aria-hidden="true" />XP reward</span>
            <strong>250 XP</strong>
          </li>
          <li>
            <span><i className="bg-premium-soft" aria-hidden="true" />XP boost</span>
            <strong>24 hours</strong>
          </li>
          <li>
            <span><i className="bg-fg-muted" aria-hidden="true" />Profile border</span>
            <strong>Gold style</strong>
          </li>
        </ul>
      </Card>

      {/* ── 3. Leaderboards ── */}
      <Card className="arena-card">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="neutral" icon="trophy">
              Global ELO
            </Badge>
            <span className="arena-card-status">Season 1</span>
          </div>
          <h3 className="arena-card-title">Climb the Leaderboard</h3>
          <p>
            Every rated result updates your ELO and your position on the leaderboard.
          </p>
        </div>
        <ol className="arena-list arena-leaderboard">
          <li>
            <span className="font-semibold text-fg">Play a rated match</span>
            <strong>Record a result</strong>
          </li>
          <li>
            <span>Build your rating</span>
            <strong>Track ELO</strong>
          </li>
          <li>
            <span>Compare progress</span>
            <strong>View ranks</strong>
          </li>
        </ol>
      </Card>

      {/* ── 4. Referral tiers ── */}
      <Card className="arena-card">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="accent" icon="users-three">
              Affiliate
            </Badge>
            <span className="arena-card-status">Passive</span>
          </div>
          <h3 className="arena-card-title">Earn 2% Match Rake</h3>
          <p>
            Share your personal invite link once and collect lifetime commissions across 6 tiers.
          </p>
        </div>
        <div className="arena-panel arena-panel-row">
          <div>
            <strong className="block text-fg">6 Levels</strong>
            <span className="text-fg-muted">To tier 6</span>
          </div>
          <span className="poster text-stat text-fg">
            <NumberTicker value={2} suffix="%" />
          </span>
        </div>
      </Card>

      {/* ── 5. Academy ── */}
      <Card className="arena-card">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="neutral" icon="graduation-cap">
              Academy
            </Badge>
            <span className="arena-card-status">100 Levels</span>
          </div>
          <h3 className="arena-card-title">100 Levels &amp; AI</h3>
          <p>
            Sharpen openings, forks, pins, and endgames with unlimited free Stockfish A.I. practice.
          </p>
        </div>
        <Link href="/academy" className="arena-panel arena-panel-row arena-panel-link">
          <span>Explore tracks</span>
          <Icon name="arrow-right" size={16} />
        </Link>
      </Card>

      {/* ── 6. Settlement steps: closes the grid beside the Academy card ── */}
      <Card className="arena-card arena-activity sm:col-span-2">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="accent" icon="lightning">
              Match Settlement
            </Badge>
            <span className="flex items-center gap-1.5 text-caption font-semibold text-fg">
              <i className="size-2 rounded-full bg-win-fill" aria-hidden="true" />
              Explained
            </span>
          </div>
          <h3 className="arena-card-title">
            Equal stakes. A clear winner receipt
          </h3>
          <p>
            Follow the wager flow before playing. The example beside this card explains the steps; it is not a live transaction feed.
          </p>
          <div className="arena-activity-foot">
            <span>95% winner pot</span>
            <strong>Credited to app balance</strong>
          </div>
        </div>

        <div className="arena-event-stream">
          <div className="grid gap-2.5">
            {settlementSteps.map((item) => (
              <div key={item.title} className="arena-event">
                <span className="arena-event-icon"><Icon name={item.icon} size={14} /></span>
                <div className="arena-event-main">
                  <div><strong>{item.title}</strong></div>
                  <div><span>{item.detail}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
