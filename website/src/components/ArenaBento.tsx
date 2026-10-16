import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { MetaLine } from "@/components/ui/MetaLine";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";
import { AnimatedList } from "@/components/magicui/animated-list";


const liveFeed = [
  {
    id: "live-1",
    player: "@CryptoMorphy",
    action: "Won 3+2 Blitz match",
    payout: "+$47.50 USDT",
    time: "1m ago",
    badge: "Blitz 3+2",
    icon: "lightning" as const,
  },
  {
    id: "live-2",
    player: "@Magnus_GRAM",
    action: "Won 5+3 Rapid match",
    payout: "+$95.00 USDT",
    time: "3m ago",
    badge: "Rapid 5+3",
    icon: "trophy" as const,
  },
  {
    id: "live-3",
    player: "@gram_tactician",
    action: "Unboxed King’s Vault",
    payout: "+50 GRAM",
    time: "5m ago",
    badge: "Jackpot Drop",
    icon: "gift" as const,
  },
  {
    id: "live-4",
    player: "@pawn_storm",
    action: "Won 1+0 Bullet match",
    payout: "+$19.00 USDT",
    time: "7m ago",
    badge: "Bullet 1+0",
    icon: "lightning" as const,
  },
  {
    id: "live-5",
    player: "@gm_vlad",
    action: "Confirmed withdrawal",
    payout: "$150.00 USDT",
    time: "11m ago",
    badge: "Telegram Bot",
    icon: "arrow-up-right" as const,
  },
  {
    id: "live-6",
    player: "@queen_gambit",
    action: "Climbed to 2410 ELO",
    payout: "Grandmaster Tier",
    time: "14m ago",
    badge: "Season 1",
    icon: "shield-check" as const,
  },
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

        {/* Decided match settlement with count-up figures */}
        <div className="arena-panel">
          <div className="arena-panel-heading">
            <span className="flex items-center gap-2 font-semibold text-fg">
              <i className="size-2 rounded-full bg-win-fill" aria-hidden="true" />
              Live Blitz Match 3+2
            </span>
            <MetaLine items="Match ID #48291 · Decided" />
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
              Mystery Vaults
            </Badge>
            <span className="arena-card-status">Daily Drops</span>
          </div>
          <h3 className="arena-card-title">
            Win up to 1,000 GRAM in Mystery Boxes
          </h3>
          <p>
            Turn your earned XP into real rewards. Unlock mystery chests with chances to unbox GRAM prizes, 2× XP boosts, and exclusive 3D board pieces.
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
            <span><i className="bg-caution-soft" aria-hidden="true" />King’s Dominion Chest</span>
            <strong><NumberTicker value={1000} suffix=" GRAM" /> Jackpot</strong>
          </li>
          <li>
            <span><i className="bg-premium-soft" aria-hidden="true" />Queen’s Treasury Chest</span>
            <strong>1-Month Premium + Drops</strong>
          </li>
          <li>
            <span><i className="bg-fg-muted" aria-hidden="true" />Knight’s Gambit Chest</span>
            <strong>2× XP Boosts &amp; Skins</strong>
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
            Every rated victory builds your ELO ranking and pushes you up the ladder toward weekly tournament prizes.
          </p>
        </div>
        <ol className="arena-list arena-leaderboard">
          <li>
            <span className="font-semibold text-fg">#1 Morphy · 2480</span>
            <strong><NumberTicker value={2450} prefix="+$" /></strong>
          </li>
          <li>
            <span>#2 Magnus · 2415</span>
            <strong><NumberTicker value={1890} prefix="+$" /></strong>
          </li>
          <li>
            <span>#3 Pawn · 2380</span>
            <strong><NumberTicker value={1240} prefix="+$" /></strong>
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

      {/* ── 6. Live arena activity: closes the grid beside the Academy card, copy beside the stream ── */}
      <Card className="arena-card arena-activity sm:col-span-2">
        <div className="arena-card-copy">
          <div className="arena-card-meta">
            <Badge tone="accent" icon="lightning">
              Live Arena Activity
            </Badge>
            <span className="flex items-center gap-1.5 text-caption font-semibold text-fg">
              <i className="size-2 rounded-full bg-win-fill" aria-hidden="true" />
              Real-time
            </span>
          </div>
          <h3 className="arena-card-title">
            Real players. Instant on-chain payouts
          </h3>
          <p>
            Live matches finishing, pots settled, and mystery chests unboxed around the clock.
          </p>
          <div className="arena-activity-foot">
            <span>95% winner pot</span>
            <strong>Decided instantly</strong>
          </div>
        </div>

        <div className="arena-event-stream">
          <AnimatedList delay={2400} maxItems={3}>
            {liveFeed.map((item) => (
              <figure key={item.id} className="arena-event">
                <span className="arena-event-icon"><Icon name={item.icon} size={14} /></span>
                <div className="arena-event-main">
                  <div><strong>{item.player}</strong><span>{item.time}</span></div>
                  <div><span>{item.action}</span><strong>{item.payout}</strong></div>
                </div>
              </figure>
            ))}
          </AnimatedList>
        </div>
      </Card>
    </div>
  );
}
