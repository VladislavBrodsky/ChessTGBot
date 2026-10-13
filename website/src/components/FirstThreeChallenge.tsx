import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/icons";

const steps = [
  { number: "01", title: "Join the free challenge", body: "Open Web3Chess in Telegram and join before starting a game." },
  { number: "02", title: "Finish three AI games", body: "Each free game needs at least 10 moves per side. Wins, losses and draws count." },
  { number: "03", title: "Open your box", body: "Claim one in-app reward. See the exact odds in the app before you play." },
];

/** The current production challenge is additive to the existing marketing modules. */
export function FirstThreeChallenge() {
  return (
    <Card className="first-three-challenge">
      <div className="first-three-intro">
        <Badge tone="accent" icon="gift">Free first-three challenge</Badge>
        <h3 className="text-heading-sm font-medium">Three games. One mystery box</h3>
        <p className="text-body text-fg-muted">
          Start against the AI for free. Complete three qualifying games to reveal XP, a 24-hour XP boost, or a gold profile border. No deposit is needed.
        </p>
        <ButtonLink href="/play" variant="secondary">
          Start playing <Icon name="arrow-right" size={16} />
        </ButtonLink>
      </div>
      <ol className="first-three-steps">
        {steps.map((step) => (
          <li key={step.number}>
            <span className="text-caption text-fg-muted font-mono">{step.number}</span>
            <div className="min-w-0">
              <p className="text-body font-semibold">{step.title}</p>
              <p className="text-body-sm text-fg-muted mt-1">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
