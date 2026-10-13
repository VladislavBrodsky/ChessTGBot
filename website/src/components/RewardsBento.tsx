import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/icons";

const steps = [
  { number: "01", title: "Join the free challenge", body: "Open Web3Chess in Telegram and join before starting a game." },
  { number: "02", title: "Finish three AI games", body: "Each free game needs at least 10 moves per side. Wins, losses and draws count." },
  { number: "03", title: "Open your box", body: "Claim one in-app reward. See the exact odds in the app before you play." },
];

export function RewardsBento() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="p-6 sm:p-8">
        <Badge tone="accent" icon="gift">Free first-three challenge</Badge>
        <h3 className="mt-5 text-heading-sm font-medium text-fg-default">Three games. One mystery box.</h3>
        <p className="mt-3 text-body text-fg-muted max-w-[44ch]">
          Start against the AI for free. Complete three qualifying games to reveal XP, a 24-hour XP boost, or a gold profile border. No deposit is needed.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map((step) => (
            <li key={step.number} className="flex gap-4 border-t border-line pt-4">
              <span className="font-mono text-caption text-fg-muted">{step.number}</span>
              <div>
                <p className="text-body font-semibold text-fg-default">{step.title}</p>
                <p className="mt-1 text-body-sm text-fg-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/play" className="mt-6 inline-flex min-h-11 items-center gap-2 text-label font-semibold text-fg-default underline underline-offset-4">
          Start playing <Icon name="arrow-right" size={16} />
        </Link>
      </Card>
      <Card className="p-6 sm:p-8">
        <Badge tone="neutral" icon="lightning">Optional player matches</Badge>
        <h3 className="mt-5 text-heading-sm font-medium text-fg-default">Choose your next challenge.</h3>
        <p className="mt-3 text-body text-fg-muted max-w-[44ch]">
          Practice stays free. If you choose a USDT-staked match, review the stake and payout terms before joining. The winner receives 95% of the combined pot in their in-app balance.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-inset p-4">
          <p className="text-caption text-fg-muted">Illustrative equal-stake example</p>
          <p className="mt-2 text-heading-sm font-medium text-fg-default">$25 + $25 = $50 pot</p>
          <p className="mt-1 text-body text-fg-default">Winner receives $47.50 USDT in-app.</p>
        </div>
        <Link href="/wagers" className="mt-6 inline-flex min-h-11 items-center gap-2 text-label font-semibold text-fg-default underline underline-offset-4">
          Read stakes and fees <Icon name="arrow-right" size={16} />
        </Link>
      </Card>
    </div>
  );
}
