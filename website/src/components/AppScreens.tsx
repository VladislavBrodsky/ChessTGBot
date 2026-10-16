import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { MetaLine } from "@/components/ui/MetaLine";

/**
 * Real Mini App screens, captured at 390 × 844 @2x from the dev-mock build with sample data
 * (2026-10-16). Every name, balance and result in them is an example, so the card always says so;
 * never present these as live activity. The board shot is a free A.I. practice game.
 */
const APP_SCREENS = {
  lobby: {
    title: "Choose a stake",
    note: "A $5.00 stake shows a $9.50 payout if you win.",
    alt: "Example Mini App lobby: a 5 USDT stake and a 10-minute game are selected, and the payout if you win reads $9.50. The balance is sample data.",
  },
  matchmaking: {
    title: "Find an opponent",
    note: "You are paired with the next player waiting at your stake and time.",
    alt: "Example Mini App matchmaking screen searching for an opponent at a 5 USDT stake, with a Cancel Search button.",
  },
  game: {
    title: "Play on the board",
    note: "Shown: free practice against the A.I. coach.",
    alt: "Example Mini App game in progress against the A.I. coach: the board, both clocks, the move history and Resign and Draw buttons.",
  },
  result: {
    title: "See your result",
    note: "Winner receives 95% of the pot, including their stake.",
    alt: "Example Mini App result after a won 5 USDT match: rating up 12, 9.50 USDT payout received and 50 XP. Sample data.",
  },
  fees: {
    title: "Check the fees",
    note: "3% platform fee and 2% referral allocation per pot.",
    alt: "Example Mini App fee sheet: paid matches allocate 3% of the pot to the platform and 2% to referrals, and the winner receives the remaining 95%.",
  },
  academy: {
    title: "Train in the Academy",
    note: "Puzzles, lessons and a daily challenge.",
    alt: "Example Mini App Academy: course progress, a daily mate-in-one challenge and the tactics level grid. Sample progress.",
  },
  wallet: {
    title: "Track your balance",
    note: "USDT balance, deposits, withdrawals and history.",
    alt: "Example Mini App wallet: a sample USDT balance, Deposit and Withdraw buttons, fees and transaction history.",
  },
} as const;

export type AppScreenKey = keyof typeof APP_SCREENS;

/** Intrinsic size of every capture in public/app-screens. */
const SCREEN_WIDTH = 780;
const SCREEN_HEIGHT = 1688;

export function AppScreens({ screens, className = "" }: { screens: readonly AppScreenKey[]; className?: string }) {
  return (
    <Card className={`app-screens ${className}`}>
      <div className="app-screens-head">
        <p className="app-screens-label">Example screens from the Mini App</p>
        <MetaLine className="app-screens-meta" items={["Sample names and balances", "Not live data"]} />
      </div>
      {/* Below 1024px the row scrolls sideways, so it is focusable for keyboard scrolling. */}
      <ol className="app-screens-list" tabIndex={0} aria-label="Example Mini App screens">
        {screens.map((key) => {
          const screen = APP_SCREENS[key];
          return (
            <li key={key} className="app-screens-item">
              <figure className="app-screens-figure">
                <div className="app-screens-frame">
                  <Image
                    src={`/app-screens/${key}.webp`}
                    width={SCREEN_WIDTH}
                    height={SCREEN_HEIGHT}
                    sizes="(min-width: 1024px) 17rem, 15rem"
                    alt={screen.alt}
                  />
                </div>
                <figcaption className="app-screens-caption">
                  <strong>{screen.title}</strong>
                  <span>{screen.note}</span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
